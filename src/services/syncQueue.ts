/**
 * Offline Sync Queue & Network Connectivity Engine
 * إدارة طابور المزامنة التلقائية والعمل بدون إنترنت (Offline-First)
 */

import {
  syncStudentToCloud,
  deleteStudentFromCloud,
  syncServantToCloud,
  deleteServantFromCloud,
  syncLiturgyAttendanceToCloud,
  syncLectureToCloud,
  deleteLectureFromCloud,
  syncLectureAttendanceToCloud,
  syncSubjectResultToCloud,
  deleteSubjectResultFromCloud,
  syncBehaviorNoteToCloud,
  syncAcademicSettingsToCloud,
  syncCurriculumToCloud,
  deleteCurriculumFromCloud,
  fetchAllDataFromFirebase,
  syncSchoolLogoToCloud,
} from './firebaseService';

export type MutationType =
  | 'save_student'
  | 'delete_student'
  | 'save_servant'
  | 'delete_servant'
  | 'save_liturgy'
  | 'save_lecture'
  | 'delete_lecture'
  | 'save_lecture_attendance'
  | 'save_subject_result'
  | 'delete_subject_result'
  | 'save_behavior_note'
  | 'save_academic_settings'
  | 'save_curriculum'
  | 'delete_curriculum'
  | 'save_school_logo';

export interface OfflineMutation {
  id: string;
  type: MutationType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  state: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  pendingCount: number;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

const STORAGE_KEYS = {
  QUEUE: 'deacon_offline_sync_queue_v1',
  LAST_SYNC: 'deacon_last_synced_at_v1',
};

// Listeners set
const listeners = new Set<(status: SyncStatus) => void>();

let isCurrentlySyncing = false;

/**
 * Get current online state
 */
export function getIsOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Read the pending mutation queue from localStorage
 */
export function getPendingQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
}

/**
 * Save pending mutation queue to localStorage
 */
function saveQueue(queue: OfflineMutation[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to save offline queue:', err);
  }
}

/**
 * Enqueue a new mutation to be synced to Firebase
 */
export function enqueueMutation(type: MutationType, payload: any) {
  const queue = getPendingQueue();
  
  // Deduplicate updates for the same entity id if applicable
  let filteredQueue = queue;
  if (payload && payload.id) {
    // If the same entity has a previous save in queue, replace it with latest payload
    if (type.startsWith('save_')) {
      filteredQueue = queue.filter(
        (m) => !(m.type === type && m.payload && m.payload.id === payload.id)
      );
    }
  }

  const mutation: OfflineMutation = {
    id: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  };

  filteredQueue.push(mutation);
  saveQueue(filteredQueue);

  // If online, try processing immediately in background
  if (getIsOnline()) {
    processSyncQueue().catch((err) => console.warn('Background sync trigger:', err));
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  const queue = getPendingQueue();
  const isOnline = getIsOnline();
  const lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);

  let state: SyncStatus['state'] = 'idle';
  if (!isOnline) {
    state = 'offline';
  } else if (isCurrentlySyncing) {
    state = 'syncing';
  } else if (queue.length === 0) {
    state = 'synced';
  } else {
    state = 'idle';
  }

  return {
    isOnline,
    state,
    pendingCount: queue.length,
    lastSyncedAt,
  };
}

/**
 * Notify all subscribers of status changes
 */
function notifyStatusChange(errorMessage?: string) {
  const status = getSyncStatus();
  if (errorMessage) {
    status.errorMessage = errorMessage;
  }
  listeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.warn('Sync status listener error:', e);
    }
  });

  // Also dispatch window custom event for broad UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('deacon_sync_status_changed', { detail: status }));
  }
}

/**
 * Subscribe to sync status changes
 */
