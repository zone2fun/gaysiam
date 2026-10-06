import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { DirectChat, DirectMessage, AppUser, FileType } from '../types';

export const DIRECT_CHATS_PATH = 'direct_chats';

/**
 * Generate a deterministic compound chat ID for any pair of user IDs
 */
export function getDirectChatId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

/**
 * Get or create a 1:1 conversation between two users
 */
export async function getOrCreateDirectChat(
  currentUser: AppUser,
  targetUser: AppUser
): Promise<DirectChat> {
  const chatId = getDirectChatId(currentUser.id, targetUser.id);
  const docRef = doc(db, DIRECT_CHATS_PATH, chatId);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DirectChat;
    }
  } catch (err) {
    // If not found or read check, proceed to create
    console.warn('Direct chat document not found yet, creating initial session...', err);
  }

  const now = new Date().toISOString();
  const newChat: DirectChat = {
    id: chatId,
    participantIds: [currentUser.id, targetUser.id],
    lastMessageText: '',
    lastMessageTime: now,
    lastSenderId: currentUser.id,
    unreadCount: {
      [currentUser.id]: 0,
      [targetUser.id]: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, newChat, { merge: true });
    return newChat;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DIRECT_CHATS_PATH}/${chatId}`);
  }
}

/**
 * Real-time listener for all direct chats involving the current user
 */
export function subscribeToUserDirectChats(
  userId: string,
  onUpdate: (chats: DirectChat[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(
      collection(db, DIRECT_CHATS_PATH),
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const chats: DirectChat[] = [];
        snapshot.forEach((docSnap) => {
          chats.push(docSnap.data() as DirectChat);
        });
        onUpdate(chats);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.GET, DIRECT_CHATS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DIRECT_CHATS_PATH);
  }
}

/**
 * Real-time listener for messages in a 1:1 direct chat
 */
export function subscribeToDirectMessages(
  chatId: string,
  onUpdate: (messages: DirectMessage[]) => void,
  onError?: (err: Error) => void
) {
  const path = `${DIRECT_CHATS_PATH}/${chatId}/messages`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: DirectMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push(docSnap.data() as DirectMessage);
        });
        onUpdate(messages);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Send a 1:1 direct message
 */
export async function sendDirectMessage(
  chatId: string,
  sender: AppUser,
  recipientId: string,
  text: string,
  attachment?: {
    dataUrl: string;
    name: string;
    type: FileType;
    size: number;
  }
): Promise<DirectMessage> {
  const messageId = 'dm_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const message: DirectMessage = {
    id: messageId,
    chatId,
    senderId: sender.id,
    senderName: sender.displayName || 'ผู้ใช้',
    senderPhoto: sender.photoURL || '',
    text: text.trim(),
    fileUrl: attachment?.dataUrl || '',
    fileName: attachment?.name || '',
    fileType: attachment?.type || 'none',
    fileSize: attachment?.size || 0,
    reactions: {},
    read: false,
    createdAt: now,
  };

  const msgDocRef = doc(db, `${DIRECT_CHATS_PATH}/${chatId}/messages`, messageId);
  const chatDocRef = doc(db, DIRECT_CHATS_PATH, chatId);

  try {
    await setDoc(msgDocRef, message);

    // Update parent conversation preview & unread count for recipient
    const snippet = message.text
      ? message.text.slice(0, 100)
      : message.fileName
      ? `[ไฟล์] ${message.fileName}`
      : 'ข้อความใหม่';

    await updateDoc(chatDocRef, {
      lastMessageText: snippet,
      lastMessageTime: now,
      lastSenderId: sender.id,
      updatedAt: now,
      [`unreadCount.${recipientId}`]: increment(1),
    });

    return message;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DIRECT_CHATS_PATH}/${chatId}/messages/${messageId}`);
  }
}

/**
 * Mark all messages in a 1:1 direct chat as read by current user
 */
export async function markDirectChatAsRead(chatId: string, userId: string) {
  const chatDocRef = doc(db, DIRECT_CHATS_PATH, chatId);
  try {
    await updateDoc(chatDocRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Add or remove emoji reaction on direct message
 */
export async function toggleDirectMessageReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string,
  currentReactions: Record<string, string[]> = {}
) {
  const msgDocRef = doc(db, `${DIRECT_CHATS_PATH}/${chatId}/messages`, messageId);
  const existingUsers = currentReactions[emoji] || [];
  const hasReacted = existingUsers.includes(userId);

  const updatedUsers = hasReacted
    ? existingUsers.filter((id) => id !== userId)
    : [...existingUsers, userId];

  const updatedReactions = { ...currentReactions };
  if (updatedUsers.length > 0) {
    updatedReactions[emoji] = updatedUsers;
  } else {
    delete updatedReactions[emoji];
  }

  try {
    await updateDoc(msgDocRef, { reactions: updatedReactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DIRECT_CHATS_PATH}/${chatId}/messages/${messageId}`);
  }
}
