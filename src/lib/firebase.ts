import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId
  );
} catch {
  firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db: Firestore = firestoreDb;
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Firebase access is authenticated by the same QR login already used by the app.
// We deliberately do not use Anonymous Auth: this project has Anonymous disabled.
let resolveAuthReady: () => void = () => undefined;
let rejectAuthReady: (error: unknown) => void = () => undefined;
let authReadySettled = false;

export const authReady: Promise<void> = new Promise((resolve, reject) => {
  resolveAuthReady = () => {
    if (!authReadySettled) {
      authReadySettled = true;
      resolve();
    }
  };
  rejectAuthReady = (error) => {
    if (!authReadySettled) {
      authReadySettled = true;
      reject(error);
    }
  };
});

if (auth.currentUser) resolveAuthReady();
else {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      resolveAuthReady();
      unsubscribe();
    }
  });
}

export async function signInToFirebaseWithQr(qrValue: string, kind: 'servant' | 'student'): Promise<void> {
  const clean = qrValue.trim();
  if (!clean) throw new Error('QR Code فارغ');

  const qrSignIn = httpsCallable<{ value: string; kind: 'servant' | 'student' }, { token: string }>(
    functions,
    'qrSignIn'
  );
  const result = await qrSignIn({ value: clean, kind });
  if (!result.data?.token) throw new Error('لم يتم استلام رمز Firebase من خدمة تسجيل QR');

  await signInWithCustomToken(auth, result.data.token);
  resolveAuthReady();
}

export function isFirebaseAuthenticated(): boolean {
  return !!auth.currentUser;
}

export { app };
export default db;
