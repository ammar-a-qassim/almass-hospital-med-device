import React, { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  label?: string;
  initialDataUrl?: string;
  onChange?: (dataUrl: string | undefined) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label = "التوقيع", initialDataUrl, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const [dataUrl, setDataUrl] = useState<string | undefined>(initialDataUrl);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    // init background white
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111827"; // gray-900
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    drawing.current = false;
    const canvas = canvasRef.current!;
    const url = canvas.toDataURL("image/png");
    setDataUrl(url);
    onChange?.(url);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDataUrl(undefined);
    onChange?.(undefined);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700">{label}</label>
      <div className="border border-gray-300 rounded bg-white">
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          className="w-full h-[180px] touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={clear} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">مسح</button>
        {dataUrl && (
          <a href={dataUrl} download="signature.png" className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">
            تنزيل التوقيع PNG
          </a>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
