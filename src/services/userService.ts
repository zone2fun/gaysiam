import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { AppUser, UserStatus } from '../types';

const USERS_PATH = 'users';

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const path = `${USERS_PATH}/${userId}`;
  try {
    const docRef = doc(db, USERS_PATH, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as AppUser;
  } catch (error) {
    console.warn('Error fetching user profile:', error);
    return null;
  }
}

export async function syncUserProfile(user: AppUser) {
  const path = `${USERS_PATH}/${user.id}`;
  try {
    const docRef = doc(db, USERS_PATH, user.id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      // Document already exists in Firestore!
      // NEVER overwrite custom displayName, photoURL, coverURL, bio, etc.
      // Only keep presence and lastSeen updated.
      await updateDoc(docRef, {
        status: user.status || 'online',
        lastSeen: new Date().toISOString(),
      });
      return snap.data() as AppUser;
    }

    // First time user registration in Firestore
    const dataToSync: Record<string, unknown> = {
      id: user.id,
      displayName: user.displayName || 'ผู้ใช้งาน',
      email: user.email || '',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
      status: user.status || 'online',
      lastSeen: new Date().toISOString(),
      createdAt: user.createdAt || new Date().toISOString(),
    };

    if (user.coverURL !== undefined) dataToSync.coverURL = user.coverURL;
    if (user.bio !== undefined) dataToSync.bio = user.bio;
    if (user.age !== undefined) dataToSync.age = user.age;
    if (user.height !== undefined) dataToSync.height = user.height;
    if (user.weight !== undefined) dataToSync.weight = user.weight;
    if (user.province !== undefined) dataToSync.province = user.province;
    if (user.country !== undefined) dataToSync.country = user.country;
    if (user.gayType !== undefined) dataToSync.gayType = user.gayType;
    if (user.gallery !== undefined) dataToSync.gallery = user.gallery;

    await setDoc(docRef, dataToSync);
    return dataToSync as unknown as AppUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<AppUser>) {
  const path = `${USERS_PATH}/${userId}`;
  try {
    const docRef = doc(db, USERS_PATH, userId);
    await updateDoc(docRef, {
      ...updates,
      lastSeen: new Date().toISOString(),
    });

    // Save to localStorage as well so page refreshes never flicker or revert
    try {
      const cached = localStorage.getItem(`collabsphere_user_${userId}`);
      const parsed = cached ? JSON.parse(cached) : {};
      localStorage.setItem(
        `collabsphere_user_${userId}`,
        JSON.stringify({ ...parsed, ...updates })
      );
    } catch {
      // safe
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function togglePinGroup(userId: string, groupId: string): Promise<string[]> {
  const path = `${USERS_PATH}/${userId}`;
  try {
    const docRef = doc(db, USERS_PATH, userId);
    const snap = await getDoc(docRef);
    let currentPinned: string[] = [];
    if (snap.exists()) {
      const data = snap.data() as AppUser;
      currentPinned = data.pinnedGroupIds || [];
    } else {
      const local = localStorage.getItem(`collabsphere_pinned_${userId}`);
      if (local) {
        try {
          currentPinned = JSON.parse(local as string);
        } catch {
          // safe
        }
      }
    }

    let newPinned: string[];
    if (currentPinned.includes(groupId)) {
      newPinned = currentPinned.filter((id) => id !== groupId);
    } else {
      newPinned = [groupId, ...currentPinned];
    }

    await updateDoc(docRef, {
      pinnedGroupIds: newPinned,
      lastSeen: new Date().toISOString(),
    });

    try {
      localStorage.setItem(`collabsphere_pinned_${userId}`, JSON.stringify(newPinned));
      const cached = localStorage.getItem(`collabsphere_user_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        localStorage.setItem(`collabsphere_user_${userId}`, JSON.stringify({ ...parsed, pinnedGroupIds: newPinned }));
      }
    } catch {
      // safe
    }

    return newPinned;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    const localStr = typeof window !== 'undefined' ? localStorage.getItem(`collabsphere_pinned_${userId}`) : null;
    let currentPinned: string[] = [];
    if (localStr) {
      try {
        currentPinned = JSON.parse(localStr as string);
      } catch {
        // safe
      }
    }
    const newPinned = currentPinned.includes(groupId)
      ? currentPinned.filter((id) => id !== groupId)
      : [groupId, ...currentPinned];
    localStorage.setItem(`collabsphere_pinned_${userId}`, JSON.stringify(newPinned));
    return newPinned;
  }
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const path = `${USERS_PATH}/${userId}`;
  try {
    const docRef = doc(db, USERS_PATH, userId);
    await updateDoc(docRef, {
      status,
      lastSeen: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToUsers(
  onUpdate: (users: Record<string, AppUser>) => void,
  onError?: (err: Error) => void
) {
  try {
    return onSnapshot(
      collection(db, USERS_PATH),
      (snapshot) => {
        const usersMap: Record<string, AppUser> = {};
        snapshot.forEach((docSnap) => {
          const u = docSnap.data() as AppUser;
          usersMap[u.id] = u;
        });
        onUpdate(usersMap);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.GET, USERS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERS_PATH);
  }
}
