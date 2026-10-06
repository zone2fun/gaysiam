import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Ruler, 
  Scale, 
  Heart, 
  Globe, 
  Edit3, 
  ShieldCheck, 
  Images,
  ExternalLink,
  Eye,
  Camera,
  MessageSquare
} from 'lucide-react';
import { AppUser } from '../types';
import { GAY_TYPES } from './EditProfileModal';

interface UserProfileModalProps {
  user: AppUser;
  isCurrentUser: boolean;
  onClose: () => void;
  onOpenEdit: () => void;
  onViewImage: (url: string, name: string) => void;
  onStartDirectChat?: (targetUser: AppUser) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isCurrentUser,
  onClose,
  onOpenEdit,
  onViewImage,
  onStartDirectChat,
}) => {
  const gayTypeItem = GAY_TYPES.find((g) => g.id === user.gayType || g.label === user.gayType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Scrollable Container with Cover Banner & Body inside together */}
        <div className="flex-1 overflow-y-auto">
          {/* Topbar / Cover Banner */}
          <div className="relative h-40 sm:h-48 w-full bg-slate-800 overflow-hidden group">
            {user.coverURL ? (
              <img
                src={user.coverURL}
                alt="Cover Banner"
                onClick={() => onViewImage(user.coverURL!, `${user.displayName} - ภาพหน้าปก`)}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
            )}
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors z-30 shadow-md"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>

            {/* View Cover Image Button */}
            {user.coverURL && (
              <button
                onClick={() => onViewImage(user.coverURL!, `${user.displayName} - ภาพหน้าปก`)}
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md text-[11px] font-medium flex items-center gap-1.5 transition-all z-20 shadow-md opacity-90 hover:opacity-100"
              >
                <Eye className="w-3.5 h-3.5" />
                ดูภาพปก
              </button>
            )}

            {/* If Current User and no cover, hint to add cover */}
            {isCurrentUser && !user.coverURL && (
              <button
                onClick={onOpenEdit}
                className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-[11px] font-medium flex items-center gap-1.5 transition-all z-20 shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                เพิ่มภาพปก
              </button>
            )}
          </div>

          {/* Profile Card Body */}
          <div className="px-6 pb-6 relative space-y-5">
            {/* Avatar & Action Row: Avatar sits prominently above cover without clipping */}
            <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-2 relative z-20">
              <div className="relative">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.displayName}
                  onClick={() => user.photoURL && onViewImage(user.photoURL, user.displayName)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-200 dark:bg-slate-700 cursor-pointer hover:opacity-95 transition-opacity ring-2 ring-black/10 dark:ring-white/10"
                />
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    user.status === 'online'
                      ? 'bg-emerald-500'
                      : user.status === 'away'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                  title={user.status === 'online' ? 'ออนไลน์' : user.status === 'away' ? 'ไม่อยู่' : 'ออฟไลน์'}
                />
              </div>

              {isCurrentUser ? (
                <button
                  onClick={onOpenEdit}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-2xl flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  แก้ไขโปรไฟล์
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onStartDirectChat?.(user);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:opacity-95 active:scale-95 text-white text-xs font-semibold rounded-2xl flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  ส่งข้อความ (แชท 1:1)
                </button>
              )}
            </div>

            {/* Name & Identity */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {user.displayName}
                </h2>
                {user.email === 'zone2fun@gmail.com' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Super Admin
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.email || 'ผู้ใช้งาน GaySiam'}
              </p>

              {/* Gay Type Badge */}
              {user.gayType && (
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shadow-xs ${
                      gayTypeItem?.color || 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    {user.gayType}
                  </span>
                </div>
              )}
            </div>

            {/* Bio section */}
            {user.bio ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  "{user.bio}"
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  {isCurrentUser ? 'คุณยังไม่ได้เขียนคำแนะนำตัว กดปุ่ม "แก้ไขโปรไฟล์" เพื่อเพิ่มได้เลย' : 'ยังไม่มีคำแนะนำตัว'}
                </p>
              </div>
            )}

            {/* Stats Grid: Age, Height, Weight, Province, Country */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Age */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">อายุ</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {user.age ? `${user.age} ปี` : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              {/* Height */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-500">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">ส่วนสูง</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {user.height ? `${user.height} cm` : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              {/* Weight */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/80 text-pink-500">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">น้ำหนัก</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {user.weight ? `${user.weight} kg` : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              {/* Province */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5 sm:col-span-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">จังหวัด</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user.province || 'กรุงเทพมหานคร'}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-500">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">ประเทศ</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user.country || 'ประเทศไทย 🇹🇭'}
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Photos */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Images className="w-3.5 h-3.5 text-indigo-500" />
                  คลังรูปภาพ (Gallery)
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {user.gallery?.length || 0} รูป
                </span>
              </div>

              {user.gallery && user.gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {user.gallery.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => onViewImage(imgUrl, `${user.displayName} - รูปที่ ${idx + 1}`)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-800"
                    >
                      <img
                        src={imgUrl}
                        alt={`gallery-${idx}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    {isCurrentUser
                      ? 'คุณยังไม่มีรูปภาพในคลัง กดปุ่ม "แก้ไขโปรไฟล์" เพื่ออัปโหลดรูปภาพได้เลย'
                      : 'ยังไม่มีรูปภาพในคลัง'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
