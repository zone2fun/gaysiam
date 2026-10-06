import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Group, GroupCategory, AppUser } from '../types';

const GROUPS_PATH = 'groups';

export function subscribeToGroups(
  onUpdate: (groups: Group[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, GROUPS_PATH), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const groups: Group[] = [];
        snapshot.forEach((docSnap) => {
          groups.push(docSnap.data() as Group);
        });
        onUpdate(groups);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.GET, GROUPS_PATH);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, GROUPS_PATH);
  }
}

export async function createGroup(
  data: {
    name: string;
    description: string;
    avatar: string;
    color: string;
    isPrivate: boolean;
    category?: GroupCategory;
  },
  creator: AppUser
): Promise<Group> {
  const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = new Date().toISOString();

  const newGroup: Group = {
    id: groupId,
    name: data.name.trim(),
    description: data.description.trim() || 'ไม่มีคำอธิบายกลุ่ม',
    avatar: data.avatar || '💬',
    color: data.color || 'indigo',
    ownerId: creator.id,
    adminIds: [creator.id],
    memberIds: [creator.id],
    isPrivate: Boolean(data.isPrivate),
    inviteCode: inviteCode,
    category: data.category || 'general',
    pinnedMessage: '',
    lastMessageText: 'กลุ่มถูกสร้างขึ้นแล้ว ยินดีต้อนรับสมาชิกทุกคน!',
    lastMessageTime: now,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, GROUPS_PATH, groupId);
  try {
    await setDoc(docRef, newGroup);
    return newGroup;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${GROUPS_PATH}/${groupId}`);
  }
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Group>
) {
  const docRef = doc(db, GROUPS_PATH, groupId);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${GROUPS_PATH}/${groupId}`);
  }
}

export async function deleteGroup(groupId: string) {
  const docRef = doc(db, GROUPS_PATH, groupId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GROUPS_PATH}/${groupId}`);
  }
}

export async function addMemberToGroup(
  groupId: string,
  currentGroup: Group,
  targetUserId: string
) {
  if (currentGroup.memberIds.includes(targetUserId)) return;
  const updatedMemberIds = [...currentGroup.memberIds, targetUserId];
  await updateGroup(groupId, { memberIds: updatedMemberIds });
}

export async function removeMemberFromGroup(
  groupId: string,
  currentGroup: Group,
  targetUserId: string
) {
  // Prevent removing group owner
  if (targetUserId === currentGroup.ownerId) {
    throw new Error('ไม่สามารถลบเจ้าของกลุ่มได้');
  }

  const updatedMemberIds = currentGroup.memberIds.filter((id) => id !== targetUserId);
  const updatedAdminIds = currentGroup.adminIds.filter((id) => id !== targetUserId);

  await updateGroup(groupId, {
    memberIds: updatedMemberIds,
    adminIds: updatedAdminIds,
  });
}

export async function toggleGroupAdmin(
  groupId: string,
  currentGroup: Group,
  targetUserId: string,
  makeAdmin: boolean
) {
  let updatedAdminIds = [...currentGroup.adminIds];
  if (makeAdmin) {
    if (!updatedAdminIds.includes(targetUserId)) {
      updatedAdminIds.push(targetUserId);
    }
  } else {
    // Cannot demote group owner
    if (targetUserId === currentGroup.ownerId) {
      throw new Error('ไม่สามารถปลดแอดมินที่เป็นเจ้าของกลุ่มได้');
    }
    updatedAdminIds = updatedAdminIds.filter((id) => id !== targetUserId);
  }

  await updateGroup(groupId, { adminIds: updatedAdminIds });
}

export async function joinGroupByCode(
  groups: Group[],
  code: string,
  user: AppUser
): Promise<Group> {
  const cleanCode = code.trim().toUpperCase();
  const matched = groups.find((g) => g.inviteCode?.toUpperCase() === cleanCode);
  if (!matched) {
    throw new Error('ไม่พบกลุ่มที่มีรหัสเชิญนี้ กรุณาตรวจสอบอีกครั้ง');
  }

  if (matched.memberIds.includes(user.id)) {
    return matched; // Already joined
  }

  const updatedMemberIds = [...matched.memberIds, user.id];
  await updateGroup(matched.id, { memberIds: updatedMemberIds });
  return { ...matched, memberIds: updatedMemberIds };
}
