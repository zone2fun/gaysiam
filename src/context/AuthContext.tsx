import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signInAsGuest, signOutUser } from '../firebase/config';
import { AppUser, UserStatus } from '../types';
import { syncUserProfile, updateUserStatus, togglePinGroup } from '../services/userService';

const SYSTEM_ADMIN_EMAIL = 'zone2fun@gmail.com';

interface AuthContextType {
  currentUser: AppUser | null;
  fbUser: FirebaseUser | null;
  loading: boolean;
  isSystemAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setStatus: (status: UserStatus) => Promise<void>;
  updateCurrentUserState: (updated: Partial<AppUser>) => void;
  togglePinGroup: (groupId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      setFbUser(user);
      if (user) {
        // 1. Try reading local cache first so UI renders immediately without flicker
        let cachedProfile: Partial<AppUser> | null = null;
        try {
          const raw = localStorage.getItem(`collabsphere_user_${user.uid}`);
          if (raw) cachedProfile = JSON.parse(raw);
        } catch {
          // safe
        }

        let appUser: AppUser = {
          id: user.uid,
          displayName: cachedProfile?.displayName || user.displayName || (user.isAnonymous ? 'ผู้เยี่ยมชม' : 'ผู้ใช้งาน'),
          email: user.email || (user.isAnonymous ? `${user.uid.slice(0, 6)}@guest.local` : ''),
          photoURL: cachedProfile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          status: 'online',
          lastSeen: new Date().toISOString(),
          createdAt: user.metadata.creationTime || new Date().toISOString(),
          ...cachedProfile,
        };

        // 2. Fetch the authoritative user profile from Firestore
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data() as AppUser;
            // Preserve user's custom displayName and photoURL from Firestore!
            appUser = {
              ...appUser,
              ...firestoreData,
              status: 'online',
              lastSeen: new Date().toISOString(),
            };
            await updateUserStatus(user.uid, 'online');
          } else {
            // Document doesn't exist yet in Firestore (first-time login) -> initialize it
            await syncUserProfile(appUser);
          }

          try {
            localStorage.setItem(`collabsphere_user_${user.uid}`, JSON.stringify(appUser));
          } catch {
            // safe
          }
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }

        setCurrentUser(appUser);

        // 3. Real-time listener for current user document updates in Firestore
        unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as AppUser;
            setCurrentUser((prev) => {
              const updated = {
                ...(prev || appUser),
                ...firestoreData,
              };
              try {
                localStorage.setItem(`collabsphere_user_${user.uid}`, JSON.stringify(updated));
              } catch {
                // safe
              }
              return updated;
            });
          }
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsubscribe();
    };
  }, []);

  // Update presence on visibility change
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus(currentUser.id, 'away').catch(console.error);
      } else {
        updateUserStatus(currentUser.id, 'online').catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  const handleLoginGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleLoginGuest = async (customName = 'ผู้ใช้ทดสอบ') => {
    try {
      setLoading(true);
      const res = await signInAsGuest(customName);
      if (res?.user) {
        localStorage.setItem(`collabsphere_name_${res.user.uid}`, customName);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await updateUserStatus(currentUser.id, 'offline');
      } catch {
        // ignore
      }
    }
    await signOutUser();
  };

  const setStatus = async (status: UserStatus) => {
    if (!currentUser) return;
    setCurrentUser((prev) => (prev ? { ...prev, status } : null));
    await updateUserStatus(currentUser.id, status);
  };

  const updateCurrentUserState = (updated: Partial<AppUser>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const handleTogglePinGroup = async (groupId: string) => {
    if (!currentUser) return;
    const currentPinned = currentUser.pinnedGroupIds || [];
    const isPinned = currentPinned.includes(groupId);
    const updatedPinned = isPinned
      ? currentPinned.filter((id) => id !== groupId)
      : [groupId, ...currentPinned];

    // Optimistically update current user state
    setCurrentUser((prev) => (prev ? { ...prev, pinnedGroupIds: updatedPinned } : null));

    await togglePinGroup(currentUser.id, groupId);
  };

  const isSystemAdmin = Boolean(
    currentUser && currentUser.email.toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        fbUser,
        loading,
        isSystemAdmin,
        loginWithGoogle: handleLoginGoogle,
        loginAsGuest: handleLoginGuest,
        logout: handleLogout,
        setStatus,
        updateCurrentUserState,
        togglePinGroup: handleTogglePinGroup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
