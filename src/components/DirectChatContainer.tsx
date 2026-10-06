import React, { useState, useEffect, useRef } from 'react';
import { DirectChat, AppUser } from '../types';
import { DirectChatPopup } from './DirectChatPopup';
import { 
  subscribeToUserDirectChats, 
  getOrCreateDirectChat 
} from '../services/directChatService';
import { soundManager } from '../utils/audioNotification';

export interface ActiveDirectChatSession {
  chat: DirectChat;
  targetUser: AppUser;
  isMinimized: boolean;
}

interface DirectChatContainerProps {
  currentUser: AppUser | null;
  usersMap: Record<string, AppUser>;
  activeSessions: ActiveDirectChatSession[];
  setActiveSessions: React.Dispatch<React.SetStateAction<ActiveDirectChatSession[]>>;
  onOpenProfile: (user: AppUser) => void;
  onViewImage: (url: string, name: string) => void;
}

export const DirectChatContainer: React.FC<DirectChatContainerProps> = ({
  currentUser,
  usersMap,
  activeSessions,
  setActiveSessions,
  onOpenProfile,
  onViewImage,
}) => {
  const prevChatsRef = useRef<Record<string, DirectChat>>({});
  const isFirstLoad = useRef(true);

  // Subscribe to all direct chats for the current user to auto-pop up incoming new messages!
  useEffect(() => {
    if (!currentUser) {
      setActiveSessions([]);
      return;
    }

    const unsubscribe = subscribeToUserDirectChats(currentUser.id, (chats) => {
      // Check for incoming new message from another user
      chats.forEach((chat) => {
        const prev = prevChatsRef.current[chat.id];
        const otherUserId = chat.participantIds.find((id) => id !== currentUser.id);
        const targetUser = otherUserId ? usersMap[otherUserId] : null;

        if (
          !isFirstLoad.current &&
          otherUserId &&
          targetUser &&
          chat.lastSenderId === otherUserId &&
          chat.lastMessageTime !== prev?.lastMessageTime
        ) {
          // An incoming message has arrived from targetUser!
          soundManager.playChime();

          setActiveSessions((prevSessions) => {
            const existingIndex = prevSessions.findIndex((s) => s.chat.id === chat.id);
            if (existingIndex >= 0) {
              // Update chat reference and unminimize on new message so user sees it!
              const updated = [...prevSessions];
              updated[existingIndex] = {
                ...updated[existingIndex],
                chat,
                isMinimized: false,
              };
              return updated;
            } else {
              // Auto-popup new chat session (Facebook style!)
              // Keep maximum 3 popups to prevent screen clutter
              const currentList = prevSessions.slice(-2);
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
        }

        prevChatsRef.current[chat.id] = chat;
      });

      isFirstLoad.current = false;
    });

    return () => {
      unsubscribe?.();
    };
  }, [currentUser?.id, usersMap]);

  if (!currentUser || activeSessions.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-2 sm:right-6 z-50 flex items-end gap-2.5 pointer-events-none max-w-full overflow-hidden pb-0 pr-1">
      {activeSessions.map((session) => (
        <div key={session.chat.id} className="pointer-events-auto">
          <DirectChatPopup
            chat={session.chat}
            currentUser={currentUser}
            targetUser={session.targetUser}
            isMinimized={session.isMinimized}
            onToggleMinimize={() => {
              setActiveSessions((prev) =>
                prev.map((s) =>
                  s.chat.id === session.chat.id ? { ...s, isMinimized: !s.isMinimized } : s
                )
              );
            }}
            onClose={() => {
              setActiveSessions((prev) => prev.filter((s) => s.chat.id !== session.chat.id));
            }}
            onOpenProfile={onOpenProfile}
            onViewImage={onViewImage}
          />
        </div>
      ))}
    </div>
  );
};
