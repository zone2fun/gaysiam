import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  MessageSquare, 
  Eye, 
  Users, 
  Sparkles, 
  Circle,
  Filter,
  Images,
  Heart
} from 'lucide-react';
import { AppUser } from '../types';
import { GAY_TYPES } from './EditProfileModal';
import { GaySiamLogo } from './GaySiamLogo';

interface MembersDirectoryModalProps {
  users: AppUser[];
  currentUserId?: string;
  onClose: () => void;
  onSelectUser: (user: AppUser) => void;
  onStartDirectChat?: (user: AppUser) => void;
}

export const MembersDirectoryModal: React.FC<MembersDirectoryModalProps> = ({
  users,
  currentUserId,
  onClose,
  onSelectUser,
  onStartDirectChat,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online'>('all');
  const [selectedGayType, setSelectedGayType] = useState<string>('all');

  // Filter & sort users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (filterStatus === 'online' && u.status !== 'online') {
        return false;
      }

      // Gay type filter
      if (selectedGayType !== 'all') {
        if (!u.gayType || !u.gayType.includes(selectedGayType)) {
          return false;
        }
      }

      // Search keyword
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const nameMatch = u.displayName?.toLowerCase().includes(term);
      const provinceMatch = u.province?.toLowerCase().includes(term);
      const bioMatch = u.bio?.toLowerCase().includes(term);
      const typeMatch = u.gayType?.toLowerCase().includes(term);

      return nameMatch || provinceMatch || bioMatch || typeMatch;
    }).sort((a, b) => {
      // Put current user first, then online users, then recently active
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return (a.displayName || '').localeCompare(b.displayName || '', 'th');
    });
  }, [users, search, filterStatus, selectedGayType, currentUserId]);

  const onlineCount = useMemo(() => {
    return users.filter((u) => u.status === 'online').length;
  }, [users]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 relative bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GaySiamLogo size={42} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                  สมาชิกคอมมูนิตี้ GaySiam
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-2xs">
                  {users.length} สมาชิก
                </span>
                {onlineCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ออนไลน์ {onlineCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ค้นพบและเชื่อมต่อกับเพื่อนๆ ชาว LGBTQ+ ทั่วประเทศในบรรยากาศที่เป็นมิตรและอบอุ่น
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, จังหวัด, สไตล์, หรือคำแนะนำตัว..."
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all shadow-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('online')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  filterStatus === 'online'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                กำลังออนไลน์ ({onlineCount})
              </button>
            </div>
          </div>

          {/* Gay Types Filter Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1 flex-shrink-0">
              <Filter className="w-3 h-3" /> สไตล์:
            </span>
            <button
              onClick={() => setSelectedGayType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                selectedGayType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              ทั้งหมด
            </button>
            {GAY_TYPES.map((gt) => {
              const isSelected = selectedGayType === gt.id;
              return (
                <button
                  key={gt.id}
                  onClick={() => setSelectedGayType(isSelected ? 'all' : gt.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                    isSelected
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-pink-300'
                  }`}
                >
                  {gt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/30">
          {filteredUsers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-500 flex items-center justify-center text-2xl mb-3 shadow-inner">
                👥
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                ไม่พบสมาชิกที่ตรงกับเงื่อนไข
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                ลองค้นหาด้วยคำอื่น หรือเลือกตัวกรองสถานะเป็น &quot;ทั้งหมด&quot; เพื่อดูเพื่อนๆ สมาชิกคนอื่นๆ
              </p>
              {(search || filterStatus !== 'all' || selectedGayType !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('all');
                    setSelectedGayType('all');
                  }}
                  className="mt-4 px-4 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredUsers.map((user) => {
                const isMe = user.id === currentUserId;
                const isOnline = user.status === 'online';
                const avatar = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`;
                const gayTypeItem = GAY_TYPES.find(
                  (gt) => gt.id === user.gayType || gt.label === user.gayType
                );

                return (
                  <div
                    key={user.id}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-800/80 transition-all flex flex-col duration-200"
                  >
                    {/* Card Cover Banner */}
                    <div className="h-20 w-full relative bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 overflow-hidden">
                      {user.coverURL ? (
                        <img
                          src={user.coverURL}
                          alt="Cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <span className="text-3xl">🏳️‍🌈</span>
                        </div>
                      )}
                      
                      {/* Status Badge in corner */}
                      <div className="absolute top-2 right-2">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            ออนไลน์
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-white">
                            ออฟไลน์
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Avatar overlapping cover */}
                    <div className="px-4 pt-0 pb-3 flex flex-col flex-1 relative">
                      <div className="flex items-end justify-between -mt-9 mb-2.5">
                        <div
                          onClick={() => onSelectUser(user)}
                          className="relative cursor-pointer group-hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={avatar}
                            alt={user.displayName}
                            className="w-16 h-16 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-md bg-slate-100 dark:bg-slate-800"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        {/* Gallery indicator */}
                        {user.gallery && user.gallery.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            <Images className="w-3 h-3 text-pink-500" />
                            {user.gallery.length} รูป
                          </span>
                        )}
                      </div>

                      {/* Name & Badges */}
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            onClick={() => onSelectUser(user)}
                            className="font-bold text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                          >
                            {user.displayName || 'สมาชิก GaySiam'}
                          </h4>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                              คุณ
                            </span>
                          )}
                        </div>

                        {/* Gay Type pill */}
                        {user.gayType && (
                          <div className="mt-1">
                            <span
                              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                gayTypeItem?.color || 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white'
                              }`}
                            >
                              {user.gayType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Location & Stats */}
                      <div className="space-y-1 mb-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {user.province && (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-pink-500 flex-shrink-0" />
                            <span className="truncate">{user.province}</span>
                          </div>
                        )}
                        {(user.age || user.height || user.weight) && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                            {user.age && <span>{user.age} ปี</span>}
                            {user.age && (user.height || user.weight) && <span>•</span>}
                            {user.height && <span>{user.height} ซม.</span>}
                            {user.height && user.weight && <span>/</span>}
                            {user.weight && <span>{user.weight} กก.</span>}
                          </div>
                        )}
                      </div>

                      {/* Bio snippet */}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3 flex-1 italic">
                        {user.bio ? `"${user.bio}"` : 'ยังไม่มีคำแนะนำตัว'}
                      </p>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onSelectUser(user)}
                          className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>โปรไฟล์</span>
                        </button>

                        {!isMe && onStartDirectChat ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onStartDirectChat(user);
                            }}
                            className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>ทักแชท</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectUser(user)}
                            className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                            <span>ของฉัน</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>แสดงสมาชิก {filteredUsers.length} จากทั้งหมด {users.length} คน</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
