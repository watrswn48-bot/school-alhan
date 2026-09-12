import { initOfflineSyncListeners, triggerFullSync, getIsOnline, getPendingQueue } from './syncQueue';

let cleanup: (() => void) | undefined;

if (typeof window !== 'undefined') {
  cleanup = initOfflineSyncListeners();

  const syncNow = () => {
    if (getIsOnline() && getPendingQueue().length > 0) {
      triggerFullSync().catch(() => undefined);
    }
  };

  window.addEventListener('online', syncNow);

  // Flush any queued changes immediately when the app starts online.
  syncNow();

  window.addEventListener('beforeunload', () => {
    window.removeEventListener('online', syncNow);
    cleanup?.();
  }, { once: true });
}
