import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Pin, 
  MoreVertical, 
  Reply, 
  Trash2, 
  FileText, 
  Download, 
  X, 
  Info, 
  Users, 
  Settings, 
  Share2,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Crown,
  Shield,
  Search,
  ChevronDown,
  Bot,
  AlertTriangle,
  LogIn,
  Plus,
  Sparkles
} from 'lucide-react';
import { Group, ChatMessage, AppUser, FileType } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendMessage, deleteMessage, toggleReaction, togglePinMessage } from '../services/chatService';
import { addMemberToGroup } from '../services/groupService';
import { processFileForUpload, formatFileSize, downloadFile } from '../utils/fileHelper';
import { checkProfanity, GUARDBOT_USER } from '../utils/profanityFilter';
import { soundManager } from '../utils/audioNotification';
import confetti from 'canvas-confetti';
import { GaySiamLogo } from './GaySiamLogo';

interface ChatAreaProps {
  group: Group;
  messages: ChatMessage[];
  usersMap: Record<string, AppUser>;
  onOpenManageGroup: () => void;
  onOpenShareGroup: () => void;
  onToggleMembersDrawer: () => void;
  onViewImage: (url: string, name: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onJoinCurrentGroup?: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '👏', '🎉', '🙏', '💯', '✨'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  group,
  messages,
  usersMap,
  onOpenManageGroup,
  onOpenShareGroup,
  onToggleMembersDrawer,
  onViewImage,
  onOpenUserProfile,
  onJoinCurrentGroup,
}) => {
  const { currentUser, togglePinGroup } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachment, setAttachment] = useState<{
    dataUrl: string;
    name: string;
    type: FileType;
    size: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = currentUser?.id === group.ownerId;
  const isAdmin = currentUser && (group.adminIds.includes(currentUser.id) || isOwner);
  const isMember = currentUser && group.memberIds.includes(currentUser.id);
  const isGroupPinned = Boolean(currentUser?.pinnedGroupIds?.includes(group.id));

  const handleJoinClick = async () => {
    if (!currentUser) {
      onJoinCurrentGroup?.();
      return;
    }
    if (isJoining) return;

    try {
      setIsJoining(true);
      if (onJoinCurrentGroup) {
        await onJoinCurrentGroup();
      } else {
        await addMemberToGroup(group.id, group, currentUser.id);
        soundManager.playSend();
        try {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        } catch {
          // safe
        }
        try {
          await sendMessage(
            group.id,
            currentUser,
            `🎉 ยินดีต้อนรับสมาชิกใหม่ คุณ ${currentUser.displayName} เข้าสู่ห้อง ${group.name} ชุมชน GaySiam! 🏳️‍🌈✨ มาร่วมพูดคุยทักทายกันได้เลยครับ 💖`
          );
        } catch {
          // non-critical
        }
      }
    } catch (err) {
      console.error('Failed to join group:', err);
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachment) || !currentUser || isSending) return;

    try {
      setIsSending(true);

      // GuardBot Profanity Detection
      const profanityResult = checkProfanity(inputText);
      const finalMessageText = profanityResult.hasProfanity ? profanityResult.cleanText : inputText;

      const activeSender = currentUser ? (usersMap[currentUser.id] || currentUser) : currentUser;

      await sendMessage(
        group.id,
        activeSender!,
        finalMessageText,
        attachment || undefined,
        replyingTo
          ? {
              id: replyingTo.id,
              text: replyingTo.text || (replyingTo.fileName ? `[ไฟล์] ${replyingTo.fileName}` : 'ข้อความ'),
            }
          : undefined
      );

      // If profanity was detected, GuardBot issues an automated warning in the chat
      if (profanityResult.hasProfanity) {
        setTimeout(async () => {
          try {
            await sendMessage(
              group.id,
              {
                ...currentUser,
                displayName: 'GuardBot (บอทตรวจคำหยาบ)',
                photoURL: GUARDBOT_USER.photoURL,
              },
              `🤖 [GuardBot แจ้งเตือน]: สมาชิกส่งข้อความที่มีคำไม่สุภาพ (${profanityResult.matchedWords.join(', ')}) ระบบได้ทำการเซ็นเซอร์เป็น "${finalMessageText}" ให้แล้ว กรุณาใช้คำพูดที่สุภาพเพื่อให้เกียรติสมาชิกในกลุ่มนะคะ 🛡️`
            );
          } catch (botErr) {
            console.error('GuardBot notice error:', botErr);
          }
        }, 350);
      }

      setInputText('');
      setAttachment(null);
      setReplyingTo(null);
      setUploadError(null);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setUploadError('ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const processed = await processFileForUpload(file);
      setAttachment({
        dataUrl: processed.dataUrl,
        name: processed.name,
        type: processed.type,
        size: processed.size,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแนบไฟล์';
      setUploadError(msg);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleReaction = async (message: ChatMessage, emoji: string) => {
    if (!currentUser) return;
    try {
      await toggleReaction(group.id, message, emoji, currentUser.id);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) return;
    try {
      await deleteMessage(group.id, messageId);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const handleTogglePin = async (message: ChatMessage) => {
    try {
      const willPin = !message.isPinned;
      await togglePinMessage(
        group.id,
        message.id,
        willPin,
        willPin ? message.text || message.fileName : undefined
      );
    } catch (err) {
      console.error('Pin message error:', err);
    }
  };

  // Filter messages by search query if search is open
  const displayedMessages = searchQuery.trim()
    ? messages.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.fileName && m.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 transition-colors overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 border border-slate-200 dark:border-slate-700">
            {group.avatar || '💬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {group.name}
              </h1>
              {isGroupPinned && (
                <span title="คุณปักหมุดกลุ่มนี้แล้ว" className="text-amber-500 flex-shrink-0">
                  <Pin className="w-3.5 h-3.5 fill-amber-500" />
                </span>
              )}
              {group.isPrivate ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                  ส่วนตัว
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  สาธารณะ
                </span>
              )}
              <span
                className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                title="GuardBot กำลังทำงาน: คอยคัดกรองคำหยาบคายอัตโนมัติ"
              >
                <Bot className="w-3 h-3 text-indigo-500" />
                GuardBot Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {group.memberIds.length} สมาชิก • {group.description || 'ไม่มีคำอธิบาย'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Join Group Button if not member */}
          {!isMember && onJoinCurrentGroup && (
            <button
              onClick={onJoinCurrentGroup}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-pulse"
              title="เข้าร่วมกลุ่มนี้"
            >
              {!currentUser ? <LogIn className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{!currentUser ? 'เข้าสู่ระบบเพื่อร่วมกลุ่ม' : 'เข้าร่วมกลุ่ม'}</span>
            </button>
          )}

          {/* Pin/Unpin Group Button */}
          {currentUser && isMember && (
            <button
              onClick={() => togglePinGroup(group.id)}
              className={`p-2 rounded-lg transition-colors ${
                isGroupPinned
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isGroupPinned ? 'ยกเลิกการปักหมุดกลุ่มนี้' : 'ปักหมุดกลุ่มนี้ไว้ด้านบนสุด'}
            >
              <Pin className={`w-4 h-4 ${isGroupPinned ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          {/* Share Group Link Button */}
          <button
            onClick={onOpenShareGroup}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
            title="แชร์ลิงก์ห้องแชท"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">แชร์ลิงก์</span>
          </button>

          {/* Search in chat */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              showSearch ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : ''
            }`}
            title="ค้นหาข้อความในการสนทนา"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Members Drawer Toggle */}
          <button
            onClick={onToggleMembersDrawer}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="ดูรายชื่อสมาชิก"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Admin Manage Group Button */}
          {isAdmin && (
            <button
              onClick={onOpenManageGroup}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="จัดการกลุ่มและสมาชิก (แอดมิน)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar (collapsible) */}
      {showSearch && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="พิมพ์คำที่ต้องการค้นหาในแชทนี้..."
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Pinned announcement banner */}
      {group.pinnedMessage && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-[11px] text-amber-800 dark:text-amber-300 flex-shrink-0">
              ข้อความปักหมุด:
            </span>
            <span className="truncate">{group.pinnedMessage}</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => togglePinMessage(group.id, '', false)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 text-[11px] underline flex-shrink-0"
            >
              ปลดหมุด
            </button>
          )}
        </div>
      )}

      {/* Message History List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* GaySiam Room Welcome Card for every room */}
        <div className="mx-auto max-w-xl p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 via-sky-500/10 to-emerald-500/10 border border-pink-400/30 dark:border-pink-500/30 text-center relative overflow-hidden shadow-xs mb-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-amber-400 via-emerald-400 via-blue-500 to-purple-600" />
          <div className="flex justify-center mb-2">
            <GaySiamLogo size={44} />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <span>ยินดีต้อนรับสู่ห้อง {group.name}</span>
            <span>🏳️‍🌈</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
            ยินดีต้อนรับสมาชิกใหม่ทุกคนสู่คอมมูนิตี้ GaySiam! ร่วมพูดคุย แลกเปลี่ยนไลฟ์สไตล์ มิตรภาพ และความรักอย่างอิสระ 💖
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-800/80 text-pink-600 dark:text-pink-400 border border-pink-200/50 dark:border-pink-800/50 shadow-2xs">
              ✨ ชุมชน LGBTQ+ ยินดีต้อนรับ
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/80 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
              🛡️ Safe Zone ให้เกียรติซึ่งกันและกัน
            </span>
            {isMember && (
              <button
                type="button"
                onClick={() => {
                  setInputText('สวัสดีชาว GaySiam ทุกคนครับ! 👋 ยินดีที่ได้รู้จักทุกคนนะครับ 🌈✨');
                  textareaRef.current?.focus();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-90 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                👋 ทักทายห้องนี้
              </button>
            )}
          </div>
        </div>

        {displayedMessages.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              ยังไม่มีการสนทนาในห้องนี้ เริ่มต้นส่งข้อความแรกเพื่อทักทายเพื่อนๆ ได้เลย! ✨
            </p>
          </div>
        ) : (
          displayedMessages.map((msg, index) => {
            const isBotMessage = msg.senderName.includes('GuardBot') || msg.senderId === GUARDBOT_USER.id;
            const isMe = !isBotMessage && currentUser?.id === msg.senderId;
            const isMsgOwner = !isBotMessage && msg.senderId === group.ownerId;
            const isMsgAdmin = !isBotMessage && group.adminIds.includes(msg.senderId) && !isMsgOwner;
            const senderUser = isBotMessage ? null : (isMe ? (currentUser ? (usersMap[currentUser.id] || currentUser) : null) : usersMap[msg.senderId]);
            const senderPhoto = isBotMessage
              ? GUARDBOT_USER.photoURL
              : (senderUser?.photoURL || msg.senderPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}`);
            const senderDisplayName = isBotMessage ? 'GuardBot' : (senderUser?.displayName || msg.senderName);

            const formattedTime = new Date(msg.createdAt).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`relative group flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}
              >
                {/* Avatar */}
                <div
                  onClick={() => !isBotMessage && onOpenUserProfile?.(msg.senderId)}
                  className={`relative flex-shrink-0 mt-0.5 ${!isBotMessage ? 'cursor-pointer hover:opacity-85' : ''}`}
                  title={!isBotMessage ? `ดูโปรไฟล์ของ ${msg.senderName}` : 'GuardBot'}
                >
                  <img
                    src={senderPhoto}
                    alt={msg.senderName}
                    className={`w-8 h-8 rounded-full object-cover border ${
                      isBotMessage
                        ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
                        : 'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {senderUser?.status === 'online' && !isBotMessage && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
                  )}
                  {isBotMessage && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-950" />
                  )}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name & Badges */}
                  <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span
                      onClick={() => !isBotMessage && onOpenUserProfile?.(msg.senderId)}
                      className={`font-semibold text-slate-700 dark:text-slate-300 ${
                        !isBotMessage ? 'cursor-pointer hover:underline hover:text-indigo-600 dark:hover:text-indigo-400' : ''
                      }`}
                      title={!isBotMessage ? `ดูโปรไฟล์ของ ${senderDisplayName}` : 'GuardBot'}
                    >
                      {isBotMessage ? 'GuardBot' : isMe ? 'คุณ' : senderDisplayName}
                    </span>
                    {isBotMessage && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                        <Bot className="w-2.5 h-2.5" /> AI GuardBot
                      </span>
                    )}
                    {isMsgOwner && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 rounded">
                        <Crown className="w-2.5 h-2.5" /> เจ้าของ
                      </span>
                    )}
                    {isMsgAdmin && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded">
                        <Shield className="w-2.5 h-2.5" /> แอดมิน
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{formattedTime}</span>
                  </div>

                  {/* Quoted reply context */}
                  {msg.replyToText && (
                    <div
                      className={`text-[11px] px-3 py-1.5 rounded-t-xl border-l-2 mb-0.5 max-w-full truncate ${
                        isMe
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-medium">ตอบกลับ: </span>
                      <span className="italic">{msg.replyToText}</span>
                    </div>
                  )}

                  {/* Content Bubble */}
                  <div
                    className={`relative p-3 rounded-2xl text-xs sm:text-sm shadow-xs break-words ${
                      msg.text.includes('ยินดีต้อนรับ')
                        ? 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-pink-400/50 dark:border-pink-500/50 text-slate-900 dark:text-pink-100 rounded-2xl font-medium shadow-sm'
                        : isBotMessage
                        ? 'bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 rounded-tl-none font-medium'
                        : isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    {/* Welcome Badge Header */}
                    {msg.text.includes('ยินดีต้อนรับ') && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-600 dark:text-pink-300 mb-1.5 pb-1 border-b border-pink-300/30 dark:border-pink-500/30">
                        <span>🏳️‍🌈 สมาชิกใหม่เข้าสู่ GaySiam</span>
                        <span>✨</span>
                      </div>
                    )}
                    {/* Image Attachment */}
                    {msg.fileType === 'image' && msg.fileUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl bg-black/10">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || 'รูปภาพที่แนบ'}
                          onClick={() => onViewImage(msg.fileUrl!, msg.fileName || 'รูปภาพ')}
                          className="max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Document Attachment */}
                    {msg.fileType === 'document' && msg.fileUrl && (
                      <div
                        className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 border ${
                          isMe
                            ? 'bg-indigo-700/50 border-indigo-400/40 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs truncate">{msg.fileName}</p>
                          <p className="text-[10px] opacity-75">{formatFileSize(msg.fileSize || 0)}</p>
                        </div>
                        <button
                          onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'document')}
                          className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors ${
                            isMe ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}
                          title="ดาวน์โหลดไฟล์"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.text}</p>
                    )}

                    {/* Pin badge indicator */}
                    {msg.isPinned && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300 dark:text-amber-400 font-medium">
                        <Pin className="w-3 h-3" />
                        ปักหมุดในกลุ่ม
                      </div>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {Object.entries(msg.reactions).map(([emoji, uids]) => {
                        if (!uids || uids.length === 0) return null;
                        const hasReacted = currentUser && uids.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg, emoji)}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                              hasReacted
                                ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{uids.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Action Menu on Hover */}
                  {hoveredMessageId === msg.id && (
                    <div
                      className={`absolute top-0 ${
                        isMe ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'
                      } flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 animate-in fade-in duration-100`}
                    >
                      {/* Quick Emoji Reaction bar */}
                      {COMMON_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg, emoji)}
                          className="hover:scale-125 p-1 text-xs transition-transform"
                          title={`แสดงความรู้สึก ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                      {/* Reply */}
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="ตอบกลับ"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {/* Pin (admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleTogglePin(msg)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            msg.isPinned
                              ? 'text-amber-500'
                              : 'text-slate-500 hover:text-amber-500 dark:text-slate-400'
                          }`}
                          title={msg.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดข้อความ'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete (author or admin) */}
                      {(isMe || isAdmin) && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="ลบข้อความ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Composer Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ตอบกลับคุณ {replyingTo.senderName}:
              </span>
              <span className="truncate italic">
                {replyingTo.text || replyingTo.fileName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview */}
        {attachment && (
          <div className="mb-2 p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-500">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {attachment.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatFileSize(attachment.size)} • พร้อมส่ง
                </p>
              </div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
              title="ยกเลิกไฟล์แนบ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload error banner */}
        {uploadError && (
          <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center justify-between">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real-time GuardBot Profanity Warning Banner */}
        {inputText.trim() && checkProfanity(inputText).hasProfanity && (
          <div className="mb-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="min-w-0 flex-1 text-[11px] leading-tight">
              <span className="font-semibold text-amber-800 dark:text-amber-300">GuardBot ตรวจพบคำไม่สุภาพ:</span> คำว่า "{checkProfanity(inputText).matchedWords.join(', ')}" ระบบจะทำการเซ็นเซอร์ข้อความเป็นคำสุภาพให้อัตโนมัติเมื่อกดส่ง 🛡️
            </div>
          </div>
        )}

        {/* Input Controls or Join Group Callout */}
        {!isMember ? (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs text-indigo-950 dark:text-indigo-200 text-center sm:text-left">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {!currentUser ? 'คุณยังไม่ได้เข้าสู่ระบบ' : 'คุณยังไม่ได้เป็นสมาชิกกลุ่มนี้'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {!currentUser
                    ? 'เข้าสู่ระบบด้วย Google หรือบัญชีผู้เยี่ยมชม เพื่อเข้าร่วมและส่งข้อความในกลุ่มนี้'
                    : 'กดปุ่มด้านล่างเพื่อเข้าร่วมกลุ่มและเริ่มส่งข้อความ ไฟล์ และรูปภาพได้ทันที'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleJoinClick}
              disabled={isJoining}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {!currentUser ? (
                <LogIn className="w-3.5 h-3.5" />
              ) : isJoining ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>
                {!currentUser
                  ? 'เข้าสู่ระบบเพื่อเข้าร่วม'
                  : isJoining
                  ? 'กำลังเข้าร่วมกลุ่ม...'
                  : 'เข้าร่วมกลุ่มนี้ทันที'}
              </span>
            </button>
          </div>
        ) : (
          <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            {/* File Picker input hidden */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip"
              className="hidden"
            />

            {/* Attachment button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="แนบรูปภาพหรือเอกสาร (PDF, DOCX, TXT, ฯลฯ)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Emoji button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="ใส่อิโมจิ"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Emoji popover */}
              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="absolute bottom-12 left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[11px] font-semibold text-slate-400 mb-2">อิโมจิยอดนิยม</p>
                    <div className="grid grid-cols-5 gap-2 text-xl">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddEmoji(emoji)}
                          className="hover:scale-125 p-1 rounded transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์ข้อความของคุณ... (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
              className="flex-1 max-h-32 min-h-[38px] py-2 px-2 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={(!inputText.trim() && !attachment) || isSending}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-all active:scale-95 flex-shrink-0"
              title="ส่งข้อความ"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
