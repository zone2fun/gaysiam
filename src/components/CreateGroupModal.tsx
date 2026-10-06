import React, { useState } from 'react';
import { X, Plus, Sparkles, Lock, Globe, Layers, Bot, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GroupCategory, Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { createGroup } from '../services/groupService';
import { checkProfanity, validateGroupName } from '../utils/profanityFilter';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (newGroup: Group) => void;
}

const CATEGORIES: { id: GroupCategory; name: string }[] = [
  { id: 'general', name: '💬 ทั่วไป (General)' },
  { id: 'tech', name: '💻 เทคโนโลยี (Technology)' },
  { id: 'gaming', name: '🎮 เกม & อีสปอร์ต (Gaming)' },
  { id: 'education', name: '📚 การศึกษา & เรียนรู้ (Education)' },
  { id: 'business', name: '💼 ธุรกิจ & งาน (Business)' },
  { id: 'lifestyle', name: '✨ ไลฟ์สไตล์ & พูดคุย (Lifestyle)' },
];

const PRESET_EMOJIS = ['💬', '🚀', '💡', '🔥', '🎉', '🎮', '💻', '🎨', '☕', '🌟', '📚', '⚡'];
const PRESET_COLORS = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onClose,
  onGroupCreated,
}) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('general');
  const [avatar, setAvatar] = useState('💬');
  const [color, setColor] = useState('indigo');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentUser || loading) return;

    // Check profanity with GuardBot
    const nameCheck = validateGroupName(name);
    if (!nameCheck.isValid) {
      setError(`🤖 GuardBot: ${nameCheck.errorReason}`);
      return;
    }

    const descCheck = checkProfanity(description);
    if (descCheck.hasProfanity) {
      setError(`🤖 GuardBot: คำอธิบายกลุ่มมีคำไม่สุภาพ (${descCheck.matchedWords.join(', ')}) กรุณาใช้ถ้อยคำที่สุภาพ`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const created = await createGroup(
        {
          name: name.trim(),
          description: description.trim(),
          avatar,
          color,
          isPrivate,
          category,
        },
        currentUser
      );

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe if canvas unavailable
      }

      if (created) {
        onGroupCreated(created);
        onClose();
      }
    } catch (err: unknown) {
      console.error('Error creating group:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถสร้างกลุ่มได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                สร้างกลุ่มใหม่
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สร้างพื้นที่สนทนาสำหรับเพื่อนร่วมงาน ทีม หรือคอมมูนิตี้
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

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* GuardBot Protection Notice */}
        <div className="mx-6 mt-4 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/50 rounded-xl flex items-center gap-2.5 text-xs text-indigo-800 dark:text-indigo-300">
          <Bot className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="text-[11px]">
            <strong>GuardBot เปิดใช้งาน:</strong> ตรวจสอบชื่อกลุ่มและคำอธิบายเพื่อป้องกันคำหยาบคายโดยอัตโนมัติ
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อกลุ่ม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ทีมนักพัฒนา Web App, ห้องคุยเกม ROV"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              คำอธิบายหรือหัวข้อกลุ่ม
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="แนะนำจุดประสงค์ของกลุ่ม หรือหัวข้อที่ต้องการพูดคุย..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              หมวดหมู่
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GroupCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Icon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              เลือกไอคอนกลุ่ม (Emoji)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
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

          {/* Theme Color */}
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

          {/* Privacy */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPrivate ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <Globe className="w-5 h-5 text-emerald-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isPrivate ? 'กลุ่มส่วนตัว (Private Group)' : 'กลุ่มสาธารณะ (Public Group)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isPrivate
                    ? 'สร้างรหัสเชิญเฉพาะ สมาชิกต้องมีรหัสเพื่อเข้า'
                    : 'ทุกคนสามารถมองเห็นและกดเข้าร่วมกลุ่มได้'}
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

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'กำลังสร้างกลุ่ม...' : 'ยืนยันสร้างกลุ่ม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
