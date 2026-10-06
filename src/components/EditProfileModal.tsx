import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  User, 
  Sparkles, 
  MapPin, 
  Heart, 
  Scale, 
  Ruler, 
  Calendar,
  Globe,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { AppUser } from '../types';
import { updateUserProfile } from '../services/userService';
import { processFileForUpload } from '../utils/fileHelper';
import { checkProfanity } from '../utils/profanityFilter';

interface EditProfileModalProps {
  user: AppUser;
  onClose: () => void;
  onUpdated: (updated: AppUser) => void;
}

export const GAY_TYPES = [
  { id: '⚡ รุก (Top)', label: '⚡ รุก (Top)', color: 'bg-blue-500 text-white' },
  { id: '🌸 รับ (Bottom)', label: '🌸 รับ (Bottom)', color: 'bg-pink-500 text-white' },
  { id: '🔄 โบ๊ท (Versatile)', label: '🔄 โบ๊ท (Versatile)', color: 'bg-purple-500 text-white' },
  { id: '🐻 หมี (Bear)', label: '🐻 หมี (Bear)', color: 'bg-amber-700 text-white' },
  { id: '🐰 ขาวตี๋ (Twink)', label: '🐰 ขาวตี๋ (Twink)', color: 'bg-cyan-500 text-white' },
  { id: '💪 ล่ำ / ฟิต (Muscle / Jock)', label: '💪 ล่ำ / ฟิต (Muscle / Jock)', color: 'bg-emerald-600 text-white' },
  { id: '🕶️ แด๊ดดี้ (Daddy)', label: '🕶️ แด๊ดดี้ (Daddy)', color: 'bg-slate-700 text-white' },
  { id: '🏄 สปอร์ต (Otter)', label: '🏄 สปอร์ต (Otter)', color: 'bg-teal-600 text-white' },
  { id: '🌈 เควียร์ / ไม่จำกัด (Queer)', label: '🌈 เควียร์ / ไม่จำกัด (Queer)', color: 'bg-fuchsia-600 text-white' },
];

const PROVINCES = [
  'กรุงเทพมหานคร',
  'เชียงใหม่',
  'นนทบุรี',
  'ชลบุรี',
  'ภูเก็ต',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
  'สุราษฎร์ธานี',
  'อุดรธานี',
  'เชียงราย',
  'ระยอง',
  'นครปฐม',
  'พิษณุโลก',
  'อุบลราชธานี',
  'อยุธยา',
  'ลำปาง',
  'กระบี่',
  'อื่นๆ (ต่างประเทศ)'
];

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Max',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Leo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sam',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
];

