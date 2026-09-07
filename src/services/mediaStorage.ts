import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../lib/firebase';

const storage = getStorage(app);

export async function uploadCurriculumFile(file: File, uploaderId = 'admin'): Promise<string> {
  const safeName = file.name.replace(/[^\w\u0600-\u06FF.()-]+/g, '_');
  const path = `curricula/${uploaderId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: { originalName: file.name },
  });
  return getDownloadURL(snapshot.ref);
}
