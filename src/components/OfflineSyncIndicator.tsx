import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Cloud, CheckCircle2, Clock, ArrowUpCircle, Sparkles } from 'lucide-react';
import { getSyncStatus, subscribeToSyncStatus, triggerFullSync, SyncStatus } from '../services/syncQueue';
import { applyCloudDataToLocal } from '../services/storage';

interface OfflineSyncIndicatorProps { onRefreshData?: () => void; }

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({ onRefreshData }) => {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(!status.isOnline);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((newStatus) => {
      setStatus(newStatus);
      if (!newStatus.isOnline) setShowOfflineBanner(true);
    });
    return () => { unsubscribe(); };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setFeedbackToast('جارٍ المزامنة السحابية مع Firebase...');
    try {
      const res = await triggerFullSync((cloudData) => applyCloudDataToLocal(cloudData, onRefreshData));
      setFeedbackToast(res.message);
      onRefreshData?.();
    } catch {
      setFeedbackToast('تعذرت المزامنة، يرجى فحص الاتصال بالإنترنت.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const formatTime = (value: string | null) => value ? new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'لم تتم بعد';

  return <>
    <div className="relative">
      <button onClick={() => setShowDetails(v => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs border bg-slate-800/90 border-slate-700/80 text-emerald-300">
        <Cloud className={`w-3.5 h-3.5 ${!status.isOnline ? 'text-amber-400' : isSyncing || status.state === 'syncing' ? 'text-blue-400 animate-pulse' : 'text-emerald-400'}`} />
        {!status.isOnline ? <span className="flex items-center gap-1 text-amber-300"><WifiOff className="w-3 h-3" />أوفلاين {status.pendingCount > 0 && <b>{status.pendingCount}</b>}</span> : isSyncing || status.state === 'syncing' ? <span className="flex items-center gap-1 text-blue-300"><RefreshCw className="w-3 h-3 animate-spin" />جارٍ المزامنة...</span> : <span>{status.pendingCount > 0 ? `${status.pendingCount} معلق` : 'سحابي متزامن'}</span>}
        <span onClick={e => { e.stopPropagation(); void handleManualSync(); }} className="p-1 cursor-pointer" title="مزامنة فورية الآن"><RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /></span>
      </button>
      {showDetails && <div className="absolute left-0 sm:right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-right">
        <div className="font-bold text-sm mb-3 flex items-center gap-2"><Cloud className="w-4 h-4 text-amber-400" />حالة المزامنة السحابية</div>
        <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-300 mb-3">{status.isOnline ? <span className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />متصل، والتعديلات تتم مزامنتها تلقائياً.</span> : <span className="flex gap-2"><WifiOff className="w-4 h-4 text-amber-400" />أوفلاين، والتعديلات محفوظة محلياً.</span>}</div>
        <div className="flex justify-between text-xs mb-2"><span className="flex items-center gap-1"><ArrowUpCircle className="w-3 h-3" />التعديلات المعلقة</span><b>{status.pendingCount}</b></div>
        <div className="flex justify-between text-xs mb-3"><span className="flex gap-1"><Clock className="w-3 h-3" />آخر مزامنة</span><span>{formatTime(status.lastSyncedAt)}</span></div>
        <button onClick={() => void handleManualSync()} disabled={isSyncing || !status.isOnline} className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs disabled:bg-slate-800 disabled:text-slate-500"><RefreshCw className={`w-3 h-3 inline mr-1 ${isSyncing ? 'animate-spin' : ''}`} />{isSyncing ? 'جارٍ المزامنة...' : 'مزامنة الآن'}</button>
      </div>}
    </div>
    {!status.isOnline && showOfflineBanner && <div className="bg-amber-700 text-amber-100 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3"><span className="flex items-center gap-2"><WifiOff className="w-4 h-4" />أوفلاين: التعديلات محفوظة محلياً وستتزامن عند عودة الإنترنت. {status.pendingCount > 0 && `(${status.pendingCount} معلقة)`}</span><button onClick={() => setShowOfflineBanner(false)}>✕</button></div>}
    {feedbackToast && <div className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-amber-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold"><Sparkles className="w-4 h-4 text-amber-400" /><span>{feedbackToast}</span></div>}
  </>;
};
