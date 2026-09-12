import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
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
  // Let Firestore choose the fastest available transport. The previous forced
  // long-polling transport made realtime updates noticeably slow.
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
export const authReady: Promise<void> = signInAnonymously(auth)
  .then(() => undefined)
  .catch((error) => {
    console.error('Firebase anonymous authentication failed:', error);
    throw error;
  });

export { app };
export default db;
