import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
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

async function compressStudentPhoto(file: File): Promise<File> {
  const maxInputBytes = 12 * 1024 * 1024;
  if (file.size > maxInputBytes) {
    throw new Error('حجم الصورة الأصلية كبير جدًا. اختر صورة أقل من 12 ميجابايت.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر تجهيز الصورة للرفع.');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const toBlob = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('تعذر ضغط الصورة.')), 'image/jpeg', quality);
    });

    let quality = 0.82;
    let blob = await toBlob(quality);
    while (blob.size > 1200 * 1024 && quality > 0.5) {
      quality -= 0.08;
      blob = await toBlob(quality);
    }

    return new File([blob], `${safeFileName(file.name.replace(/\.[^.]+$/, '') || 'student-photo')}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function uploadStudentPhoto(
  file: File,
  studentCode: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('يجب اختيار ملف صورة.');

  const compressedFile = await compressStudentPhoto(file);
  const safeName = safeFileName(compressedFile.name || 'student-photo.jpg');
  const path = `student-photos/${studentCode}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, compressedFile, {
    contentType: 'image/jpeg',
    customMetadata: { originalName: file.name, studentCode },
  });

  onProgress?.(0);

  return await new Promise<string>((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      task.cancel();
      reject(new Error('رفع الصورة استغرق وقتًا أطول من اللازم. تأكد من الإنترنت وإعدادات Firebase Storage ثم حاول مرة أخرى.'));
    }, 45000);

    task.on('state_changed',
      snapshot => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      error => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        const code = String((error as { code?: string }).code || '');
        if (code.includes('storage/unauthorized')) reject(new Error('Firebase Storage رفض رفع الصورة. راجع صلاحيات Storage.'));
        else if (code.includes('storage/canceled')) reject(new Error('تم إلغاء رفع الصورة.'));
        else if (code.includes('storage/quota-exceeded')) reject(new Error('مساحة Firebase Storage غير كافية حاليًا.'));
        else if (code.includes('storage/retry-limit-exceeded')) reject(new Error('انقطع الاتصال أثناء رفع الصورة. حاول مرة أخرى.'));
        else reject(new Error(`تعذر رفع الصورة (${code || 'خطأ غير معروف'}).`));
      },
      async () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.(100);
          resolve(url);
        } catch {
          reject(new Error('تم رفع الصورة لكن تعذر الحصول على رابطها. راجع صلاحيات Firebase Storage.'));
        }
      },
    );
  });
}
