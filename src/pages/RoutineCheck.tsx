import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Device, DeviceState, RoutineCheck, CheckCriteria } from "../types/models";
import { devicesApi, checksApi, criteriaApi, deviceTypesApi, departmentsApi } from "../api/api";
import SignaturePad from "../components/SignaturePad";
import Modal from "../components/Modal";
import { startScanner, stopScanner, listCameras, isCameraSupported, getBrowserInfo, type ScannerInstance } from "../utils/qrScanner";

function isMobileDevice(): boolean {
  const ua = navigator.userAgent || "";
  const isTouchMac = (navigator as any).maxTouchPoints > 1 && /Macintosh/.test(ua);
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || isTouchMac;
}

const RoutineCheckPage: React.FC = () => {
  const [device, setDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanText, setScanText] = useState<string>("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraVisible, setCameraVisible] = useState<boolean>(false);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const VIDEO_ELEMENT_ID = "rc-video-scanner";
  
  // Device selection state
  const [allDevices, setAllDevices] = useState<any[]>([]);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'scan' | 'select'>('scan');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Draggable camera window state
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cameraWindowRef = useRef<HTMLDivElement>(null);

  // Check type: daily or monthly
  const [checkType, setCheckType] = useState<'daily' | 'monthly'>('daily');
  
  // Daily check state
  const [dailyRating, setDailyRating] = useState<'excellent' | 'average' | 'needs_maintenance'>('excellent');

  // Dynamic criteria from database (for monthly check)
  const [availableCriteria, setAvailableCriteria] = useState<any[]>([]);
  const [deviceTypeCriteria, setDeviceTypeCriteria] = useState<any[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  
  // Check criteria state - dynamic object
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});

  const [issue, setIssue] = useState<string>("");
  const [checkerName, setCheckerName] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [browserInfo, setBrowserInfo] = useState<{ name: string; isMobile: boolean; supported: boolean } | null>(null);
  
  // Success notification and device details modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);

  useEffect(() => {
    // Check browser support and load cameras list
    const info = getBrowserInfo();
    setBrowserInfo(info);
    
    if (!info.supported) {
      setError(`متصفح ${info.name} لا يدعم الوصول إلى الكاميرا. يُرجى تحديث المتصفح أو استخدام متصفح حديث`);
      return;
    }
    
    // Load cameras list (labels show after first permission)
    listCameras().then((cams) => {
      setCameras(cams);
    });

    // Load criteria from API
    loadCriteria();
    
    // Load devices and departments for manual selection
    loadDevicesAndDepartments();

    return () => {
      stopScan();
    };
  }, []);

  const loadCriteria = async () => {
    try {
      setCriteriaLoading(true);
      const data = await criteriaApi.getAll();
      setAvailableCriteria(data);
      
      // Initialize criteria state
      const initialCriteria: Record<string, boolean> = {};
      data.forEach((item: any) => {
        initialCriteria[item.key] = false;
      });
      setCriteria(initialCriteria);
    } catch (err) {
      console.error("Failed to load criteria:", err);
    } finally {
      setCriteriaLoading(false);
    }
  };

  const loadDevicesAndDepartments = async () => {
    try {
      const [devicesData, departmentsData] = await Promise.all([
        devicesApi.getAll(),
        departmentsApi.getAll()
      ]);
      setAllDevices(devicesData);
      setDepartments(departmentsData);
    } catch (err) {
      console.error("Failed to load devices/departments:", err);
    }
  };

  // Load device specific criteria when device is selected
  useEffect(() => {
    if (device && device.device_type_id) {
      loadDeviceTypeCriteria(device.device_type_id);
    } else {
      setDeviceTypeCriteria([]);
    }
  }, [device]);

  const loadDeviceTypeCriteria = async (typeId: number) => {
    try {
      setCriteriaLoading(true);
      const data = await deviceTypesApi.getCriteria(typeId);
      setDeviceTypeCriteria(data);
      
      // If device has specific criteria, re-initialize state based on them
      if (data.length > 0) {
        const newCriteria: Record<string, boolean> = {};
        data.forEach((item: any) => {
          newCriteria[item.key] = false;
        });
        setCriteria(newCriteria);
      }
    } catch (err) {
      console.error("Failed to load device type criteria:", err);
    } finally {
      setCriteriaLoading(false);
    }
  };

  const filteredDevices = useMemo(() => {
    if (!deviceSearch && !selectedDepartmentId) return [];
    
    return allDevices.filter(d => {
      const matchesSearch = !deviceSearch || 
        d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
        d.serial.toLowerCase().includes(deviceSearch.toLowerCase());
      
      const matchesDept = !selectedDepartmentId || 
        String(d.department_id) === String(selectedDepartmentId);
        
      return matchesSearch && matchesDept;
    });
  }, [allDevices, deviceSearch, selectedDepartmentId]);

  const selectDeviceFromList = (selectedDevice: any) => {
    setDevice(selectedDevice);
    setScannedData({
      name: selectedDevice.name,
      serial: selectedDevice.serial,
      model: selectedDevice.model,
      manufacturer: selectedDevice.manufacturer,
      supplier: selectedDevice.supplier,
      department: selectedDevice.department_name,
      supply_date: selectedDevice.supply_date,
      install_date: selectedDevice.install_date,
      service_engineer: selectedDevice.service_engineer,
      description: selectedDevice.description
    });
    setShowDeviceDropdown(false);
    setDeviceSearch("");
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const startScan = async () => {
    // Stop any existing scanner before starting a new one
    if (scannerRef.current) {
      stopScanner(scannerRef.current);
      scannerRef.current = null;
    }
    setError(null);
    setScanning(true);
    setCameraVisible(true);
    
    // Reset position if needed (center of screen)
    if (cameraPosition.x === 0 && cameraPosition.y === 0) {
      const centerX = window.innerWidth / 2 - 150;
      const centerY = window.innerHeight / 2 - 150;
      setCameraPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }

    // Wait for React to render the video element in the DOM
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    try {
      scannerRef.current = await startScanner(
        VIDEO_ELEMENT_ID,
        (result) => {
          handleScan(result);
        },
        (err) => {
          console.error("Scan error:", err);
        }
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      const msg = err?.message || "خطأ غير معروف";
      setError(`تعذر تشغيل الكاميرا: ${msg}`);
      setScanning(false);
      setCameraVisible(false);
    }
  };

  const stopScan = () => {
    if (scannerRef.current) {
      stopScanner(scannerRef.current);
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraVisible(false);
  };

  const handleScan = async (text: string) => {
    if (!text) return;
    
    // Stop scanning immediately after detection
    stopScan();
    
    // Normalize scanned text: trim whitespace
    const scannedText = text.trim();
    setScanText(scannedText);
    
    try {
      // Try to parse as JSON first (new format)
      let deviceData: any = null;
      try {
        const parsed = JSON.parse(scannedText);
        // Only treat as device data if it's an object (not a number/string)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          deviceData = parsed;
        }
      } catch (e) {
        // If not JSON, treat as serial number or ID
      }

      // Determine serial to search for
      const serialToSearch = deviceData?.serial || scannedText;

      // Strategy 1: Quick local search first (instant, no network)
      const normalize = (s: string | null | undefined): string => 
        (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedSearch = normalize(serialToSearch);
      
      let foundDevice = allDevices.find((d: any) => 
        normalize(d.serial) === normalizedSearch || String(d.id) === scannedText
      );

      // Strategy 2: If not found locally, call backend API directly (fast targeted query)
      if (!foundDevice) {
        try {
          const apiDevice = await devicesApi.searchBySerial(serialToSearch);
          if (apiDevice) {
            foundDevice = apiDevice;
            // Add to local cache so future scans are instant
            setAllDevices(prev => {
              const exists = prev.some((d: any) => d.id === apiDevice.id);
              return exists ? prev : [...prev, apiDevice];
            });
          }
        } catch (apiErr: any) {
          // 404 means not found, other errors are real failures
          if (!apiErr?.message?.includes('404')) {
            console.error("API search failed:", apiErr);
          }
        }
      }

      if (foundDevice) {
        setDevice(foundDevice);
        setScannedData({
          name: foundDevice.name,
          serial: foundDevice.serial,
          model: foundDevice.model,
          manufacturer: foundDevice.manufacturer,
          supplier: foundDevice.supplier,
          department: foundDevice.department_name,
          supply_date: foundDevice.supply_date,
          install_date: foundDevice.install_date,
          service_engineer: foundDevice.service_engineer,
          description: foundDevice.description
        });
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        setError(`الجهاز غير مسجل في النظام. الرقم التسلسلي المقروء: "${scannedText}"`);
        if (deviceData) {
          setScannedData(deviceData);
          setShowSuccessModal(true);
        }
      }
    } catch (err) {
      console.error("Error processing scan:", err);
      setError("حدث خطأ أثناء معالجة الرمز");
    }
  };

  const handleCriteriaChange = (key: string) => {
    setCriteria(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveCheck = async () => {
    if (!device) {
      setError("يجب تحديد جهاز أولاً");
      return;
    }
    if (!checkerName.trim()) {
      setError("اسم الفاحص مطلوب");
      return;
    }

    // Validation: Issue is required if rating is not excellent
    if (checkType === 'daily' && dailyRating !== 'excellent' && !issue.trim()) {
      setError("ملاحظات الاعطال مطلوبة عندما تكون حالة الجهاز غير ممتازة");
      return;
    }

    const nowIso = new Date().toISOString();
    
    // Determine state based on check type
    let state = 'excellent';
    
    if (checkType === 'daily') {
      state = dailyRating;
    } else {
      // Monthly check logic
      const activeCriteria = deviceTypeCriteria.length > 0 ? deviceTypeCriteria : availableCriteria;
      const totalCriteria = activeCriteria.length;
      
      if (totalCriteria > 0) {
        const passedCount = activeCriteria.filter((c: any) => criteria[c.key]).length;
        const failedCount = totalCriteria - passedCount;
        
        if (failedCount === 0) state = 'excellent';
        else if (failedCount === 1) state = 'good'; // We might want to map this to 'average' if 'good' is removed
        else if (failedCount === 2) state = 'average'; // mapped to 'medium' in backend?
        else state = 'needs_maintenance';
        
        // Map 'good' to 'average' if needed, or keep as is if backend supports it
        // For now, let's keep the logic but be aware of the enum values
      }
    }

    // Convert undefined values to null for D1 compatibility
    const payload = {
      device_id: device.id,
      check_date: nowIso,
      state,
      check_type: checkType,
      criteria: checkType === 'monthly' ? JSON.stringify(criteria) : null,
      issue: issue.trim() ? issue.trim() : null,
      checker_name: checkerName.trim(),
      signature_png: signatureUrl || null,
    };

    try {
      await checksApi.create(payload);
      setSaveSuccessModal(true);
      
      // Reset form
      setDevice(null);
      setDeviceTypeCriteria([]);
      
      // Reset criteria to all false
      const resetCriteria: Record<string, boolean> = {};
      availableCriteria.forEach((item: any) => {
        resetCriteria[item.key] = false;
      });
      setCriteria(resetCriteria);
      
      setIssue("");
      setCheckerName("");
      setSignatureUrl(undefined);
      setScannedData(null);
      setDailyRating('excellent');
    } catch (error: any) {
      setError(error.message || "تعذّر حفظ الفحص");
    }
  };

  // Draggable handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cameraPosition.x,
      y: e.clientY - cameraPosition.y
    });
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setCameraPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  
  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - cameraPosition.x,
      y: touch.clientY - cameraPosition.y
    });
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCameraPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Add/remove touch event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);
  
  // Center camera window on first show
  useEffect(() => {
    if (cameraVisible && cameraPosition.x === 0 && cameraPosition.y === 0) {
      const centerX = window.innerWidth / 2 - 200; // 200 = half of camera width
      const centerY = window.innerHeight / 2 - 200;
      setCameraPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }
  }, [cameraVisible]);

  const deviceSummary = device ? (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
      <div className="font-bold text-blue-900 text-lg">{device.name}</div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div><span className="text-blue-500">الرقم التسلسلي:</span> {device.serial}</div>
        <div><span className="text-blue-500">القسم:</span> {device.department_name || '-'}</div>
        <div><span className="text-blue-500">الموديل:</span> {device.model || '-'}</div>
        <div><span className="text-blue-500">الشركة:</span> {device.manufacturer || '-'}</div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-2xl font-semibold">صيانة جديدة</h2>
      
      <Modal
        isOpen={saveSuccessModal}
        onClose={() => setSaveSuccessModal(false)}
        title="نجاح"
        message="تم حفظ الصيانة بنجاح!"
        type="success"
      />

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {/* Selection Mode Toggle */}
      <div className="rounded border border-black/10 bg-white/80 p-3">
        <label className="block text-sm font-semibold text-gray-800 mb-3">طريقة تحديد الجهاز</label>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => { setSelectionMode('scan'); stopScan(); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              selectionMode === 'scan'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            مسح QR
          </button>
          <button
            type="button"
            onClick={() => { setSelectionMode('select'); stopScan(); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              selectionMode === 'select'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            اختيار من القائمة
          </button>
        </div>
        
        {/* QR Scan Mode */}
        {selectionMode === 'scan' && (
          <div className="flex items-center gap-3 flex-wrap">
            {!scanning ? (
              <button type="button" onClick={startScan} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                بدء المسح {isMobileDevice() && "(كاميرا خلفية)"}
              </button>
            ) : (
              <button type="button" onClick={stopScan} className="px-4 py-2 rounded bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
                إيقاف المسح
              </button>
            )}
            
            {!isMobileDevice() && cameras.length > 0 && (
              <div className="text-xs text-gray-600">
                الكاميرات المتاحة: {cameras.length}
              </div>
            )}
          </div>
        )}
        
        {/* Device Selection Mode */}
        {selectionMode === 'select' && (
          <div className="space-y-3">
            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">تصفية حسب القسم (اختياري)</label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm bg-gray-50"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Device Search */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">بحث عن الجهاز</label>
              <input
                type="text"
                value={deviceSearch}
                onChange={(e) => {
                  setDeviceSearch(e.target.value);
                  setShowDeviceDropdown(true);
                  if (!e.target.value) setDevice(null);
                }}
                onFocus={() => setShowDeviceDropdown(true)}
                className="w-full rounded border px-3 py-2"
                placeholder="ابحث عن جهاز بالاسم أو الرقم التسلسلي..."
              />
              {showDeviceDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredDevices.length > 0 ? (
                    <>
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b">
                        الأجهزة ({filteredDevices.length})
                      </div>
                      {filteredDevices.map((d: any) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => selectDeviceFromList(d)}
                          className="w-full text-right px-3 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{d.name}</div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{d.serial}</span>
                            {d.department_name && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{d.department_name}</span>}
                            {d.device_type_name && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{d.device_type_name}</span>}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      {deviceSearch ? 'لم يتم العثور على أجهزة مطابقة' : 'لا توجد أجهزة مسجلة'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medium draggable camera window */}
      {cameraVisible && (
        <div 
          ref={cameraWindowRef}
          className="fixed z-50 rounded-lg border-2 border-indigo-500 bg-white shadow-2xl overflow-hidden"
          style={{
            left: `${cameraPosition.x}px`,
            top: `${cameraPosition.y}px`,
            width: 'min(60vw, 400px)',
            height: 'min(60vw, 400px)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">ماسح QR - ZXing {isMobileDevice() && "(خلفية)"}</span>
            </div>
            <button 
              type="button" 
              onClick={stopScan} 
              aria-label="إغلاق" 
              className="text-white hover:bg-white/20 rounded px-2 py-1 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-4 bg-gray-900 flex items-center justify-center">
            <video 
              id={VIDEO_ELEMENT_ID} 
              className="w-full aspect-square object-cover rounded"
              autoPlay 
              playsInline
            />
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-600 text-center">
            اسحب النافذة لتحريكها • {isDragging ? "جاري السحب..." : scanning ? "جاري المسح..." : "جاهز"}
          </div>
        </div>
      )}

      {/* Device Summary */}
      <div className="rounded border border-black/10 bg-white/80 p-3">
        <div className="text-sm text-gray-700">الجهاز المحدد:</div>
        <div className="mt-1 text-sm font-medium">{device ? deviceSummary : "— امسح QR الجهاز لتحديده —"}</div>
      </div>

      {/* Check Type Selector */}
      <div className="rounded border border-black/10 bg-white/80 p-3">
        <label className="block text-sm font-semibold text-gray-800 mb-3">نوع الفحص</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCheckType('daily')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              checkType === 'daily'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            صيانة يومية
          </button>
          <button
            type="button"
            onClick={() => setCheckType('monthly')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              checkType === 'monthly'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            صيانة شهرية
          </button>
        </div>
      </div>

      {/* Check Form */}
      <div className="rounded border border-black/10 bg-white/80 p-3 space-y-4">
        {/* Daily Check - Simple Rating */}
        {checkType === 'daily' && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">التقييم السريع</label>
            <select
              value={dailyRating}
              onChange={(e) => setDailyRating(e.target.value as any)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="excellent">ممتاز</option>
              <option value="average">متوسط</option>
              <option value="needs_maintenance">بحاجة الى صيانة</option>
            </select>
          </div>
        )}

        {/* Monthly Check - Criteria Based */}
        {checkType === 'monthly' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                معايير الصيانة الشهرية
                {criteriaLoading && <span className="text-xs text-gray-500 mr-2">(جاري التحميل...)</span>}
                {device?.device_type_id && deviceTypeCriteria.length > 0 && (
                  <span className="text-xs text-purple-600 mr-2">(معايير خاصة بهذا الجهاز)</span>
                )}
              </label>
            
              {availableCriteria.length === 0 && !criteriaLoading ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">لا توجد معايير صيانة محددة. يرجى الاتصال بالمسؤول لإضافة معايير.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(deviceTypeCriteria.length > 0 ? deviceTypeCriteria : availableCriteria).map((item: any) => (
                    <label 
                      key={item.key}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50" 
                      style={{ borderColor: criteria[item.key] ? '#10b981' : '#e5e7eb' }}
                    >
                      <input
                        type="checkbox"
                        checked={criteria[item.key] || false}
                        onChange={() => handleCriteriaChange(item.key)}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{item.label_ar}</div>
                        {item.description_ar && <div className="text-xs text-gray-500">{item.description_ar}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">ملاحظات/الأعطال</label>
          <textarea 
            value={issue} 
            onChange={(e) => setIssue(e.target.value)} 
            className="w-full rounded border px-3 py-2" 
            rows={3} 
            placeholder="مثال: لا توجد أعطال. تم تنظيف الجهاز اليوم." 
          />
        </div>

        {/* Inspector Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">اسم الفاحص أو المشغل <span className="text-red-500">*</span></label>
            <input 
              value={checkerName} 
              onChange={(e) => setCheckerName(e.target.value)} 
              className="w-full rounded border px-3 py-2" 
              placeholder="مثال: مها الأحمد" 
            />
          </div>
          <SignaturePad label="التوقيع (اختياري)" initialDataUrl={signatureUrl} onChange={setSignatureUrl} />
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={saveCheck} className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-lg">
            حفظ الفحص
          </button>
        </div>
      </div>
      
      {/* Browser Info for debugging */}
      {browserInfo && (
        <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          المتصفح: {browserInfo.name} | الجهاز: {browserInfo.isMobile ? "هاتف" : "حاسوب"} | دعم الكاميرا: {browserInfo.supported ? "نعم" : "لا"} | المكتبة: ZXing (Zebra Crossing)
        </div>
      )}
      
      {/* Success Modal - Device Details */}
      {showSuccessModal && scannedData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4 flex items-center gap-3 sticky top-0">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">تم المسح بنجاح!</h3>
                <p className="text-sm text-emerald-100">تم استخراج معلومات الجهاز</p>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scannedData.name && <div className="bg-blue-50 rounded-lg p-3 border border-blue-200"><div className="text-xs text-blue-600 font-medium mb-1">اسم الجهاز</div><div className="text-sm font-bold text-blue-900">{scannedData.name}</div></div>}
                {scannedData.model && <div className="bg-purple-50 rounded-lg p-3 border border-purple-200"><div className="text-xs text-purple-600 font-medium mb-1">الموديل</div><div className="text-sm font-bold text-purple-900">{scannedData.model}</div></div>}
                {scannedData.serial && <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200"><div className="text-xs text-indigo-600 font-medium mb-1">الرقم التسلسلي</div><div className="text-sm font-bold text-indigo-900 font-mono">{scannedData.serial}</div></div>}
                {scannedData.manufacturer && <div className="bg-amber-50 rounded-lg p-3 border border-amber-200"><div className="text-xs text-amber-600 font-medium mb-1">الشركة المصنعة</div><div className="text-sm font-bold text-amber-900">{scannedData.manufacturer}</div></div>}
                {scannedData.supplier && <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200"><div className="text-xs text-cyan-600 font-medium mb-1">المورد</div><div className="text-sm font-bold text-cyan-900">{scannedData.supplier}</div></div>}
                {scannedData.department && <div className="bg-pink-50 rounded-lg p-3 border border-pink-200"><div className="text-xs text-pink-600 font-medium mb-1">القسم</div><div className="text-sm font-bold text-pink-900">{scannedData.department}</div></div>}
                {scannedData.supply_date && <div className="bg-teal-50 rounded-lg p-3 border border-teal-200"><div className="text-xs text-teal-600 font-medium mb-1">تاريخ التوريد</div><div className="text-sm font-bold text-teal-900">{scannedData.supply_date}</div></div>}
                {scannedData.install_date && <div className="bg-lime-50 rounded-lg p-3 border border-lime-200"><div className="text-xs text-lime-600 font-medium mb-1">تاريخ التثبيت</div><div className="text-sm font-bold text-lime-900">{scannedData.install_date}</div></div>}
              </div>
              {scannedData.service_engineer && <div className="bg-orange-50 rounded-lg p-3 border border-orange-200"><div className="text-xs text-orange-600 font-medium mb-1">مهندس الصيانة</div><div className="text-sm font-bold text-orange-900">{scannedData.service_engineer}</div></div>}
              {scannedData.description && <div className="bg-slate-50 rounded-lg p-4 border border-slate-200"><div className="text-xs text-slate-600 font-medium mb-2">الوصف</div><div className="text-sm text-slate-900">{scannedData.description}</div></div>}
              {device ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-emerald-800">الجهاز مطابق ومسجل في النظام</span>
                  </div>
                  <p className="text-sm text-emerald-700">يمكنك المتابعة لإجراء الفحص الروتيني.</p>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-red-800">الجهاز غير مسجل!</span>
                  </div>
                  <p className="text-sm text-red-700">هذا الجهاز غير موجود في قاعدة البيانات. يرجى تسجيله أولاً.</p>
                  <Link to="/device/new" className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">
                    تسجيل جهاز جديد
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineCheckPage;