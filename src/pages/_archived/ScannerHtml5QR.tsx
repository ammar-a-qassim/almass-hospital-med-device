import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCAN_REGION_ID = "html5qr-scan-region";

const ScannerHtml5QR: React.FC = () => {
  const html5qrRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isBackCamera, setIsBackCamera] = useState(true); // back/environ by default on mobile
  const [resultText, setResultText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prepare scanner instance once
    if (!html5qrRef.current) {
      html5qrRef.current = new Html5Qrcode(SCAN_REGION_ID);
    }
    return () => {
      // Cleanup when leaving page
      stopScan();
      html5qrRef.current?.clear();
      html5qrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScan = async () => {
    setError(null);
    setResultText("");
    try {
      if (!html5qrRef.current) {
        html5qrRef.current = new Html5Qrcode(SCAN_REGION_ID);
      }
      // Facing mode config for mobile; browsers map it to front/back cameras
      const cameraConfig: { facingMode: "environment" | "user" } = {
        facingMode: isBackCamera ? "environment" : "user",
      };
      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      } as const;

      const onSuccess = (decodedText: string) => {
        setResultText(decodedText);
        // Auto-stop after first successful read
        stopScan();
      };
      const onFailure = (_errorMessage: string) => {
        // ignore per-frame errors; keep UI clean
      };

      await html5qrRef.current.start(cameraConfig, config, onSuccess, onFailure);
      setScanning(true);
    } catch (e: any) {
      console.error(e);
      setError("Camera access failed. Ensure HTTPS and grant permissions.");
      setScanning(false);
    }
  };

  const stopScan = async () => {
    try {
      if (html5qrRef.current && scanning) {
        await html5qrRef.current.stop();
      }
    } catch {}
    setScanning(false);
  };

  const toggleCamera = async () => {
    setIsBackCamera((v) => !v);
    // If scanning, restart with new facing mode
    if (scanning) {
      await stopScan();
      await startScan();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <h2 className="text-2xl font-semibold mb-4">HTML5 QR Scanner</h2>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live camera feed & scan area */}
        <div className="space-y-3">
          <div className="rounded border border-black/10 bg-white/70 backdrop-blur p-3">
            <div id={SCAN_REGION_ID} className="w-full h-[320px] flex items-center justify-center" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!scanning ? (
              <button type="button" onClick={startScan} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">Start scanning</button>
            ) : (
              <button type="button" onClick={stopScan} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">Stop scanning</button>
            )}
            <button type="button" onClick={toggleCamera} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">
              Switch to {isBackCamera ? "Front" : "Back"} camera
            </button>
            <span className="text-xs text-gray-600">Works on HTTPS (desktop & mobile)</span>
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-3">
          <div className="rounded border border-black/10 bg-white/80 p-3 min-h-[120px]">
            <div className="text-sm text-gray-700 mb-2">Scanned text</div>
            <div className="text-sm break-all">{resultText || "— No result yet —"}</div>
          </div>
          <div className="rounded border border-dashed border-gray-300 bg-white/60 p-3">
            <div className="text-sm font-medium mb-2">Tips</div>
            <ul className="text-sm text-gray-700 list-disc pr-5 space-y-1">
              <li>Grant camera permission.</li>
              <li>Use back camera for best focus.</li>
              <li>Ensure sufficient light and steady frame.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerHtml5QR;
