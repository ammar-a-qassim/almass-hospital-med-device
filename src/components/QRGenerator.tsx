import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  text: string;
  size?: number; // px
  label?: string;
  onClear?: () => void; // notify parent to hide or reset QR
  showControls?: boolean; // show download/clear buttons (default true)
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ text, size = 200, label = "رمز QR", onClear, showControls = true }) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState<boolean>(false);

  useEffect(() => {
    if (cleared) return; // keep cleared until parent re-mounts or text changes intentionally
    (async () => {
      try {
        const url = await QRCode.toDataURL(text, { width: size, margin: 1 });
        setDataUrl(url);
        setError(null);
      } catch (e) {
        setError("تعذّر توليد رمز QR");
      }
    })();
  }, [text, size, cleared]);

  const handleClear = () => {
    setCleared(true);
    setDataUrl("");
    setError("تم مسح QR");
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        {dataUrl && !cleared ? (
          <img src={dataUrl} alt="QR code" style={{ width: size, height: size }} className="border rounded bg-white" />
        ) : (
          <div style={{ width: size, height: size }} className="border rounded flex items-center justify-center text-sm text-gray-500 bg-white">
            {error ?? "جارٍ التوليد..."}
          </div>
        )}
        {showControls && (
          <div className="flex items-center gap-2">
            {dataUrl && !cleared && (
              <a href={dataUrl} download="device-qr.png" className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">تنزيل QR</a>
            )}
            <button type="button" onClick={handleClear} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">مسح QR</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;
