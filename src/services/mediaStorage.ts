import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../lib/firebase';

const storage = getStorage(app);

function safeFileName(name: string): string {
  return name.replace(/[^\w\u0600-\u06FF.()-]+/g, '_');
}

export async function uploadCurriculumFile(file: File, uploaderId = 'admin'): Promise<string> {
  const safeName = safeFileName(file.name);
  const path = `curricula/${uploaderId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: { originalName: file.name },
  });
  return getDownloadURL(snapshot.ref);
}

export async function uploadStudentPhoto(file: File, studentCode: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('يجب اختيار ملف صورة.');
  if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
  const safeName = safeFileName(file.name || 'student-photo.jpg');
  const path = `student-photos/${studentCode}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name, studentCode },
  });
  return getDownloadURL(snapshot.ref);
}
