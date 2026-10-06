export interface ProcessedFile {
  dataUrl: string;
  name: string;
  size: number;
  type: 'image' | 'document' | 'audio' | 'none';
  mimeType: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function processFileForUpload(file: File): Promise<ProcessedFile> {
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  const category: 'image' | 'document' | 'audio' = isImage
    ? 'image'
    : isAudio
    ? 'audio'
    : 'document';

  if (isImage) {
    const compressedDataUrl = await compressImage(file, 900, 900, 0.75);
    return {
      dataUrl: compressedDataUrl,
      name: file.name,
      size: Math.round(compressedDataUrl.length * 0.75),
      type: 'image',
      mimeType: file.type || 'image/jpeg',
    };
  }

  // Non-image file (e.g. PDF, Word, Text, etc.)
  // Constrain file size to 600KB for direct Firestore payload safety
  if (file.size > 650 * 1024) {
    throw new Error('ขนาดไฟล์เกินกำหนด (สูงสุด 600KB สำหรับเอกสาร เพื่อความรวดเร็วในการส่ง)');
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    name: file.name,
    size: file.size,
    type: category,
    mimeType: file.type || 'application/octet-stream',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsDataURL(file);
  });
}

function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export to WebP or JPEG
        const output = canvas.toDataURL('image/jpeg', quality);
        resolve(output);
      };
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านรูปภาพได้'));
    reader.readAsDataURL(file);
  });
}

export function downloadFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
