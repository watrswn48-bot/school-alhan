import { signInToFirebaseWithQr } from '../lib/firebase';

const SESSION_KEY = 'deacon_system_session_v1';
let lastAttemptKey = '';
let timer: number | undefined;

function readSession(): { isLoggedIn?: boolean; mode?: 'servant' | 'student'; userId?: string; studentCode?: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function syncFirebaseAuthFromQrSession() {
  const session = readSession();
  if (!session?.isLoggedIn) return;

  const kind = session.mode === 'student' ? 'student' : 'servant';
  const value = kind === 'student' ? session.studentCode || session.userId : session.userId;
  if (!value) return;

  const attemptKey = `${kind}:${value}`;
  if (attemptKey === lastAttemptKey) return;
  lastAttemptKey = attemptKey;

  try {
    await signInToFirebaseWithQr(value, kind);
    window.dispatchEvent(new CustomEvent('deacon_sync_status_changed'));
  } catch (error) {
    // The QR login remains available offline. Pending mutations stay queued and
    // will retry after the QR Firebase auth function is deployed/available.
    console.warn('QR Firebase authentication is not available yet:', error);
  }
}

export function initQrFirebaseBootstrap() {
  if (typeof window === 'undefined') return;
  void syncFirebaseAuthFromQrSession();
  timer = window.setInterval(() => void syncFirebaseAuthFromQrSession(), 1500);
  window.addEventListener('storage', () => void syncFirebaseAuthFromQrSession());
}

initQrFirebaseBootstrap();
