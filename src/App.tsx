/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { GroupSidebar } from './components/GroupSidebar';
import { ChatArea } from './components/ChatArea';
import { GroupMembersDrawer } from './components/GroupMembersDrawer';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { GroupManageModal } from './components/GroupManageModal';
import { ShareGroupModal } from './components/ShareGroupModal';
import { UserProfileModal } from './components/UserProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';
import { DirectChatContainer, ActiveDirectChatSession } from './components/DirectChatContainer';
import { Group, ChatMessage, AppUser, InAppNotification, DirectChat } from './types';
import { subscribeToGroups, addMemberToGroup, createGroup } from './services/groupService';
import { subscribeToMessages, sendMessage } from './services/chatService';
import { subscribeToUsers } from './services/userService';
import { subscribeToUserDirectChats, getOrCreateDirectChat } from './services/directChatService';
import { soundManager } from './utils/audioNotification';
import { MessageSquare, Plus, Sparkles, Users, Compass, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GaySiamLogo } from './components/GaySiamLogo';

function MainApp() {
  const { currentUser, loading: authLoading, updateCurrentUserState } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, AppUser>>({});
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [activeDirectChatSessions, setActiveDirectChatSessions] = useState<ActiveDirectChatSession[]>([]);

  // Modals & Panels
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewProfileUser, setViewProfileUser] = useState<AppUser | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // In-app notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const prevMessagesCountRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Subscribe to all groups
  useEffect(() => {
    const unsubscribe = subscribeToGroups((updatedGroups) => {
      setGroups(updatedGroups);

      // Default select the first group if nothing is selected
      setSelectedGroupId((prev) => {
        if (prev && updatedGroups.some((g) => g.id === prev)) {
          return prev;
        }
        if (updatedGroups.length > 0) {
          // Prefer a group the user belongs to
          if (currentUser) {
            const joined = updatedGroups.find((g) => g.memberIds.includes(currentUser.id));
            if (joined) return joined.id;
          }
          return updatedGroups[0].id;
        }
        return null;
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [currentUser]);

  // Subscribe to all users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((map) => {
      setUsersMap(map);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Subscribe to direct chats for current user
  useEffect(() => {
    if (!currentUser) {
      setDirectChats([]);
      return;
    }
    const unsubscribe = subscribeToUserDirectChats(currentUser.id, (chats) => {
      setDirectChats(chats);
    });

    return () => {
      unsubscribe?.();
    };
  }, [currentUser?.id]);

  const handleStartDirectChat = async (targetUser: AppUser) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (targetUser.id === currentUser.id) return;

    try {
      const chat = await getOrCreateDirectChat(currentUser, targetUser);
      setActiveDirectChatSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.chat.id === chat.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            chat,
            targetUser,
            isMinimized: false,
          };
          return updated;
        } else {
          const currentList = prev.slice(-2);
          return [
            ...currentList,
            {
              chat,
              targetUser,
              isMinimized: false,
            },
          ];
        }
      });
    } catch (err) {
      console.error('Failed to open direct chat:', err);
    }
  };

  // Subscribe to messages in current selected group
  useEffect(() => {
    if (!selectedGroupId) {
      setMessages([]);
      return;
    }

    prevMessagesCountRef.current = 0;
    hasInitializedRef.current = false;

    const unsubscribe = subscribeToMessages(selectedGroupId, (newMessages) => {
      // Sound and notifications for newly arrived messages
      if (hasInitializedRef.current && newMessages.length > prevMessagesCountRef.current) {
        const latest = newMessages[newMessages.length - 1];
        if (latest && currentUser && latest.senderId !== currentUser.id) {
          soundManager.playChime();
        }
      }

      hasInitializedRef.current = true;
      prevMessagesCountRef.current = newMessages.length;
      setMessages(newMessages);
    });

    return () => {
      unsubscribe?.();
    };
  }, [selectedGroupId, currentUser]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  // Handle Quick Join for explore tab and chat area
  const handleQuickJoinGroup = async (groupId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const groupToJoin = groups.find((g) => g.id === groupId) || (selectedGroupId === groupId ? selectedGroup : null);
    if (!groupToJoin) return;

    if (groupToJoin.isPrivate && groupToJoin.inviteCode) {
      setShowJoinGroupModal(true);
      return;
    }

    try {
      await addMemberToGroup(groupId, groupToJoin, currentUser.id);
      setSelectedGroupId(groupId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId && !g.memberIds.includes(currentUser.id)
            ? { ...g, memberIds: [...g.memberIds, currentUser.id] }
            : g
        )
      );
      soundManager.playSend();
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch {
        // safe
      }

      // Automatically post welcoming message to the room for all members to see!
      try {
        const welcomeText = `🎉 ยินดีต้อนรับสมาชิกใหม่ คุณ ${currentUser.displayName} เข้าสู่ห้อง ${groupToJoin.name} ชุมชน GaySiam! 🏳️‍🌈✨ มาร่วมพูดคุยทักทายกันได้เลยครับ 💖`;
        await sendMessage(groupId, currentUser, welcomeText);
      } catch (welcomeErr) {
        console.warn('Welcome message error:', welcomeErr);
      }
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  // Handle shared link query parameters (?group=...&code=...)
  useEffect(() => {
    if (groups.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetGroupId = params.get('group');
    const targetCode = params.get('code') || params.get('invite');

    if (targetGroupId) {
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (targetGroup) {
        setSelectedGroupId(targetGroup.id);

        if (currentUser && !targetGroup.memberIds.includes(currentUser.id)) {
          const canJoin =
            !targetGroup.isPrivate ||
            (targetCode &&
              targetGroup.inviteCode &&
              targetCode.toUpperCase() === targetGroup.inviteCode.toUpperCase());

          if (canJoin) {
            addMemberToGroup(targetGroup.id, targetGroup, currentUser.id)
              .then(() => {
                try {
                  confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
                } catch {
                  // safe
                }
              })
              .catch(console.error);
          }
        }
      }
    }
  }, [groups, currentUser]);

  // Auto seed first community group if completely empty and user is logged in
  useEffect(() => {
    if (groups.length === 0 && currentUser && !authLoading) {
      const timer = setTimeout(async () => {
        // Double check groups is still 0
        if (groups.length === 0) {
          try {
            await createGroup(
              {
                name: 'ห้องพูดคุยทั่วไป & ต้อนรับสมาชิก',
                description: 'พื้นที่สนทนาแลกเปลี่ยนความคิดเห็น สอบถาม และทดสอบส่งไฟล์รูปภาพและเอกสาร',
                avatar: '🎉',
                color: 'indigo',
                isPrivate: false,
                category: 'general',
              },
              currentUser
            );
          } catch {
            // Already created or handled
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [groups.length, currentUser, authLoading]);

  const handleOpenUserProfile = (userId: string) => {
    if (currentUser && userId === currentUser.id) {
      setViewProfileUser(usersMap[currentUser.id] || currentUser);
      return;
    }
    const targetUser = usersMap[userId];
    if (targetUser) {
      setViewProfileUser(targetUser);
    } else {
      setViewProfileUser({
        id: userId,
        displayName: 'สมาชิก',
        email: '',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setShowAuthModal(true)}
        onToggleMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
        userProfile={currentUser ? (usersMap[currentUser.id] || currentUser) : null}
        directChats={directChats}
        usersMap={usersMap}
        onStartDirectChat={handleStartDirectChat}
        onOpenMyProfile={() => {
          if (!currentUser) {
            setShowAuthModal(true);
          } else {
            setViewProfileUser(usersMap[currentUser.id] || currentUser);
          }
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Desktop + Mobile slide-over) */}
        <div
          className={`fixed inset-y-0 left-0 z-30 transform lg:static lg:transform-none transition-transform duration-300 ease-in-out ${
            showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <GroupSidebar
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={(id) => {
              setSelectedGroupId(id);
              setShowMobileSidebar(false);
            }}
            onOpenCreateGroup={() => {
              if (!currentUser) {
                setShowAuthModal(true);
              } else {
                setShowCreateGroupModal(true);
              }
              setShowMobileSidebar(false);
            }}
            onOpenJoinGroup={() => {
              if (!currentUser) {
                setShowAuthModal(true);
              } else {
                setShowJoinGroupModal(true);
              }
              setShowMobileSidebar(false);
            }}
            onQuickJoinGroup={handleQuickJoinGroup}
          />
        </div>

        {/* Mobile backdrop */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-xs"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Central Chat or Empty Placeholder */}
        {selectedGroup ? (
          <div className="flex-1 flex overflow-hidden">
            <ChatArea
              group={selectedGroup}
              messages={messages}
              usersMap={usersMap}
              onOpenManageGroup={() => setShowManageModal(true)}
              onOpenShareGroup={() => setShowShareModal(true)}
              onToggleMembersDrawer={() => setShowMembersDrawer(!showMembersDrawer)}
              onViewImage={(url, name) => setLightboxImage({ url, name })}
              onOpenUserProfile={handleOpenUserProfile}
              onJoinCurrentGroup={() => handleQuickJoinGroup(selectedGroup.id)}
            />

            {/* Right Group Members & Media Drawer */}
            {showMembersDrawer && (
              <GroupMembersDrawer
                group={selectedGroup}
                messages={messages}
                usersMap={usersMap}
                onClose={() => setShowMembersDrawer(false)}
                onViewImage={(url, name) => setLightboxImage({ url, name })}
                onOpenShareGroup={() => setShowShareModal(true)}
                onOpenUserProfile={handleOpenUserProfile}
                onStartDirectChat={handleStartDirectChat}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="flex justify-center mb-4">
              <GaySiamLogo size={76} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              ยินดีต้อนรับสู่ GaySiam
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6">
              เลือกกลุ่มจากแถบด้านซ้าย หรือสร้างกลุ่มใหม่เพื่อเริ่มแชทแบบเรียลไทม์กับเพื่อนของคุณ
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowAuthModal(true);
                  } else {
                    setShowCreateGroupModal(true);
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                สร้างกลุ่มใหม่
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowAuthModal(true);
                  } else {
                    setShowJoinGroupModal(true);
                  }
                }}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all"
              >
                <Hash className="w-4 h-4" />
                ใส่รหัสเชิญเข้ากลุ่ม
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={(newGroup) => {
            setSelectedGroupId(newGroup.id);
          }}
        />
      )}

      {showJoinGroupModal && (
        <JoinGroupModal
          groups={groups}
          onClose={() => setShowJoinGroupModal(false)}
          onJoined={(joined) => {
            setSelectedGroupId(joined.id);
          }}
        />
      )}

      {showManageModal && selectedGroup && (
        <GroupManageModal
          group={selectedGroup}
          usersMap={usersMap}
          onClose={() => setShowManageModal(false)}
          onGroupDeleted={() => {
            setSelectedGroupId(null);
          }}
          onOpenUserProfile={handleOpenUserProfile}
        />
      )}

      {showShareModal && selectedGroup && (
        <ShareGroupModal
          group={selectedGroup}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* User Profile View Modal */}
      {viewProfileUser && (
        <UserProfileModal
          user={usersMap[viewProfileUser.id] || viewProfileUser}
          isCurrentUser={Boolean(currentUser && currentUser.id === viewProfileUser.id)}
          onClose={() => setViewProfileUser(null)}
          onOpenEdit={() => {
            setShowEditProfileModal(true);
          }}
          onViewImage={(url, name) => setLightboxImage({ url, name })}
          onStartDirectChat={handleStartDirectChat}
        />
      )}

      {/* Edit My Profile Modal */}
      {showEditProfileModal && currentUser && (
        <EditProfileModal
          user={usersMap[currentUser.id] || currentUser}
          onClose={() => setShowEditProfileModal(false)}
          onUpdated={(updated) => {
            updateCurrentUserState(updated);
            setUsersMap((prev) => ({
              ...prev,
              [updated.id]: updated,
            }));
            setViewProfileUser(updated);
            try {
              confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
            } catch {
              // safe
            }
          }}
        />
      )}

      {lightboxImage && (
        <ImageViewerModal
          imageUrl={lightboxImage.url}
          imageName={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* 1:1 Direct Chats (Facebook Messenger Style Floating Popups) */}
      <DirectChatContainer
        currentUser={currentUser}
        usersMap={usersMap}
        activeSessions={activeDirectChatSessions}
        setActiveSessions={setActiveDirectChatSessions}
        onOpenProfile={(u) => setViewProfileUser(u)}
        onViewImage={(url, name) => setLightboxImage({ url, name })}
      />

      {/* Toast Notifications */}
      <ToastContainer
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onSelectGroup={(id) => setSelectedGroupId(id)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
