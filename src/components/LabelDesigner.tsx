import React, { useEffect, useMemo, useRef, useState } from "react";
import QRGenerator from "./QRGenerator";
import type { Device } from "../types/models";
import { toPng } from "html-to-image";
import QRCode from "qrcode";

interface LabelDesignerProps {
  devicePreview: Partial<Device> & { serial?: string };
  showName: boolean;
  showDepartment: boolean;
  departmentName?: string;
  deviceTypeName?: string;
  showSerial: boolean;
  showQR: boolean;
  showLogo: boolean;
  customText?: string;
  onPrint?: () => void;
  resetTrigger?: number; // increments to reset design (not dimensions)
}

const cmToPx = (cm: number) => Math.round(cm * 37.79527559); // 96dpi ≈ 37.795 px/cm

type QRPosition = "bottom-left" | "bottom-right" | "bottom-center";

function computeLeft(pos: QRPosition, containerW: number, qrW: number, margin = 8): number {
  switch (pos) {
    case "bottom-left":
      return margin;
    case "bottom-right":
      return Math.max(margin, containerW - qrW - margin);
    case "bottom-center":
    default:
      return Math.max(margin, Math.round((containerW - qrW) / 2));
  }
}

const LabelDesigner: React.FC<LabelDesignerProps> = ({
  devicePreview,
  showName,
  showDepartment,
  departmentName,
  deviceTypeName,
  showSerial,
  showQR,
  showLogo,
  customText,
  onPrint,
  resetTrigger,
}) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  // Persisted dimensions in localStorage
  const DIM_KEY = "mdf_label_dims";
  const loadDims = () => {
    try {
      const raw = localStorage.getItem(DIM_KEY);
      return raw ? JSON.parse(raw) as { pageW?: number; pageH?: number; labelW?: number; labelH?: number; qr?: number } : {};
    } catch { return {}; }
  };
  const initial = loadDims();

  // Page (portrait) and label dimensions in centimeters
  const [pageWidthCm, setPageWidthCm] = useState<number>(initial.pageW ?? 21);
  const [pageHeightCm, setPageHeightCm] = useState<number>(initial.pageH ?? 29.7);
  const [labelWidthCm, setLabelWidthCm] = useState<number>(initial.labelW ?? 8);
  const [labelHeightCm, setLabelHeightCm] = useState<number>(initial.labelH ?? 8);
  const [qrSizeCm, setQrSizeCm] = useState<number>(initial.qr ?? 4);
  const [exportScale, setExportScale] = useState<number>(3); // 1-4

  // Position and dragging state
  const [qrPosition, setQrPosition] = useState<QRPosition>("bottom-center");
  const [dragEnabled, setDragEnabled] = useState<boolean>(true);
  const [qrOffsetX, setQrOffsetX] = useState<number>(8);
  const [qrOffsetY, setQrOffsetY] = useState<number>(8);
  const dragging = useRef<boolean>(false);
  const dragStartLocalX = useRef<number>(0);
  const dragStartLocalY = useRef<number>(0);

  const pageWidthPx = cmToPx(pageWidthCm);
  const pageHeightPx = cmToPx(pageHeightCm);
  const labelWidthPx = cmToPx(labelWidthCm);
  const labelHeightPx = cmToPx(labelHeightCm);
  const qrSizePx = cmToPx(qrSizeCm);
  const marginPx = 16; // page margin

  const availableW = pageWidthPx - marginPx * 2;
  const availableH = pageHeightPx - marginPx * 2;
  const labelScale = Math.min(1, availableW / labelWidthPx, availableH / labelHeightPx);

  useEffect(() => {
    const baseLeft = computeLeft(qrPosition, labelWidthPx, qrSizePx, 8);
    const baseTop = labelHeightPx - qrSizePx - 8;
    
    setQrOffsetX((prev) => {
      const clamped = Math.max(0, Math.min(prev, labelWidthPx - qrSizePx));
      return dragEnabled ? clamped : baseLeft;
    });
    
    setQrOffsetY((prev) => {
      const clamped = Math.max(0, Math.min(prev, labelHeightPx - qrSizePx));
      return dragEnabled ? clamped : baseTop;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragEnabled, qrPosition, labelWidthPx, labelHeightPx, qrSizePx]);

  // Persist dims whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(DIM_KEY, JSON.stringify({ pageW: pageWidthCm, pageH: pageHeightCm, labelW: labelWidthCm, labelH: labelHeightCm, qr: qrSizeCm }));
    } catch {}
  }, [pageWidthCm, pageHeightCm, labelWidthCm, labelHeightCm, qrSizeCm]);

  // Toggles for fields
  const [showNameState, setShowNameState] = useState<boolean>(showName);
  const [showDepartmentState, setShowDepartmentState] = useState<boolean>(showDepartment);
  const [showSerialState, setShowSerialState] = useState<boolean>(showSerial);
  const [showSupplierState, setShowSupplierState] = useState<boolean>(false);
  const [showManufacturerState, setShowManufacturerState] = useState<boolean>(false);
  const [showModelState, setShowModelState] = useState<boolean>(false);
  const [showSupplyDateState, setShowSupplyDateState] = useState<boolean>(false);
  const [showInstallDateState, setShowInstallDateState] = useState<boolean>(false);
  const [showServiceEngineerState, setShowServiceEngineerState] = useState<boolean>(false);
  const [showEngineerPhoneState, setShowEngineerPhoneState] = useState<boolean>(false);
  const [showLastMaintenanceState, setShowLastMaintenanceState] = useState<boolean>(false);
  const [showNextMaintenanceState, setShowNextMaintenanceState] = useState<boolean>(false);
  const [showDeviceTypeState, setShowDeviceTypeState] = useState<boolean>(false);
  const [showRepairDateState, setShowRepairDateState] = useState<boolean>(false);
  const [showDescriptionState, setShowDescriptionState] = useState<boolean>(false);
  const [showSignatureState, setShowSignatureState] = useState<boolean>(false);
  const [showQRState, setShowQRState] = useState<boolean>(showQR);
  const [showLogoState, setShowLogoState] = useState<boolean>(showLogo);
  const [showCostState, setShowCostState] = useState<boolean>(false);
  const [showWarrantyState, setShowWarrantyState] = useState<boolean>(false);
  const [customTextState, setCustomTextState] = useState<string>(customText || "");
  // New: show department in label
  const [showDepartmentLabelState, setShowDepartmentLabelState] = useState<boolean>(false);

  // QR code now contains only the serial number (not all device data)
  const qrText = useMemo(() => {
    return devicePreview.serial || "";
  }, [devicePreview.serial]);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!qrText) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(qrText, { width: qrSizePx, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [qrText, qrSizePx]);

  const openPrint = () => {
    const html = pageRef.current?.outerHTML ?? "";
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>` +
      `<title>طباعة الملصق</title>` +
      `<style>body{margin:0;font-family:system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Arabic, sans-serif}</style>` +
      `</head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    onPrint?.();
  };

  const showPreview = async () => {
    if (!pageRef.current) return;
    try {
      const url = await toPng(pageRef.current, {
        pixelRatio: Math.min(Math.max(exportScale, 1), 4),
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: pageWidthPx,
        height: pageHeightPx,
        style: { width: `${pageWidthPx}px`, height: `${pageHeightPx}px` },
        useCORS: true,
      });
      const win = window.open("");
      if (win) {
        win.document.write(`<img src="${url}" style="max-width:100%" />`);
        win.document.close();
      }
    } catch {
      alert("تعذّر إنشاء المعاينة");
    }
  };

  const saveImage = async () => {
    if (!pageRef.current) return;
    try {
      const url = await toPng(pageRef.current, {
        pixelRatio: Math.min(Math.max(exportScale, 1), 4),
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: pageWidthPx,
        height: pageHeightPx,
        style: { width: `${pageWidthPx}px`, height: `${pageHeightPx}px` },
        useCORS: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "device-label-page.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("تعذّر حفظ الصورة");
    }
  };

  const downloadQR = async () => {
    try {
      const url = await QRCode.toDataURL(qrText, { width: qrSizePx, margin: 1 });
      const a = document.createElement("a");
      a.href = url;
      a.download = "device-qr.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // ignore
    }
  };

  const clearQR = () => {
    setShowQRState(false);
  };

  // Drag handlers (free movement within label)
  const getLocalPos = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = labelRef.current?.getBoundingClientRect();
    const scale = labelScale;
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    return {
      x: (e.clientX - left) / (scale || 1),
      y: (e.clientY - top) / (scale || 1)
    };
  };

  const onQrPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled) return;
    dragging.current = true;
    const pos = getLocalPos(e);
    dragStartLocalX.current = pos.x - qrOffsetX;
    dragStartLocalY.current = pos.y - qrOffsetY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onQrPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || !dragging.current) return;
    const pos = getLocalPos(e);
    const nextX = pos.x - dragStartLocalX.current;
    const nextY = pos.y - dragStartLocalY.current;
    
    // Clamp to label boundaries
    const clampedX = Math.max(0, Math.min(nextX, labelWidthPx - qrSizePx));
    const clampedY = Math.max(0, Math.min(nextY, labelHeightPx - qrSizePx));
    
    setQrOffsetX(clampedX);
    setQrOffsetY(clampedY);
  };

  const onQrPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled) return;
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const bottomPadding = 0; // No reserved space, QR floats freely

  // Reset design (not dimensions) when resetTrigger changes
  useEffect(() => {
    if (typeof resetTrigger !== "number") return;
    // Clear visual toggles and text
    setShowNameState(false);
    setShowDepartmentState(false);
    setShowSerialState(false);
    setShowSupplierState(false);
    setShowManufacturerState(false);
    setShowModelState(false);
    setShowSupplyDateState(false);
    setShowInstallDateState(false);
    setShowServiceEngineerState(false);
    setShowRepairDateState(false);
    setShowSignatureState(false);
    setShowQRState(false);
    setShowLogoState(false);
    setShowDepartmentLabelState(false);
    setShowCostState(false);
    setShowWarrantyState(false);
    setCustomTextState("");
    setQrPosition("bottom-center");
    // Reset QR position to bottom center
    setQrOffsetX((labelWidthPx - qrSizePx) / 2);
    setQrOffsetY(labelHeightPx - qrSizePx - 8);
  }, [resetTrigger, labelWidthPx, labelHeightPx, qrSizePx]);

  // Ensure department switch auto-enables when a department name is provided
  useEffect(() => {
    if (departmentName && showDepartment) {
      setShowDepartmentState(true);
    }
  }, [departmentName, showDepartment]);

  return (
    <div className="space-y-3">
      {/* Settings ABOVE page preview */}
      <div className="border rounded p-3 bg-white space-y-3">
        <div className="text-sm font-semibold">إعدادات الصفحة والملصق</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700">عرض الصفحة (سم)</label>
            <input type="number" step={0.1} min={10} max={30} value={pageWidthCm} onChange={(e) => e.target.value && setPageWidthCm(Number(e.target.value) || 21)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">ارتفاع الصفحة (سم)</label>
            <input type="number" step={0.1} min={15} max={42} value={pageHeightCm} onChange={(e) => e.target.value && setPageHeightCm(Number(e.target.value) || 29.7)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">عرض الملصق (سم)</label>
            <input type="number" step={0.1} min={2} max={30} value={labelWidthCm} onChange={(e) => setLabelWidthCm(Number(e.target.value) || 8)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">ارتفاع الملصق (سم)</label>
            <input type="number" step={0.1} min={2} max={30} value={labelHeightCm} onChange={(e) => setLabelHeightCm(Number(e.target.value) || 8)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">حجم QR (سم)</label>
            <input type="number" step={0.1} min={1} max={20} value={qrSizeCm} onChange={(e) => setQrSizeCm(Number(e.target.value) || 4)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">مقياس التصدير (1-4)</label>
            <input type="number" min={1} max={4} value={exportScale} onChange={(e) => setExportScale(Number(e.target.value) || 3)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          {!dragEnabled && (
            <div>
              <label className="block text-sm text-gray-700">مكان QR</label>
              <select value={qrPosition} onChange={(e) => setQrPosition(e.target.value as QRPosition)} className="mt-1 w-full rounded border px-3 py-2">
                <option value="bottom-left">أسفل يسار</option>
                <option value="bottom-right">أسفل يمين</option>
                <option value="bottom-center">أسفل الوسط</option>
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dragEnabled} onChange={(e) => setDragEnabled(e.target.checked)} /> تمكين سحب موضع QR</label>
          <div>
            <label className="block text-sm text-gray-700">نص مخصص</label>
            <input type="text" value={customTextState} onChange={(e) => setCustomTextState(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showNameState} onChange={(e) => setShowNameState(e.target.checked)} /> اسم الجهاز</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDepartmentState} onChange={(e) => setShowDepartmentState(e.target.checked)} /> القسم {departmentName && <span className="text-xs text-gray-500">({departmentName})</span>}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSerialState} onChange={(e) => setShowSerialState(e.target.checked)} /> الرقم التسلسلي</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDeviceTypeState} onChange={(e) => setShowDeviceTypeState(e.target.checked)} /> نوع الجهاز</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showEngineerPhoneState} onChange={(e) => setShowEngineerPhoneState(e.target.checked)} /> هاتف المهندس</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showLastMaintenanceState} onChange={(e) => setShowLastMaintenanceState(e.target.checked)} /> آخر صيانة</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showNextMaintenanceState} onChange={(e) => setShowNextMaintenanceState(e.target.checked)} /> الصيانة التالية</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDescriptionState} onChange={(e) => setShowDescriptionState(e.target.checked)} /> الوصف</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showModelState} onChange={(e) => setShowModelState(e.target.checked)} /> رقم الموديل</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSupplierState} onChange={(e) => setShowSupplierState(e.target.checked)} /> شركة التوريد</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showManufacturerState} onChange={(e) => setShowManufacturerState(e.target.checked)} /> شركة التصنيع</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSupplyDateState} onChange={(e) => setShowSupplyDateState(e.target.checked)} /> تاريخ التوريد</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showInstallDateState} onChange={(e) => setShowInstallDateState(e.target.checked)} /> تاريخ التركيب</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showServiceEngineerState} onChange={(e) => setShowServiceEngineerState(e.target.checked)} /> مهندس الصيانة</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showRepairDateState} onChange={(e) => setShowRepairDateState(e.target.checked)} /> تاريخ الإصلاح</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSignatureState} onChange={(e) => setShowSignatureState(e.target.checked)} /> التوقيع</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showQRState} onChange={(e) => setShowQRState(e.target.checked)} /> إظهار QR</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showLogoState} onChange={(e) => setShowLogoState(e.target.checked)} /> إظهار الشعار</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDepartmentLabelState} onChange={(e) => setShowDepartmentLabelState(e.target.checked)} /> اسم القسم</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCostState} onChange={(e) => setShowCostState(e.target.checked)} /> سعر التكلفة</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showWarrantyState} onChange={(e) => setShowWarrantyState(e.target.checked)} /> حالة الضمان</label>
        </div>

        {/* Controls inside settings (review settings) */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button type="button" onClick={downloadQR} className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">تنزيل QR</button>
          <button type="button" onClick={clearQR} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm">مسح QR</button>
          <button type="button" onClick={openPrint} className="px-3 py-2 rounded bg-sky-600 text-white text-sm">طباعة الصفحة</button>
          <button type="button" onClick={showPreview} className="px-3 py-2 rounded bg-amber-500 text-white text-sm">معاينة الصفحة</button>
          <button type="button" onClick={saveImage} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm">حفظ PNG</button>
        </div>

      </div>

      {/* Page container (portrait) with centered/scaled label */}
      <div
        ref={pageRef}
        className="border rounded bg-white relative"
        style={{ width: pageWidthPx, height: pageHeightPx, padding: marginPx, display: "flex", flexDirection: "column" }}
      >
        <div
          ref={labelRef}
          className="relative flex-1 border border-gray-200 bg-white overflow-hidden"
          style={{ width: labelWidthPx, minHeight: labelHeightPx, transform: `scale(${labelScale})`, transformOrigin: "top left" }}
        >
          <div className="p-4 space-y-2">
            {showLogoState && (
              <div className="mb-2">
                <img src="/assets/logo.png" alt="شعار" className="h-12 w-auto object-contain" />
              </div>
            )}
            
            <div className="space-y-1.5 text-right">
              {showNameState && (
                <div className="text-base font-bold border-b pb-1 mb-2">{devicePreview.name || "اسم الجهاز"}</div>
              )}
              {showDepartmentState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">القسم:</span>
                  <span>{departmentName || "—"}</span>
                </div>
              )}
              {showSerialState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">الرقم التسلسلي:</span>
                  <span className="font-mono">{devicePreview.serial || "—"}</span>
                </div>
              )}
              {showDeviceTypeState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">نوع الجهاز:</span>
                  <span>{deviceTypeName || "—"}</span>
                </div>
              )}
              {showModelState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">الموديل:</span>
                  <span>{devicePreview.model || "—"}</span>
                </div>
              )}
              {showSupplierState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">المورد:</span>
                  <span>{devicePreview.supplier || "—"}</span>
                </div>
              )}
              {showManufacturerState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">المصنع:</span>
                  <span>{devicePreview.manufacturer || "—"}</span>
                </div>
              )}
              {showEngineerPhoneState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">هاتف المهندس:</span>
                  <span dir="ltr">{devicePreview.engineer_phone || "—"}</span>
                </div>
              )}
              {showSupplyDateState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">تاريخ التوريد:</span>
                  <span>{devicePreview.supply_date || "—"}</span>
                </div>
              )}
              {showInstallDateState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">تاريخ التركيب:</span>
                  <span>{devicePreview.install_date || "—"}</span>
                </div>
              )}
              {showLastMaintenanceState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">آخر صيانة:</span>
                  <span>{devicePreview.last_maintenance_date || "—"}</span>
                </div>
              )}
              {showNextMaintenanceState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">الصيانة القادمة:</span>
                  <span>{devicePreview.next_maintenance_date || "—"}</span>
                </div>
              )}
              {showServiceEngineerState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">مهندس الصيانة:</span>
                  <span>{devicePreview.service_engineer || "—"}</span>
                </div>
              )}
              {showRepairDateState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">تاريخ الإصلاح:</span>
                  <span>{devicePreview.repair_date || "—"}</span>
                </div>
              )}
              {showCostState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">سعر التكلفة:</span>
                  <span>{devicePreview.cost ? Number(devicePreview.cost).toLocaleString('en-US') + ' د.ع' : "—"}</span>
                </div>
              )}
              {showWarrantyState && (
                <div className="text-sm flex items-center gap-2">
                  <span className="font-semibold min-w-[80px]">حالة الضمان:</span>
                  <span>
                    {devicePreview.is_under_warranty 
                      ? `داخل الضمان (ينتهي: ${devicePreview.warranty_expiry_date || "—"})` 
                      : "خارج الضمان"}
                  </span>
                </div>
              )}
              {showDescriptionState && (
                <div className="text-sm mt-2 pt-2 border-t">
                  <span className="font-semibold block mb-1">الوصف:</span>
                  <p className="text-gray-600 whitespace-pre-wrap">{devicePreview.description || "—"}</p>
                </div>
              )}
              {customTextState && (
                <div className="text-sm mt-2 pt-2 border-t text-center font-medium">
                  {customTextState}
                </div>
              )}
              {showDepartmentLabelState && (
                <div className="text-sm font-semibold text-indigo-700 mt-1 border-t pt-1">القسم: {departmentName || "—"}</div>
              )}
              {showSignatureState && devicePreview.signature_png && (
                <div className="mt-1">
                  <img src={devicePreview.signature_png} alt="التوقيع" className="w-[140px] h-[50px] object-contain border rounded bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* Draggable QR Code */}
          {showQRState && qrDataUrl && (
            <div
              className="absolute cursor-move touch-none border-2 border-transparent hover:border-blue-400 rounded"
              style={{
                left: qrOffsetX,
                top: qrOffsetY,
                width: qrSizePx,
                height: qrSizePx,
              }}
              onPointerDown={onQrPointerDown}
              onPointerMove={onQrPointerMove}
              onPointerUp={onQrPointerUp}
            >
              <img src={qrDataUrl} alt="QR" className="w-full h-full" draggable={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelDesigner;
