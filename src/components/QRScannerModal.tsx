/**
 * Camera QR Scanner Modal Component
 * قارئ الـ QR Code عبر كاميرا الهاتف/الجهاز
 */

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { getStudents } from '../services/storage';
import { Student } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
  strictCameraOnly?: boolean; // For Liturgy scanning
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'مسح رمز الـ QR Code',
  subtitle = 'وجه كاميرا الهاتف نحو بطاقة هويّة الطالب للتحقق الفوري',
  strictCameraOnly = false,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-camera-reader-viewport';

  // Sound chime helper using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio fallback silent
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedFeedback(null);
      setCameraError(null);
      return;
    }

    let isMounted = true;

    async function initCameraScanner() {
      setCameraError(null);
      setIsScanning(true);

      try {
        const devices = await Html5Qrcode.getCameras();
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[0];
          setSelectedCameraId(backCam.id);
          startScanner(backCam.id);
        } else {
          setCameraError('لم يتم العثور على كاميرا متاحة في هذا الجهاز.');
          setIsScanning(false);
        }
      } catch (err: unknown) {
        console.warn('Camera access issue:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setCameraError(
          'تعذّر الوصول إلى الكاميرا. يرجى التأكد من السماح بالوصول للكاميرا من إعدادات المتصفح.'
        );
        setIsScanning(false);
      }
    }

    initCameraScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const startScanner = async (cameraId: string) => {
    stopCamera();

    try {
      const html5Qrcode = new Html5Qrcode(qrRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          playBeep();
          setScannedFeedback(`تم التعرف بنجاح: ${decodedText}`);
          setTimeout(() => {
            onScanSuccess(decodedText);
            stopCamera();
            onClose();
          }, 400);
        },
        () => {
          // ignore scan errors per frame
        }
      );
      setIsScanning(true);
      setCameraError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setCameraError('تعذّر تشغيل بث الكاميرا. يمكنك اختيار كاميرا أخرى أو استخدام كود اختبار سريح.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Stop scanner warn:', e);
      }
    }
    html5QrcodeRef.current = null;
    setIsScanning(false);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startScanner(newId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    onScanSuccess(manualCode.trim());
    onClose();
  };

  if (!isOpen) return null;

  const sampleStudentsForTesting = getStudents();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Body */}
        <div className="p-6 space-y-4">
          {/* Camera Selection Dropdown */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">اختر الكاميرا:</span>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `كاميرا ${c.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Frame */}
          <div className="relative bg-slate-950 border-2 border-dashed border-amber-500/40 rounded-2xl overflow-hidden min-h-[280px] flex items-center justify-center">
            <div id={qrRegionId} className="w-full h-full min-h-[280px]" />

            {/* Scanning Overlay Effect */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-56 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  {/* Corner notches */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
                  
                  {/* Laser Scan Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-scan-line" />
                </div>
                <span className="mt-4 text-xs text-amber-300/90 font-medium bg-slate-900/80 px-3 py-1 rounded-full border border-amber-500/30">
                  جارٍ القراءة التلقائية عبر الكاميرا...
                </span>
              </div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="p-6 text-center max-w-sm space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-sm text-slate-300 leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => cameras.length > 0 && startScanner(cameras[0].id)}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold border border-amber-500/40 inline-flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  إعادة محاولة فتح الكاميرا
                </button>
              </div>
            )}

            {/* Success Feedback Banner */}
            {scannedFeedback && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-emerald-400 font-bold gap-2 animate-scale-up">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                <p className="text-center text-sm">{scannedFeedback}</p>
              </div>
            )}
          </div>

          {/* Quick Simulation / Manual Testing Section (Allowed if non-strict OR for camera-less testing) */}
          {!strictCameraOnly ? (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="أدخل كود الطالب يدوياً (مثل STU-2026-001)"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none pr-8"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  تأكيد
                </button>
              </form>

              {sampleStudentsForTesting.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    أو انقر مباشرة لاختبار أحد الطلاب المتاحين:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {sampleStudentsForTesting.slice(0, 6).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          playBeep();
                          onScanSuccess(s.studentCode);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 rounded-lg text-[11px] text-slate-300 transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {s.fullName.split(' ')[0]} ({s.studentCode})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              ⚡ تسجيل حضور القداس مقتصر حصرياً على الكاميرا والـ QR Code لضمان الدقة والموثوقية.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
