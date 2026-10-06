import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { downloadFile } from '../utils/fileHelper';

interface ImageViewerModalProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  imageName,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between mb-3 text-white px-2">
          <p className="text-xs sm:text-sm font-medium truncate max-w-[70%]">
            {imageName}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadFile(imageUrl, imageName)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/10 max-h-[80vh]">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[80vh] w-auto object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
};
