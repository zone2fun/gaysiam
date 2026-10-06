import React, { useState } from 'react';
import { X, Hash, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { joinGroupByCode } from '../services/groupService';
import { sendMessage } from '../services/chatService';

interface JoinGroupModalProps {
  groups: Group[];
  onClose: () => void;
  onJoined: (group: Group) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  groups,
  onClose,
  onJoined,
}) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !currentUser || loading) return;

    try {
      setLoading(true);
      setError(null);
      const joined = await joinGroupByCode(groups, code.trim(), currentUser);

      try {
        await sendMessage(
          joined.id,
          currentUser,
          `🎉 ยินดีต้อนรับสมาชิกใหม่ คุณ ${currentUser.displayName} เข้าสู่ห้อง ${joined.name} ชุมชน GaySiam! 🏳️‍🌈✨ มาร่วมพูดคุยทักทายกันได้เลยครับ 💖`
        );
      } catch {
        // message send non-critical
      }

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch {
        // safe
      }

      onJoined(joined);
      onClose();
    } catch (err: unknown) {
      console.error('Error joining group:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมกลุ่มได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                เข้าร่วมกลุ่มด้วยรหัสเชิญ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ใส่รหัส 6 หลักที่ได้รับจากผู้ดูแลกลุ่ม
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
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รหัสเชิญเข้ากลุ่ม (Invite Code)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="เช่น AB12CD"
              maxLength={12}
              className="w-full px-4 py-2.5 text-center font-mono text-lg tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าร่วมกลุ่ม'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
