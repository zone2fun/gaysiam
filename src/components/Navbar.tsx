import React, { useState } from 'react';
import { 
  MessageSquare,
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  User, 
  ChevronDown,
  Sparkles,
  Menu,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { soundManager } from '../utils/audioNotification';
import { UserStatus, AppUser, DirectChat } from '../types';
import { GaySiamLogo } from './GaySiamLogo';

interface NavbarProps {
  onOpenAuth: () => void;
  onToggleMobileSidebar: () => void;
  onOpenMyProfile?: () => void;
  onOpenMembersDirectory?: () => void;
  userProfile?: AppUser | null;
  directChats?: DirectChat[];
  usersMap?: Record<string, AppUser>;
  onStartDirectChat?: (targetUser: AppUser) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  onToggleMobileSidebar,
  onOpenMyProfile,
  onOpenMembersDirectory,
  userProfile,
  directChats = [],
  usersMap = {},
  onStartDirectChat,
}) => {
  const { currentUser: authUser, isSystemAdmin, logout, setStatus } = useAuth();
  const currentUser = userProfile || authUser;
  const { theme, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDirectChatsMenu, setShowDirectChatsMenu] = useState(false);

  const totalUnreadDM = directChats.reduce(
    (acc, c) => acc + (c.unreadCount?.[currentUser?.id || ''] || 0),
    0
  );

  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  const statusOptions: { value: UserStatus; label: string; color: string }[] = [
    { value: 'online', label: 'ออนไลน์', color: 'bg-emerald-500' },
    { value: 'away', label: 'ไม่อยู่ชั่วคราว', color: 'bg-amber-500' },
    { value: 'offline', label: 'ออฟไลน์', color: 'bg-slate-400' },
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Brand & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="เปิดเมนูกลุ่ม"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <GaySiamLogo size={40} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
                GaySiam
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Chat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              ระบบแชทกลุ่มเรียลไทม์ & จัดการสมาชิก
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Members Directory Button */}
        {onOpenMembersDirectory && (
          <button
            onClick={onOpenMembersDirectory}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 text-pink-600 dark:text-pink-300 border border-pink-200/50 dark:border-pink-800/50 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            title="ดูรายชื่อสมาชิกทั้งหมดในคอมมูนิตี้ GaySiam"
          >
            <Users className="w-4 h-4 text-pink-500 flex-shrink-0" />
            <span className="hidden md:inline">สมาชิกทั้งหมด</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 font-bold">
              {Object.keys(usersMap).length}
            </span>
          </button>
        )}

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด (Dark Mode)'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Direct Messages (Messenger Style) */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowDirectChatsMenu(!showDirectChatsMenu)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="ข้อความส่วนตัว (แชท 1:1)"
            >
              <MessageSquare className="w-5 h-5" />
              {totalUnreadDM > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalUnreadDM > 9 ? '9+' : totalUnreadDM}
                </span>
              )}
            </button>

            {showDirectChatsMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDirectChatsMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 px-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      ข้อความส่วนตัว (แชท 1:1)
                    </p>
                    {totalUnreadDM > 0 && (
                      <span className="text-[10px] font-semibold text-rose-500">
                        {totalUnreadDM} ข้อความใหม่
                      </span>
                    )}
                  </div>

                  {/* List of Recent Direct Chats */}
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {directChats.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ยังไม่มีประวัติการแชท 1:1
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          คุณสามารถคลิกที่รูปโปรไฟล์ของเพื่อนในห้องแชท หรือกดปุ่มแชทในรายชื่อสมาชิกเพื่อเริ่มคุยได้ทันที
                        </p>
                      </div>
                    ) : (
                      directChats.map((chat) => {
                        const targetId = chat.participantIds.find((id) => id !== currentUser.id);
                        const target = targetId ? usersMap[targetId] : null;
                        if (!target) return null;
                        const unread = chat.unreadCount?.[currentUser.id] || 0;

                        return (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setShowDirectChatsMenu(false);
                              onStartDirectChat?.(target);
                            }}
                            className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                              unread > 0
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/80'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <img
                                src={target.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${target.id}`}
                                alt={target.displayName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                  target.status === 'online'
                                    ? 'bg-emerald-500'
                                    : target.status === 'away'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {target.displayName}
                                </p>
                                {unread > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className={`text-[11px] truncate mt-0.5 ${
                                unread > 0
                                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {chat.lastMessageText || 'เริ่มการสนทนา'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile or Login */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="relative">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    currentUser.status === 'online'
                      ? 'bg-emerald-500'
                      : currentUser.status === 'away'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {currentUser.displayName}
                  </span>
                  {isSystemAdmin && (
                    <span title="Super Admin">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentUser.status === 'online'
                    ? 'ออนไลน์'
                    : currentUser.status === 'away'
                    ? 'ไม่อยู่'
                    : 'ออฟไลน์'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    {isSystemAdmin && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        ผู้ดูแลระบบสูงสุด (System Admin)
                      </span>
                    )}
                    {onOpenMyProfile && (
                      <button
                        onClick={() => {
                          onOpenMyProfile();
                          setShowUserMenu(false);
                        }}
                        className="w-full mt-2.5 py-1.5 px-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        โปรไฟล์ของฉัน & คลังรูปภาพ
                      </button>
                    )}
                  </div>

                  {/* Status selection */}
                  <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      สถานะของคุณ
                    </p>
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatus(opt.value);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                          {opt.label}
                        </span>
                        {currentUser.status === opt.value && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    </header>
  );
};
