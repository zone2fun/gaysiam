import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Hash, 
  Lock, 
  Globe, 
  Users, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Crown,
  Pin
} from 'lucide-react';
import { Group, GroupCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface GroupSidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onQuickJoinGroup?: (groupId: string) => void;
  onOpenMembersDirectory?: () => void;
}

const CATEGORY_MAP: Record<GroupCategory | 'all', string> = {
  all: 'ทั้งหมด',
  general: '💬 ทั่วไป',
  tech: '💻 เทคโนโลยี',
  gaming: '🎮 เกม',
  business: '💼 ธุรกิจ',
  education: '📚 การศึกษา',
  lifestyle: '✨ ไลฟ์สไตล์',
};

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  rose: 'bg-rose-500 text-white',
  amber: 'bg-amber-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  violet: 'bg-violet-500 text-white',
};

export const GroupSidebar: React.FC<GroupSidebarProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onQuickJoinGroup,
  onOpenMembersDirectory,
}) => {
  const { currentUser, togglePinGroup } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | 'all'>('all');
  const [tab, setTab] = useState<'joined' | 'explore'>('joined');

  const pinnedIds = currentUser?.pinnedGroupIds || [];

  // Filter groups
  const joinedGroups = groups.filter((g) =>
    currentUser ? g.memberIds.includes(currentUser.id) : true
  );

  const exploreGroups = groups.filter(
    (g) => !g.isPrivate && (!currentUser || !g.memberIds.includes(currentUser.id))
  );

  const currentList = tab === 'joined' ? joinedGroups : exploreGroups;

  const filteredGroups = currentList.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort groups: pinned groups ALWAYS come first!
  const sortedFilteredGroups = [...filteredGroups].sort((a, b) => {
    if (tab === 'joined') {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
    }
    return 0;
  });

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Action Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            กลุ่มและการสนทนา
          </h2>
          <div className="flex items-center gap-1.5">
            {onOpenMembersDirectory && (
              <button
                onClick={onOpenMembersDirectory}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="ดูรายชื่อสมาชิกทั้งหมดในคอมมูนิตี้"
              >
                <Users className="w-4 h-4 text-pink-500" />
                <span className="hidden sm:inline">สมาชิก</span>
              </button>
            )}
            <button
              onClick={onOpenJoinGroup}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              title="เข้าร่วมกลุ่มด้วยรหัสเชิญ"
            >
              <Hash className="w-4 h-4" />
              <span className="hidden sm:inline">ใส่รหัส</span>
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              title="สร้างกลุ่มแชทใหม่"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างกลุ่ม</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setTab('joined')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'joined'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            กลุ่มของฉัน ({joinedGroups.length})
          </button>
          <button
            onClick={() => setTab('explore')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'explore'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            ค้นพบกลุ่ม ({exploreGroups.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อกลุ่ม หรือหัวข้อ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {(Object.keys(CATEGORY_MAP) as (GroupCategory | 'all')[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {CATEGORY_MAP[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredGroups.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {tab === 'joined' ? 'ยังไม่ได้เข้าร่วมกลุ่มใด' : 'ไม่พบกลุ่มสาธารณะที่ค้นหา'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
              {tab === 'joined'
                ? 'คุณสามารถกดสร้างกลุ่มใหม่ หรือใส่รหัสเชิญเพื่อเข้าร่วมกลุ่มได้ทันที'
                : 'ลองค้นหาด้วยคำอื่น หรือสร้างกลุ่มขึ้นมาเอง'}
            </p>
            {tab === 'joined' && (
              <button
                onClick={onOpenCreateGroup}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                เริ่มสร้างกลุ่มแรก
              </button>
            )}
          </div>
        ) : (
          sortedFilteredGroups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const isOwner = currentUser?.id === group.ownerId;
            const isAdmin = currentUser && group.adminIds.includes(currentUser.id);
            const isMember = currentUser && group.memberIds.includes(currentUser.id);
            const isPinned = pinnedIds.includes(group.id);
            const colorClass = COLOR_CLASSES[group.color] || COLOR_CLASSES.indigo;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`group relative p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                    : isPinned
                    ? 'bg-amber-50/20 dark:bg-amber-950/15 border-amber-200/50 dark:border-amber-900/40 hover:bg-white/80'
                    : 'border-transparent hover:bg-white/70 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs relative ${colorClass}`}
                  >
                    {group.avatar || '💬'}
                    {isPinned && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Pin className="w-2.5 h-2.5 fill-white" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {group.name}
                        </span>
                        {group.isPrivate ? (
                          <span title="กลุ่มส่วนตัว">
                            <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          </span>
                        ) : (
                          <span title="กลุ่มสาธารณะ">
                            <Globe className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          </span>
                        )}
                        {isPinned && (
                          <span title="ปักหมุดแล้ว" className="text-amber-500 flex-shrink-0">
                            <Pin className="w-3 h-3 fill-amber-500" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {currentUser && isMember && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinGroup(group.id);
                            }}
                            className={`p-1 rounded-md transition-all ${
                              isPinned
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-100/60 dark:bg-amber-950/70'
                                : 'text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                            }`}
                            title={isPinned ? 'ยกเลิกการปักหมุดกลุ่ม' : 'ปักหมุดกลุ่มนี้ไว้ด้านบนสุด'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400">
                          👥 {group.memberIds.length}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {group.lastMessageText || group.description || 'ไม่มีข้อความ'}
                    </p>

                    {/* Role & Status pills */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50">
                          <Crown className="w-2.5 h-2.5" />
                          เจ้าของ
                        </span>
                      ) : isAdmin ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          แอดมิน
                        </span>
                      ) : null}

                      {tab === 'explore' && !isMember && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickJoinGroup?.(group.id);
                          }}
                          className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                        >
                          เข้าร่วม <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