export function subscribeToSyncStatus(callback: (status: SyncStatus) => void): () => void {
  listeners.add(callback);
  callback(getSyncStatus());
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Execute a single mutation against Firebase
 */
async function executeMutation(mutation: OfflineMutation): Promise<void> {
  switch (mutation.type) {
    case 'save_student':
      await syncStudentToCloud(mutation.payload);
      break;
    case 'delete_student':
      await deleteStudentFromCloud(mutation.payload);
      break;
    case 'save_servant':
      await syncServantToCloud(mutation.payload);
      break;
    case 'delete_servant':
      await deleteServantFromCloud(mutation.payload);
      break;
    case 'save_liturgy':
      await syncLiturgyAttendanceToCloud(mutation.payload);
      break;
    case 'save_lecture':
      await syncLectureToCloud(mutation.payload);
      break;
    case 'delete_lecture':
      await deleteLectureFromCloud(mutation.payload);
      break;
    case 'save_lecture_attendance':
      await syncLectureAttendanceToCloud(mutation.payload);
      break;
    case 'save_subject_result':
      await syncSubjectResultToCloud(mutation.payload);
      break;
    case 'delete_subject_result':
      await deleteSubjectResultFromCloud(mutation.payload);
      break;
    case 'save_behavior_note':
      await syncBehaviorNoteToCloud(mutation.payload);
      break;
    case 'save_academic_settings':
      await syncAcademicSettingsToCloud(mutation.payload.levels, mutation.payload.years);
      break;
    case 'save_curriculum':
      await syncCurriculumToCloud(mutation.payload);
      break;
    case 'delete_curriculum':
      await deleteCurriculumFromCloud(mutation.payload);
      break;
    case 'save_school_logo':
      await syncSchoolLogoToCloud(mutation.payload);
      break;
    default:
      console.warn('Unknown mutation type:', (mutation as any).type);
  }
}

/**
 * Process the entire pending queue and push to Firebase
 */
export async function processSyncQueue(): Promise<{ processed: number; remaining: number }> {
  if (isCurrentlySyncing) {
    return { processed: 0, remaining: getPendingQueue().length };
  }

  if (!getIsOnline()) {
    notifyStatusChange();
    return { processed: 0, remaining: getPendingQueue().length };
  }

  isCurrentlySyncing = true;
  notifyStatusChange();

  const queue = getPendingQueue();
  if (queue.length === 0) {
    isCurrentlySyncing = false;
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    notifyStatusChange();
    return { processed: 0, remaining: 0 };
  }

  let processedCount = 0;
  const remainingQueue: OfflineMutation[] = [];

  for (const mutation of queue) {
    try {
      await executeMutation(mutation);
      processedCount++;
    } catch (err) {
      console.warn(`Failed to sync mutation ${mutation.type}:`, err);
      mutation.retryCount = (mutation.retryCount || 0) + 1;
      // If it failed fewer than 5 times, keep it in queue to retry later
      if (mutation.retryCount < 5) {
        remainingQueue.push(mutation);
      } else {
        console.error(`Giving up on mutation ${mutation.id} after 5 failed attempts`);
      }
    }
  }

  saveQueue(remainingQueue);

  // If we successfully processed mutations and the queue is clear, record last sync time
  if (remainingQueue.length === 0) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  isCurrentlySyncing = false;
  notifyStatusChange();

  return { processed: processedCount, remaining: remainingQueue.length };
}

/**
 * Trigger full bidirectional synchronization:
 * 1. Push all pending offline mutations to Cloud Firestore
 * 2. Pull remote updates and merge into localStorage
 */
export async function triggerFullSync(onPullComplete?: (data: any) => void): Promise<{ success: boolean; message: string }> {
  if (!getIsOnline()) {
    return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً. سيتم المزامنة تلقائياً عند الاتصال.' };
  }

  try {
    // processSyncQueue owns the syncing lock. Do not set it before calling it,
    // otherwise processSyncQueue sees an active sync and refuses to flush the queue.
    // 1. Flush local queue to cloud
    const { processed } = await processSyncQueue();

    // 2. Fetch fresh state from cloud
    const cloudData = await fetchAllDataFromFirebase();
    if (cloudData && onPullComplete) {
      onPullComplete(cloudData);
    }

    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    isCurrentlySyncing = false;
    notifyStatusChange();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('deacon_data_updated', { detail: { source: 'cloud_sync' } }));
    }

    return {
      success: true,
      message: processed > 0
        ? `تم رفع ${processed} تعديلاً بنجاح ومزامنة أحدث البيانات السحابية!`
        : 'تم التحقق من الاتصال وجميع البيانات متطابقة ومحدثة سحابياً.',
    };
  } catch (err: any) {
    isCurrentlySyncing = false;
    notifyStatusChange(err?.message || 'حدث خطأ أثناء المزامنة');
    return { success: false, message: 'تعذرت المزامنة، سيتم المحاولة مجدداً.' };
  }
}

/**
 * Initialize automatic listeners for online/offline events
 */
export function initOfflineSyncListeners(onDataPulled?: (data: any) => void) {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('Network status: ONLINE. Processing sync queue...');
    notifyStatusChange();
    // Give network 1 second to stabilize, then sync
    setTimeout(() => {
      triggerFullSync(onDataPulled);
    }, 1200);
  };

  const handleOffline = () => {
    console.log('Network status: OFFLINE. Operations will be queued locally.');
    notifyStatusChange();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic check every 30 seconds to catch silent reconnections
  const interval = setInterval(() => {
    if (getIsOnline() && getPendingQueue().length > 0 && !isCurrentlySyncing) {
      processSyncQueue();
    }
  }, 30000);

  // Check on visibility change (when user returns to tab)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && getIsOnline()) {
      if (getPendingQueue().length > 0) {
        processSyncQueue();
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
