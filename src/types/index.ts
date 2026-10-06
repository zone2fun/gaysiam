export type UserStatus = 'online' | 'offline' | 'away';

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  coverURL?: string;
  status?: UserStatus;
  lastSeen?: string;
  createdAt?: string;
  bio?: string;
  age?: number;
  height?: number;
  weight?: number;
  province?: string;
  country?: string;
  gayType?: string;
  gallery?: string[];
  pinnedGroupIds?: string[];
}

export type GroupCategory = 'general' | 'tech' | 'gaming' | 'education' | 'business' | 'lifestyle';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  isPrivate: boolean;
  inviteCode?: string;
  pinnedMessage?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  category?: GroupCategory;
  createdAt: string;
  updatedAt?: string;
}

export type FileType = 'image' | 'document' | 'audio' | 'none';

export interface MessageReaction {
  [emoji: string]: string[]; // emoji -> list of user UIDs
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: FileType;
  fileSize?: number;
  replyToId?: string;
  replyToText?: string;
  reactions?: MessageReaction;
  isPinned?: boolean;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  groupId: string;
  groupName: string;
  senderName: string;
  text: string;
  time: string;
  read: boolean;
}

export interface DirectChat {
  id: string;
  participantIds: string[];
  lastMessageText?: string;
  lastMessageTime?: string;
  lastSenderId?: string;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface DirectMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: FileType;
  fileSize?: number;
  reactions?: MessageReaction;
  read?: boolean;
  createdAt: string;
}
