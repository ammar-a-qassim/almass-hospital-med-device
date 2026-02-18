import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

export type ScannerInstance = {
  controls: IScannerControls | null;
  reader: BrowserMultiFormatReader;
};

/**
 * Detect browser type for better error messages and compatibility
 */
function detectBrowser(): { name: string; isMobile: boolean } {
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return { name: "Safari", isMobile };
  }
  if (/Firefox/i.test(ua)) {
    return { name: "Firefox", isMobile };
  }
  if (/Chrome/i.test(ua)) {
    return { name: "Chrome", isMobile };
  }
  if (/Edg/i.test(ua)) {
    return { name: "Edge", isMobile };
  }
  return { name: "Unknown", isMobile };
}

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  const ua = navigator.userAgent || "";
  const isTouchMac = (navigator as any).maxTouchPoints > 1 && /Macintosh/.test(ua);
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || isTouchMac;
}

/**
 * Get detailed error message based on browser and error type
 */
function getErrorMessage(error: any): string {
  const browser = detectBrowser();
  const errorMessage = (typeof error === 'object' && error !== null) ? (error.message || "") : String(error || "");
  const errorName = errorMessage || (typeof error === 'object' && error !== null ? error.name : "") || "خطأ غير معروف";
  
  // Browser-specific messages
  if (errorName.includes("NotAllowedError") || errorName.includes("Permission")) {
    if (browser.name === "Safari") {
      return browser.isMobile 
        ? "يُرجى منح إذن الكاميرا في الإعدادات: الإعدادات → Safari → الكاميرا → اسمح"
        : "يُرجى منح إذن الكاميرا في Safari من خلال: Safari → الإعدادات → الموقع الإلكتروني → الكاميرا";
    }
    if (browser.name === "Firefox") {
      return "يُرجى النقر على أيقونة الكاميرا في شريط العنوان والسماح بالوصول";
    }
    return "يُرجى منح إذن الوصول إلى الكاميرا عند الطلب";
  }
  
  if (errorName.includes("NotFoundError") || errorName.includes("DevicesNotFound")) {
    return "لم يتم العثور على كاميرا متاحة على هذا الجهاز";
  }
  
  if (errorName.includes("NotReadableError") || errorName.includes("TrackStart")) {
    return "الكاميرا مستخدمة من قبل تطبيق آخر. يُرجى إغلاق التطبيقات الأخرى والمحاولة مرة أخرى";
  }
  
  if (errorName.includes("OverconstrainedError") || errorName.includes("Constraint")) {
    return "إعدادات الكاميرا المطلوبة غير مدعومة. جرّب تبديل الكاميرا";
  }
  
  if (errorName === "UNSUPPORTED_BROWSER") {
    return `متصفح ${browser.name} غير مدعوم أو يحتاج إلى تحديث. يُرجى استخدام Chrome أو Safari أو Firefox الحديث`;
  }
  
  if (errorName.includes("HTTPS") || window.location.protocol !== "https:") {
    return "يتطلب الوصول للكاميرا اتصال HTTPS آمن";
  }
  
  return `خطأ في فتح الكاميرا: ${errorName}. يُرجى التحقق من الإعدادات والمحاولة مرة أخرى`;
}

/**
 * Start ZXing QR/Barcode scanner
 * On mobile: uses back camera only (environment)
 * On desktop: uses default camera
 */
export async function startScanner(
  videoElementId: string,
  onSuccess: (decodedText: string) => void,
  onError?: (err: string) => void
): Promise<ScannerInstance> {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("UNSUPPORTED_BROWSER");
    }

    // Create ZXing reader with QR code and barcode support
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    
    const reader = new BrowserMultiFormatReader(hints);
    
    // Get video element with retry for React render timing
    let videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    if (!videoElement) {
      // Wait a frame and retry in case React hasn't committed the render yet
      await new Promise(r => requestAnimationFrame(r));
      videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    }
    if (!videoElement) {
      throw new Error("لم يتم العثور على عنصر الفيديو. يُرجى المحاولة مرة أخرى");
    }

    // Determine constraints: BACK CAMERA ONLY on mobile
    const isMobile = isMobileDevice();
    let selectedDeviceId: string | undefined;
    
    if (isMobile) {
      // On mobile: find and use back camera ONLY
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Look for back camera
      const backCamera = videoDevices.find(device => 
        /back|rear|environment|خلف/i.test(device.label)
      );
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      } else if (videoDevices.length > 0) {
        // Fallback: use last camera (usually back on mobile)
        selectedDeviceId = videoDevices[videoDevices.length - 1].deviceId;
      }
    }
    
    // Start scanning
    const controls = await reader.decodeFromVideoDevice(
      selectedDeviceId, // undefined = default camera on desktop, specific device on mobile
      videoElement,
      (result, error) => {
        if (result) {
          onSuccess(result.getText());
        }
        if (error) {
          // Filter out normal "no code in frame" errors (name gets minified in production builds)
          const errMsg = error.message || "";
          const errName = error.name || "";
          const isNotFound = 
            errName === "NotFoundException" ||
            errMsg.includes("No MultiFormat Readers") ||
            errMsg.includes("not found") ||
            errMsg.includes("NotFoundException");
          if (!isNotFound && onError) {
            console.error("ZXing decode error:", error);
          }
        }
      }
    );

    return { controls, reader };
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    if (onError) {
      onError(errorMessage);
    }
    throw new Error(errorMessage);
  }
}

/**
 * Stop the scanner and release camera
 */
export async function stopScanner(scanner?: ScannerInstance | null): Promise<void> {
  if (!scanner || !scanner.controls) return;
  try {
    scanner.controls.stop();
  } catch (err) {
    console.error("Error stopping scanner:", err);
  }
}

/**
 * List available cameras
 */
export async function listCameras(): Promise<MediaDeviceInfo[]> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn("enumerateDevices not supported");
      return [];
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (err) {
    console.error("Error listing cameras:", err);
    return [];
  }
}

/**
 * Check if camera API is supported in current browser
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get browser information for debugging
 */
export function getBrowserInfo(): { name: string; isMobile: boolean; supported: boolean } {
  const browser = detectBrowser();
  return {
    ...browser,
    supported: isCameraSupported()
  };
}