const PRESET_COVERS = [
  { name: 'นีออนไซเบอร์', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80' },
  { name: 'ชายหาดยามเย็น', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80' },
  { name: 'กาแล็กซี่', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80' },
  { name: 'มินิมอลออโรร่า', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80' },
  { name: 'สายรุ้งไพรด์', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onUpdated,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [coverURL, setCoverURL] = useState(user.coverURL || '');
  const [bio, setBio] = useState(user.bio || '');
  const [age, setAge] = useState<string>(user.age ? String(user.age) : '');
  const [height, setHeight] = useState<string>(user.height ? String(user.height) : '');
  const [weight, setWeight] = useState<string>(user.weight ? String(user.weight) : '');
  const [province, setProvince] = useState(user.province || 'กรุงเทพมหานคร');
  const [country, setCountry] = useState(user.country || 'ประเทศไทย 🇹🇭');
  const [gayType, setGayType] = useState(user.gayType || '🔄 โบ๊ท (Versatile)');
  const [gallery, setGallery] = useState<string[]>(user.gallery || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const processed = await processFileForUpload(file);
      setCoverURL(processed.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถอัปโหลดภาพปกได้';
      setError(msg);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const processed = await processFileForUpload(file);
      setPhotoURL(processed.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถอัปโหลดรูปภาพได้';
      setError(msg);
    }
  };

  const handleAddGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (gallery.length >= 9) {
      setError('คลังรูปภาพใส่ได้สูงสุด 9 รูป');
      return;
    }

    try {
      setError(null);
      const processed = await processFileForUpload(file);
      setGallery((prev) => [...prev, processed.dataUrl]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มรูปภาพ';
      setError(msg);
    }
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || saving) return;

    // Check profanity in name or bio
    const nameProfanity = checkProfanity(displayName);
    if (nameProfanity.hasProfanity) {
      setError(`🤖 GuardBot: ชื่อที่แสดงมีคำไม่สุภาพ (${nameProfanity.matchedWords.join(', ')})`);
      return;
    }

    const bioProfanity = checkProfanity(bio);
    if (bioProfanity.hasProfanity) {
      setError(`🤖 GuardBot: คำแนะนำตัวมีคำไม่สุภาพ (${bioProfanity.matchedWords.join(', ')})`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updates: Partial<AppUser> = {
        displayName: displayName.trim(),
        photoURL,
        coverURL,
        bio: bio.trim(),
        age: age ? parseInt(age, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
        weight: weight ? parseInt(weight, 10) : undefined,
        province: province.trim(),
        country: country.trim(),
        gayType: gayType.trim(),
        gallery,
      };

      await updateUserProfile(user.id, updates);
      const updatedUser: AppUser = {
        ...user,
        ...updates,
      };

      onUpdated(updatedUser);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                แก้ไขข้อมูลโปรไฟล์ (Edit Profile)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับแต่งภาพหน้าปก (Cover), รูป Avatar, Gallery และข้อมูลส่วนตัว
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Cover Banner Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  ภาพหน้าปกโปรไฟล์ (Cover Banner)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  อัปโหลดภาพขนาดแนวนอนเพื่อใช้เป็นภาพพื้นหลังด้านบนของโปรไฟล์
                </p>
              </div>
              {coverURL && (
                <button
                  type="button"
                  onClick={() => setCoverURL('')}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  ใช้สีเริ่มต้น
                </button>
              )}
            </div>

            {/* Banner Preview */}
            <div className="relative h-28 sm:h-36 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-800 group shadow-inner">
              {coverURL ? (
                <img
                  src={coverURL}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white/80 text-xs font-medium">
                  สีไล่ระดับมาตรฐาน (Default Gradient)
                </div>
              )}

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 hover:bg-black/55 text-white flex flex-col items-center justify-center gap-1 opacity-90 hover:opacity-100 transition-opacity backdrop-blur-2xs"
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-semibold">
                  {coverURL ? 'เปลี่ยนภาพหน้าปก' : 'อัปโหลดภาพหน้าปกของคุณ'}
                </span>
              </button>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                className="hidden"
              />
            </div>

            {/* Preset Cover Options */}
            <div className="pt-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                หรือเลือกภาพปกสำเร็จรูป:
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverURL(preset.url)}
                    className={`h-11 rounded-xl overflow-hidden border relative group transition-transform ${
                      coverURL === preset.url
                        ? 'ring-2 ring-indigo-500 border-transparent scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] font-semibold text-white truncate px-1 text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="relative group flex-shrink-0">
              <img
                src={photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md bg-slate-200 dark:bg-slate-700"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-semibold mt-0.5">เปลี่ยนรูป</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  อัปโหลดรูปโปรไฟล์
                </button>
              </div>

              {/* Preset avatars */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">หรือเลือกไอคอน:</span>
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoURL(preset)}
                    className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform"
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อที่ใช้แสดง (Display Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น บาส, เจมส์, Ton"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              />
            </div>

            {/* Gay Type Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                เป็นเกย์แบบไหน (Type / Role)
              </label>
              <select
                value={gayType}
                onChange={(e) => setGayType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {GAY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Physical Stats: Age, Height, Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                อายุ (ปี)
              </label>
              <input
                type="number"
                min="18"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="เช่น 26"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                ส่วนสูง (cm)
              </label>
              <input
                type="number"
                min="140"
                max="220"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="เช่น 175"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                น้ำหนัก (kg)
              </label>
              <input
                type="number"
                min="35"
                max="180"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="เช่น 68"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Location: Province & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                จังหวัด
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                ประเทศ
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="เช่น ประเทศไทย"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Bio / About me */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              คำแนะนำตัว (About Me)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เขียนแนะนำตัวเอง สไตล์ ความชอบ งานอดิเรก หรือข้อความทักทาย..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          {/* Photo Gallery Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  คลังรูปภาพส่วนตัว (Photo Gallery)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  อัปโหลดรูปภาพของคุณได้สูงสุด 9 รูป สำหรับแสดงในหน้าโปรไฟล์
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {gallery.length}/9
              </span>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddGalleryPhoto}
              className="hidden"
            />

            {/* Gallery Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {gallery.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-xs"
                >
                  <img
                    src={imgUrl}
                    alt={`gallery-${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryPhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                    title="ลบรูปนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {gallery.length < 9 && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">เพิ่มรูป</span>
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-95 text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงโปรไฟล์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
