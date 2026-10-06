import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  Send, 
  Paperclip, 
  Smile, 
  Download, 
  FileText, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { DirectChat, DirectMessage, AppUser } from '../types';
import { 
  subscribeToDirectMessages, 
  sendDirectMessage, 
  markDirectChatAsRead,
  toggleDirectMessageReaction 
} from '../services/directChatService';
import { processFileForUpload, formatFileSize, downloadFile } from '../utils/fileHelper';
import { checkProfanity } from '../utils/profanityFilter';
import { soundManager } from '../utils/audioNotification';

interface DirectChatPopupProps {
  chat: DirectChat;
  currentUser: AppUser;
  targetUser: AppUser;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  onOpenProfile: (user: AppUser) => void;
  onViewImage: (url: string, name: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '👏', '🎉', '🙏'];

export const DirectChatPopup: React.FC<DirectChatPopupProps> = ({
  chat,
  currentUser,
  targetUser,
  isMinimized,
  onToggleMinimize,
  onClose,
  onOpenProfile,
  onViewImage,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<{
    dataUrl: string;
    name: string;
    type: 'image' | 'document' | 'audio' | 'none';
    size: number;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCountRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  // Subscribe to real-time messages in this 1:1 chat
  useEffect(() => {
    const unsubscribe = subscribeToDirectMessages(chat.id, (newMessages) => {
      // Play chime if new incoming message arrives from the other user
      if (!isInitialMount.current && newMessages.length > prevMsgCountRef.current) {
        const latest = newMessages[newMessages.length - 1];
        if (latest && latest.senderId !== currentUser.id) {
          soundManager.playChime();
        }
      }

      isInitialMount.current = false;
      prevMsgCountRef.current = newMessages.length;
      setMessages(newMessages);

      // Auto mark as read if not minimized
      if (!isMinimized) {
        markDirectChatAsRead(chat.id, currentUser.id).catch(() => {});
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [chat.id, currentUser.id, isMinimized]);

  // Mark as read when unminimizing
  useEffect(() => {
    if (!isMinimized) {
      markDirectChatAsRead(chat.id, currentUser.id).catch(() => {});
    }
  }, [isMinimized, chat.id, currentUser.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachment) || isSending) return;

    try {
      setIsSending(true);

      // Filter profanity with GuardBot
      const profanity = checkProfanity(inputText);
      const textToSend = profanity.hasProfanity ? profanity.cleanText : inputText;

      const currentAttachment = attachment;
      setInputText('');
      setAttachment(null);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }

      await sendDirectMessage(
        chat.id,
        currentUser,
        targetUser.id,
        textToSend,
        currentAttachment || undefined
      );

      soundManager.playSend();
    } catch (err) {
      console.error('Failed to send direct message:', err);
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
      const processed = await processFileForUpload(file);
      setAttachment({
        dataUrl: processed.dataUrl,
        name: processed.name,
        type: processed.type,
        size: processed.size,
      });
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const unreadCount = chat.unreadCount?.[currentUser.id] || 0;

  // Minimized Floating Head Bar (FB Messenger Style)
  if (isMinimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className="w-56 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-xl flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all select-none animate-in slide-in-from-bottom-3 duration-150"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={targetUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.id}`}
              alt={targetUser.displayName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                targetUser.status === 'online'
                  ? 'bg-emerald-500'
                  : targetUser.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {targetUser.displayName}
          </span>

          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="ปิดหน้าต่างแชท"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full Expanded Facebook Style Popup Window
  return (
    <div className="w-80 sm:w-84 h-[440px] sm:h-[470px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 select-none">
      {/* Messenger Header */}
      <div 
        onClick={onToggleMinimize}
        className="px-3 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between cursor-pointer shadow-xs select-none"
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(targetUser);
          }}
          className="flex items-center gap-2.5 min-w-0 group hover:opacity-95"
          title="คลิกเพื่อดูโปรไฟล์"
        >
          <div className="relative flex-shrink-0">
            <img
              src={targetUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.id}`}
              alt={targetUser.displayName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/60 bg-white/20 shadow-xs"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-indigo-600 ${
                targetUser.status === 'online'
                  ? 'bg-emerald-400'
                  : targetUser.status === 'away'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate max-w-[130px] group-hover:underline">
                {targetUser.displayName}
              </span>
            </div>
            <p className="text-[10px] text-indigo-100 flex items-center gap-1">
              {targetUser.status === 'online' ? 'กำลังใช้งาน' : targetUser.status === 'away' ? 'ไม่อยู่' : 'ออฟไลน์'}
            </p>
          </div>
        </div>

        {/* Window action controls */}
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="ย่อขนาด"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/70 dark:bg-slate-950/60 select-text">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <img
              src={targetUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.id}`}
              alt={targetUser.displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-md mb-2"
            />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {targetUser.displayName}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              เริ่มการสนทนาส่วนตัวแบบ 1:1 ส่งข้อความแรกเพื่อทักทายได้เลย 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-1.5 group relative ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <img
                    src={targetUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.id}`}
                    alt={targetUser.displayName}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-0.5 border border-slate-200 dark:border-slate-700"
                  />
                )}

                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`relative px-3 py-2 rounded-2xl text-xs shadow-xs break-words ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-xs'
                    }`}
                  >
                    {/* Attachment image preview */}
                    {msg.fileUrl && msg.fileType === 'image' && (
                      <div className="mb-1.5 rounded-xl overflow-hidden max-w-[200px] cursor-pointer">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || 'image'}
                          onClick={() => onViewImage(msg.fileUrl!, msg.fileName || 'รูปภาพ')}
                          className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}

                    {/* File Attachment */}
                    {msg.fileUrl && msg.fileType !== 'image' && (
                      <div className="mb-1.5 p-2 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-between gap-2 max-w-[200px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[11px] truncate font-medium">{msg.fileName}</span>
                        </div>
                        <button
                          onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'file')}
                          className="p-1 rounded hover:bg-black/10 text-white"
                          title="ดาวน์โหลด"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                    {/* Reactions Pill */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-white/20 dark:border-slate-700">
                        {Object.entries(msg.reactions).map(([emoji, uids]) => (
                          <span
                            key={emoji}
                            onClick={() =>
                              toggleDirectMessageReaction(
                                chat.id,
                                msg.id,
                                emoji,
                                currentUser.id,
                                msg.reactions
                              )
                            }
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] cursor-pointer transition-all ${
                              uids.includes(currentUser.id)
                                ? 'bg-indigo-200/40 text-white font-bold ring-1 ring-white/40'
                                : 'bg-black/15 text-white/90'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{uids.length}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Quick Reaction Button on Hover */}
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-400">
                    <span>{timeStr}</span>
                    <button
                      onClick={() =>
                        setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                      }
                      className="opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-opacity p-0.5"
                      title="ใส่อิโมจิ"
                    >
                      <Smile className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reaction Picker Popover */}
                  {activeReactionMsgId === msg.id && (
                    <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg z-20 animate-in fade-in zoom-in-95 my-1">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            toggleDirectMessageReaction(
                              chat.id,
                              msg.id,
                              emoji,
                              currentUser.id,
                              msg.reactions
                            );
                            setActiveReactionMsgId(null);
                          }}
                          className="hover:scale-125 p-1 text-sm transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border-t border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
          <div className="flex items-center gap-1.5 truncate">
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{attachment.name}</span>
            <span className="text-[10px] text-slate-400">({formatFileSize(attachment.size)})</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 hover:text-rose-500"
            title="ยกเลิกไฟล์แนบ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer Chat Input */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSend} className="flex items-end gap-1.5">
          {/* File Picker input hidden */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="แนบรูปภาพหรือไฟล์"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Emoji Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="ใส่อิโมจิ"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute bottom-10 left-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2.5 z-40 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1.5">อิโมจิยอดนิยม</p>
                  <div className="grid grid-cols-4 gap-1 text-lg">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
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

          {/* Text Input */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง)"
            className="flex-1 max-h-20 min-h-[34px] py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachment) || isSending}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all active:scale-95 flex-shrink-0"
            title="ส่งข้อความ"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
