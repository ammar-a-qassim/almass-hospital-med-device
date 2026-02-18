import React from "react";

interface ImagePreviewProps {
  url?: string;
  label?: string;
  onClear?: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, label = "صورة الجهاز", onClear }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700">{label}</label>
      {url ? (
        <div className="flex items-center gap-3">
          <img src={url} alt="صورة الجهاز" className="w-40 h-40 object-cover rounded border bg-white" />
          <a href={url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">فتح الرابط</a>
          {onClear && (
            <button type="button" onClick={onClear} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">إزالة الصورة</button>
          )}
        </div>
      ) : (
        <div className="w-40 h-40 flex items-center justify-center rounded border bg-white text-xs text-gray-500">
          لا توجد صورة
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
