import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  UserMinus, 
  Crown, 
  Copy, 
  Check, 
  Trash2, 
  LogOut, 
  Save, 
  Pin,
  Lock,
  Globe,
  Bot
} from 'lucide-react';
import { Group, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  updateGroup, 
  deleteGroup, 
  removeMemberFromGroup, 
  toggleGroupAdmin 
} from '../services/groupService';
import { validateGroupName, checkProfanity } from '../utils/profanityFilter';

interface GroupManageModalProps {
  group: Group;
  usersMap: Record<string, AppUser>;
  onClose: () => void;
  onGroupDeleted: () => void;
  onOpenUserProfile?: (userId: string) => void;
}

const PRESET_EMOJIS = ['💬', '🚀', '💻', '🎮', '📚', '💼', '🎯', '🔥', '🌟', '🎨', '☕', '⚡'];
const PRESET_COLORS = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'];

export const GroupManageModal: React.FC<GroupManageModalProps> = ({
  group,
  usersMap,
  onClose,
  onGroupDeleted,
  onOpenUserProfile,
}) => {
  const { currentUser, isSystemAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'danger'>('info');

  // Group Info state
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [avatar, setAvatar] = useState(group.avatar);
  const [color, setColor] = useState(group.color);
  const [isPrivate, setIsPrivate] = useState(group.isPrivate);
  const [pinnedMessage, setPinnedMessage] = useState(group.pinnedMessage || '');
  const [memberSearch, setMemberSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOwner = currentUser?.id === group.ownerId;
  const isGroupAdmin = currentUser && (group.adminIds.includes(currentUser.id) || isOwner || isSystemAdmin);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // GuardBot validation
    const nameCheck = validateGroupName(name);
    if (!nameCheck.isValid) {
      setStatusMessage({
        type: 'error',
        text: `🤖 GuardBot: ${nameCheck.errorReason}`,
      });
      return;
    }

    const descCheck = checkProfanity(description);
    if (descCheck.hasProfanity) {
      setStatusMessage({
        type: 'error',
        text: `🤖 GuardBot: คำอธิบายกลุ่มมีคำไม่สุภาพ (${descCheck.matchedWords.join(', ')}) กรุณาใช้คำที่สุภาพ`,
      });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim(),
        avatar,
        color,
        isPrivate,
        pinnedMessage: pinnedMessage.trim(),
      });
      setStatusMessage({ type: 'success', text: 'บันทึกข้อมูลกลุ่มเรียบร้อยแล้ว' });
    } catch (err: unknown) {
      console.error('Update error:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!group.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      setStatusMessage(null);
      await toggleGroupAdmin(group.id, group, userId, !currentIsAdmin);
      setStatusMessage({
        type: 'success',
        text: !currentIsAdmin ? 'แต่งตั้งเป็นแอดมินเรียบร้อยแล้ว' : 'ปลดสิทธิ์แอดมินเรียบร้อยแล้ว',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const targetUser = usersMap[userId];
    const nameStr = targetUser?.displayName || 'สมาชิกนี้';
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการนำ "${nameStr}" ออกจากกลุ่ม?`)) return;

    try {
      setStatusMessage(null);
      await removeMemberFromGroup(group.id, group, userId);
      setStatusMessage({ type: 'success', text: `นำ ${nameStr} ออกจากกลุ่มแล้ว` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการนำสมาชิกออก';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`คำเตือน: คุณต้องการลบกลุ่ม "${group.name}" อย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
      return;
    }

    try {
      setSaving(true);
      await deleteGroup(group.id);
      onGroupDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบกลุ่ม';
      setStatusMessage({ type: 'error', text: msg });
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;
    if (isOwner && group.memberIds.length > 1) {
      alert('ในฐานะเจ้าของกลุ่ม คุณต้องส่งต่อความเป็นเจ้าของหรือลบกลุ่มก่อนออกจากกลุ่ม');
      return;
    }
    if (!window.confirm(`คุณต้องการออกจากกลุ่ม "${group.name}" ใช่หรือไม่?`)) return;

    try {
      await removeMemberFromGroup(group.id, group, currentUser.id);
      onGroupDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการออกจากกลุ่ม';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const filteredMembers = group.memberIds.filter((uid) => {
    const user = usersMap[uid];
    if (!memberSearch.trim()) return true;
    const s = memberSearch.toLowerCase();
    return (
      (user?.displayName && user.displayName.toLowerCase().includes(s)) ||
      (user?.email && user.email.toLowerCase().includes(s))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                จัดการกลุ่ม: {group.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ควบคุมการตั้งค่า ข้อมูลกลุ่ม และสมาชิก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-b border-rose-200/60 dark:border-rose-800/60'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/20">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            ข้อมูลกลุ่ม
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            จัดการสมาชิก ({group.memberIds.length})
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'danger'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogOut className="w-4 h-4" />
            ความปลอดภัย & ออกจากกลุ่ม
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  คำอธิบายกลุ่ม
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เขียนแนะนำกลุ่ม หรือกฎกติกาการสนทนา..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {/* Pinned announcement */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  ข้อความปักหมุดประกาศ (Pinned Announcement)
                </label>
                <input
                  type="text"
                  value={pinnedMessage}
                  onChange={(e) => setPinnedMessage(e.target.value)}
                  placeholder="เช่น ยินดีต้อนรับสู่โปรเจกต์ใหม่! ประชุมทุกวันจันทร์ 10:00 น."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ไอคอนประจำกลุ่ม (อิโมจิ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 ring-2 ring-indigo-500 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  โทนสีประจำกลุ่ม
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        col === 'indigo'
                          ? 'bg-indigo-500'
                          : col === 'emerald'
                          ? 'bg-emerald-500'
                          : col === 'rose'
                          ? 'bg-rose-500'
                          : col === 'amber'
                          ? 'bg-amber-500'
                          : col === 'cyan'
                          ? 'bg-cyan-500'
                          : 'bg-violet-500'
                      } ${color === col ? 'ring-4 ring-slate-300 dark:ring-slate-700 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Privacy toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Globe className="w-5 h-5 text-emerald-500" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isPrivate ? 'กลุ่มส่วนตัว (Private)' : 'กลุ่มสาธารณะ (Public)'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isPrivate
                        ? 'ต้องมีรหัสเชิญจึงจะสามารถเข้าร่วมได้'
                        : 'ทุกคนสามารถค้นพบและเข้าร่วมกลุ่มได้ทันที'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              {/* Invite Code display */}
              {group.inviteCode && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      รหัสเชิญเข้ากลุ่ม (Invite Code)
                    </span>
                    <p className="font-mono text-base font-bold text-indigo-950 dark:text-indigo-100 tracking-widest mt-0.5">
                      {group.inviteCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteCode}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอกรหัส
                      </>
                    )}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !isGroupAdmin}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </form>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              {/* Member Search */}
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="ค้นหาสมาชิกด้วยชื่อ หรืออีเมล..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
              />

              {/* Members List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredMembers.map((userId) => {
                  const user = usersMap[userId];
                  const isUserOwner = userId === group.ownerId;
                  const isUserAdmin = group.adminIds.includes(userId);
                  const isMe = currentUser?.id === userId;

                  return (
                    <div
                      key={userId}
                      className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3"
                    >
                      <div 
                        onClick={() => onOpenUserProfile?.(userId)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85"
                        title={`ดูโปรไฟล์ของ ${user?.displayName || 'สมาชิก'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              user?.photoURL ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`
                            }
                            alt={user?.displayName || 'สมาชิก'}
                            className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                          />
                          {user?.status === 'online' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate hover:underline hover:text-indigo-600 dark:hover:text-indigo-400">
                              {user?.displayName || 'สมาชิก'} {isMe && '(คุณ)'}
                            </span>
                            {isUserOwner && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 rounded">
                                <Crown className="w-2.5 h-2.5" /> เจ้าของ
                              </span>
                            )}
                            {isUserAdmin && !isUserOwner && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded">
                                <ShieldAlert className="w-2.5 h-2.5" /> แอดมิน
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user?.email || 'ไม่มีอีเมล'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons (only for group admins and not targeting owner or self) */}
                      {isGroupAdmin && !isUserOwner && !isMe && (
                        <div className="flex items-center gap-1">
                          {/* Toggle Admin */}
                          <button
                            onClick={() => handleToggleAdmin(userId, isUserAdmin)}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isUserAdmin
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                                : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                            }`}
                            title={isUserAdmin ? 'ปลดสิทธิ์แอดมิน' : 'แต่งตั้งเป็นแอดมิน'}
                          >
                            {isUserAdmin ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                          </button>

                          {/* Kick */}
                          <button
                            onClick={() => handleRemoveMember(userId)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="นำสมาชิกออกจากกลุ่ม"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4">
              {/* Leave group */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    ออกจากกลุ่ม
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    คุณจะไม่ได้รับข้อความหรือการแจ้งเตือนจากกลุ่มนี้อีก
                  </p>
                </div>
                <button
                  onClick={handleLeaveGroup}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  ออกจากกลุ่ม
                </button>
              </div>

              {/* Delete group (Owner only) */}
              {isOwner && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      ลบกลุ่มอย่างถาวร
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ประวัติการสนทนาและไฟล์ทั้งหมดในกลุ่มนี้จะถูกลบ ไม่สามารถกู้คืนได้
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteGroup}
                    disabled={saving}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบกลุ่ม
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
