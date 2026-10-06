import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { ChatMessage, AppUser, FileType } from '../types';
import { updateGroup } from './groupService';
import { soundManager } from '../utils/audioNotification';

export function subscribeToMessages(
  groupId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
) {
  const path = `groups/${groupId}/messages`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push(docSnap.data() as ChatMessage);
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

export async function sendMessage(
  groupId: string,
  sender: AppUser,
  text: string,
  attachment?: {
    dataUrl: string;
    name: string;
    type: FileType;
    size: number;
  },
  replyTo?: {
    id: string;
    text: string;
  }
): Promise<ChatMessage> {
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const message: ChatMessage = {
    id: messageId,
    groupId,
    senderId: sender.id,
    senderName: sender.displayName || 'ผู้ใช้',
    senderPhoto: sender.photoURL || '',
    text: text.trim(),
    fileUrl: attachment?.dataUrl || '',
    fileName: attachment?.name || '',
    fileType: attachment?.type || 'none',
    fileSize: attachment?.size || 0,
    replyToId: replyTo?.id || '',
    replyToText: replyTo?.text || '',
    reactions: {},
    isPinned: false,
    createdAt: now,
  };

  const path = `groups/${groupId}/messages/${messageId}`;
  try {
    const docRef = doc(db, 'groups', groupId, 'messages', messageId);
    await setDoc(docRef, message);

    // Play user send sound effect
    soundManager.playSend();

    // Update parent group snippet
    const snippet = attachment
      ? (attachment.type === 'image' ? '📷 ส่งรูปภาพ' : '📎 แนบไฟล์ ' + attachment.name)
      : text.trim().slice(0, 100);

    updateGroup(groupId, {
      lastMessageText: `${sender.displayName || 'ผู้ใช้'}: ${snippet}`,
      lastMessageTime: now,
    }).catch(console.error);

    return message;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMessage(groupId: string, messageId: string) {
  const path = `groups/${groupId}/messages/${messageId}`;
  try {
    const docRef = doc(db, 'groups', groupId, 'messages', messageId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleReaction(
  groupId: string,
  message: ChatMessage,
  emoji: string,
  userId: string
) {
  const path = `groups/${groupId}/messages/${message.id}`;
  try {
    const currentReactions = { ...(message.reactions || {}) };
    const currentUsers = currentReactions[emoji] || [];

    if (currentUsers.includes(userId)) {
      // Remove reaction
      const filtered = currentUsers.filter((u) => u !== userId);
      if (filtered.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = filtered;
      }
    } else {
      // Add reaction
      currentReactions[emoji] = [...currentUsers, userId];
    }

    const docRef = doc(db, 'groups', groupId, 'messages', message.id);
    await updateDoc(docRef, { reactions: currentReactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function togglePinMessage(
  groupId: string,
  messageId: string,
  isPinned: boolean,
  messageSnippet?: string
) {
  const path = `groups/${groupId}/messages/${messageId}`;
  try {
    const docRef = doc(db, 'groups', groupId, 'messages', messageId);
    await updateDoc(docRef, { isPinned });

    if (isPinned && messageSnippet) {
      await updateGroup(groupId, { pinnedMessage: messageSnippet });
    } else if (!isPinned) {
      await updateGroup(groupId, { pinnedMessage: '' });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
