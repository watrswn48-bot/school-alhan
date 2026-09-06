/**
 * Offline Sync Indicator & Status Controller
 * مؤشر حالة الاتصال والمزامنة السحابية التلقائية والعمل بدون إنترنت
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  Sparkles,
} from 'lucide-react';
import {
  getSyncStatus,
  subscribeToSyncStatus,
  triggerFullSync,
  SyncStatus,
} from '../services/syncQueue';
import { applyCloudDataToLocal } from '../services/storage';

interface OfflineSyncIndicatorProps {
  onRefreshData?: () => void;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({ onRefreshData }) => {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(!status.isOnline);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((newStatus) => {
      setStatus(newStatus);
      if (!newStatus.isOnline) {
        setShowOfflineBanner(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setFeedbackToast('جارٍ المزامنة السحابية مع Firebase...');
    try {
      const res = await triggerFullSync((cloudData) => {
        applyCloudDataToLocal(cloudData, onRefreshData);
      });
      setFeedbackToast(res.message);
      if (onRefreshData) onRefreshData();
    } catch {
      setFeedbackToast('تعذرت المزامنة، يرجى فحص الاتصال بالإنترنت.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return 'لم تتم بعد';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'حديثاً';
    }
  };

  return (
    <>
      {/* Navbar Status Pill */}
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs border transition-all cursor-pointer select-none ${
            !status.isOnline
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              : isSyncing || status.state === 'syncing'
              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
              : status.pendingCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800/90 border-slate-700/80 text-emerald-300 hover:bg-slate-800'
          }`}
          title="انقر لعرض تفاصيل المزامنة السحابية والعمل بدون إنترنت"
        >
          {/* Cloud Icon */}
          <Cloud
            className={`w-3.5 h-3.5 ${
              !status.isOnline
                ? 'text-amber-400'
                : isSyncing || status.state === 'syncing'
                ? 'text-blue-400 animate-pulse'
                : 'text-emerald-400'
            }`}
          />

          {/* Status Label */}
          {!status.isOnline ? (
            <div className="flex items-center gap-1 font-semibold text-amber-300">
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>أوفلاين</span>
              {status.pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
                  {status.pendingCount}
                </span>
              )}
            </div>
          ) : isSyncing || status.state === 'syncing' ? (
            <div className="flex items-center gap-1 font-medium text-blue-300">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
              <span className="hidden sm:inline">جارٍ المزامنة...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">
                {status.pendingCount > 0 ? `${status.pendingCount} معلق` : 'سحابي متزامن'}
              </span>
            </div>
          )}

          {/* Quick Manual Sync Button Inside Pill */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleManualSync();
            }}
            className={`p-1 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10 ${
              isSyncing ? 'pointer-events-none opacity-50' : ''
            }`}
            title="مزامنة فورية الآن"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </span>
        </button>

        {/* Sync Details Popover */}
        {showDetails && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDetails(false)}
            />
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 text-right backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  حالة المزامنة السحابية (Firebase)
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    status.isOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {status.isOnline ? 'متصل بالإنترنت' : 'بدون إنترنت (أوفلاين)'}
                </span>
              </div>

              <div className="space-y-2.5 my-3 text-xs">
                {/* Mode Explanation */}
                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 leading-relaxed text-slate-300">
                  {status.isOnline ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        البيانات متصلة بـ Cloud Firestore. أي تسجيل أو تعديل يتم حفظه محلياً ومزامنته سحابياً فوراً.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        المنصة تعمل بنظام <strong>Offline-First</strong>. جميع العمليات (حضور، درجات، تعديلات) تحفظ محلياً على جهازك وتعمل بدون انقطاع، وسيتم رفعها تلقائياً للسحابة فور اتصال النت.
                      </span>
                    </div>
                  )}
                </div>

                {/* Pending queue info */}
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />
                    تعديلات معلقة في طابور الرفع:
                  </span>
                  <span className="font-bold text-slate-200">
                    {status.pendingCount > 0 ? (
                      <span className="text-amber-400">{status.pendingCount} تعديل</span>
                    ) : (
                      <span className="text-emerald-400">لا يوجد (محدث بالكامل)</span>
                    )}
                  </span>
                </div>

                {/* Last sync time */}
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-950/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    آخر مزامنة سحابية:
                  </span>
                  <span className="font-medium text-slate-300">
                    {formatTimeAgo(status.lastSyncedAt)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  handleManualSync();
                }}
                disabled={isSyncing || !status.isOnline}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !status.isOnline
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing
                  ? 'جارٍ المزامنة السحابية...'
                  : !status.isOnline
                  ? 'بانتظار توفر الإنترنت للمزامنة'
                  : 'مزامنة سحابية فورية الآن'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating Offline Warning Banner */}
      {!status.isOnline && showOfflineBanner && (
        <div className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-amber-950 border-b border-amber-500/40 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 sticky top-[5.75rem] z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-100 flex-1">
            <WifiOff className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
            <span>
              <strong>أنت تعمل بدون اتصال بالإنترنت (وضع أوفلاين):</strong> المنصة تعمل بكامل طاقتها، وكل الحضور والدرجات والتعديلات محفوظة محلياً، وستتزامن سحابياً تلقائياً فور عودة الإنترنت.
            </span>
            {status.pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-950/40 text-amber-200 rounded-full font-bold text-[11px] border border-amber-400/30">
                {status.pendingCount} تعديل معلق
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualSync()}
              className="px-2.5 py-1 bg-amber-950 text-amber-200 hover:bg-slate-950 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              فحص الاتصال
            </button>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="text-amber-200 hover:text-white text-base px-1.5 cursor-pointer"
              title="إخفاء التنبيه"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Temporary Feedback Notification Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900/95 border border-amber-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </>
  );
};
