import React, { useState } from 'react';
import { 
  X, 
  Users, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Crown, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Copy, 
  Check,
  Share2,
  MessageSquare
} from 'lucide-react';
import { Group, ChatMessage, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFileSize, downloadFile } from '../utils/fileHelper';

interface GroupMembersDrawerProps {
  group: Group;
  messages: ChatMessage[];
  usersMap: Record<string, AppUser>;
  onClose: () => void;
  onViewImage: (url: string, name: string) => void;
  onOpenShareGroup?: () => void;
  onOpenUserProfile?: (userId: string) => void;
  onStartDirectChat?: (targetUser: AppUser) => void;
}

export const GroupMembersDrawer: React.FC<GroupMembersDrawerProps> = ({
  group,
  messages,
  usersMap,
  onClose,
  onViewImage,
  onOpenShareGroup,
  onOpenUserProfile,
  onStartDirectChat,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'media'>('members');
  const [copiedCode, setCopiedCode] = useState(false);

  // Group members into admins and regular members
  const admins = group.memberIds.filter(
    (uid) => group.adminIds.includes(uid) || group.ownerId === uid
  );
  const regularMembers = group.memberIds.filter(
    (uid) => !group.adminIds.includes(uid) && group.ownerId !== uid
  );

  // Shared media and files
  const sharedMedia = messages.filter((m) => m.fileType && m.fileUrl);

  const handleCopyCode = () => {
    if (!group.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col h-full z-20 shadow-lg lg:shadow-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          ข้อมูลกลุ่ม & สมาชิก
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Group Card Preview */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/40">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2">
          {group.avatar || '💬'}
        </div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {group.name}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {group.description || 'ไม่มีคำอธิบาย'}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          {group.inviteCode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <span className="text-slate-400 font-mono">รหัส: {group.inviteCode}</span>
              <button
                onClick={handleCopyCode}
                className="text-indigo-600 dark:text-indigo-400 hover:opacity-80"
                title="คัดลอกรหัสเชิญ"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {onOpenShareGroup && (
            <button
              onClick={onOpenShareGroup}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors"
              title="แชร์ลิงก์ห้องแชท"
            >
              <Share2 className="w-3.5 h-3.5" />
              แชร์ลิงก์
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 mx-3 my-2 rounded-xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('members')}
          className={`py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'members'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          สมาชิก ({group.memberIds.length})
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`py-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'media'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          ไฟล์ & รูป ({sharedMedia.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'members' && (
          <>
            {/* Admins section */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                ผู้ดูแลกลุ่ม ({admins.length})
              </p>
              <div className="space-y-2">
                {admins.map((uid) => {
                  const user = usersMap[uid];
                  const isOwner = uid === group.ownerId;
                  return (
                    <div
                      key={uid}
                      onClick={() => onOpenUserProfile?.(uid)}
                      className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      title={`ดูโปรไฟล์ของ ${user?.displayName || 'ผู้ดูแล'}`}
                    >
                      <div className="relative">
                        <img
                          src={
                            user?.photoURL ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`
                          }
                          alt={user?.displayName || 'แอดมิน'}
                          className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                        />
                        {user?.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {user?.displayName || 'ผู้ดูแล'}
                          </p>
                          {isOwner ? (
                            <span title="เจ้าของกลุ่ม">
                              <Crown className="w-3 h-3 text-amber-500" />
                            </span>
                          ) : (
                            <span title="แอดมิน">
                              <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {user?.status === 'online'
                            ? '🟢 ออนไลน์'
                            : user?.status === 'away'
                            ? '🟡 ไม่อยู่'
                            : '⚪ ออฟไลน์'}
                        </p>
                      </div>

                      {currentUser && uid !== currentUser.id && user && onStartDirectChat && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartDirectChat(user);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title={`แชท 1:1 กับ ${user.displayName}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regular Members */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                สมาชิกทั่วไป ({regularMembers.length})
              </p>
              {regularMembers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">ยังไม่มีสมาชิกเพิ่มเติม</p>
              ) : (
                <div className="space-y-2">
                  {regularMembers.map((uid) => {
                    const user = usersMap[uid];
                    return (
                      <div
                        key={uid}
                        onClick={() => onOpenUserProfile?.(uid)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        title={`ดูโปรไฟล์ของ ${user?.displayName || 'สมาชิก'}`}
                      >
                        <div className="relative">
                          <img
                            src={
                              user?.photoURL ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`
                            }
                            alt={user?.displayName || 'สมาชิก'}
                            className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                          />
                          {user?.status === 'online' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {user?.displayName || 'สมาชิก'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {user?.status === 'online'
                              ? '🟢 ออนไลน์'
                              : user?.status === 'away'
                              ? '🟡 ไม่อยู่'
                              : '⚪ ออฟไลน์'}
                          </p>
                        </div>

                        {currentUser && uid !== currentUser.id && user && onStartDirectChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartDirectChat(user);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title={`แชท 1:1 กับ ${user.displayName}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'media' && (
          <div className="space-y-2.5">
            {sharedMedia.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                ยังไม่มีการแชร์รูปภาพหรือเอกสารในกลุ่มนี้
              </p>
            ) : (
              sharedMedia.map((m) => {
                if (m.fileType === 'image') {
                  return (
                    <div
                      key={m.id}
                      onClick={() => onViewImage(m.fileUrl!, m.fileName || 'รูปภาพ')}
                      className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer aspect-video"
                    >
                      <img
                        src={m.fileUrl}
                        alt={m.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white truncate">{m.fileName}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {m.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(m.fileSize || 0)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadFile(m.fileUrl!, m.fileName || 'doc')}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
