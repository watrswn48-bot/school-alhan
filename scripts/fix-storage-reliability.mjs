import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after);
}

patchFile('src/services/mediaStorage.ts', s => {
  s = s.replace(
    "import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';",
    "import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';",
  );
  const start = s.indexOf('export async function uploadCurriculumFile(');
  const end = s.indexOf('\nasync function compressStudentPhoto', start);
  if (start >= 0 && end > start) {
    const fn = [
      "export async function uploadCurriculumFile(",
      "  file: File,",
      "  uploaderId = 'admin',",
      "  onProgress?: (percent: number) => void,",
      "): Promise<string> {",
      "  if (file.size > 200 * 1024 * 1024) throw new Error('حجم الملف كبير جدًا. الحد الأقصى 200 ميجابايت.');",
      "  const safeName = safeFileName(file.name);",
      "  const path = `curricula/${uploaderId}/${Date.now()}-${safeName}`;",
      "  const storageRef = ref(storage, path);",
      "  const task = uploadBytesResumable(storageRef, file, {",
      "    contentType: file.type || 'application/octet-stream',",
      "    customMetadata: { originalName: file.name },",
      "  });",
      "  onProgress?.(0);",
      "  return await new Promise<string>((resolve, reject) => {",
      "    let finished = false;",
      "    const timeout = window.setTimeout(() => {",
      "      if (finished) return;",
      "      finished = true;",
      "      task.cancel();",
      "      reject(new Error('رفع المنهج استغرق أكثر من 60 ثانية. تأكد من الإنترنت وإعدادات Firebase Storage ثم حاول مرة أخرى.'));",
      "    }, 60000);",
      "    task.on('state_changed', snapshot => {",
      "      onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));",
      "    }, error => {",
      "      if (finished) return;",
      "      finished = true;",
      "      window.clearTimeout(timeout);",
      "      const code = String((error as { code?: string }).code || '');",
      "      if (code.includes('storage/unauthorized')) reject(new Error('Firebase Storage رفض رفع المنهج. راجع صلاحيات Storage.'));",
      "      else if (code.includes('storage/canceled')) reject(new Error('تم إلغاء رفع المنهج.'));",
      "      else if (code.includes('storage/quota-exceeded')) reject(new Error('مساحة Firebase Storage غير كافية حاليًا.'));",
      "      else if (code.includes('storage/retry-limit-exceeded')) reject(new Error('انقطع الاتصال أثناء رفع المنهج. حاول مرة أخرى.'));",
      "      else reject(new Error(`تعذر رفع المنهج (${code || 'خطأ غير معروف'}).`));",
      "    }, async () => {",
      "      if (finished) return;",
      "      finished = true;",
      "      window.clearTimeout(timeout);",
      "      try {",
      "        const url = await getDownloadURL(task.snapshot.ref);",
      "        onProgress?.(100);",
      "        resolve(url);",
      "      } catch {",
      "        reject(new Error('تم رفع المنهج لكن تعذر الحصول على رابطه. راجع صلاحيات Firebase Storage.'));",
      "      }",
      "    });",
      "  });",
      "}",
      "",
      "export function normalizeDriveUrl(value: string): string {",
      "  const input = value.trim();",
      "  if (!input) return '';",
      "  const id = input.match(/(?:drive\\.google\\.com\\/file\\/d\\/|drive\\.google\\.com\\/open\\?id=|drive\\.google\\.com\\/uc\\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]+)/)?.[1] || (input.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(input) ? input : '');",
      "  return id ? `https://drive.google.com/uc?export=download&id=${id}` : input;",
      "}",
    ].join('\n') + '\n';
    s = s.slice(0, start) + fn + s.slice(end);
  }
  return s;
});

patchFile('src/components/CurriculaModule.tsx', s => {
  if (!s.includes('normalizeDriveUrl')) {
    s = s.replace(
      "import { uploadCurriculumFile } from '../services/mediaStorage';",
      "import { normalizeDriveUrl, uploadCurriculumFile } from '../services/mediaStorage';",
    );
  }
  s = s.replace(
    "uploadedUrl=formFileUrl.trim()||undefined;",
    "uploadedUrl=normalizeDriveUrl(formFileUrl.trim())||undefined;",
  );
  s = s.replace(
    "uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin');",
    "uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin',p=>setFeedbackMsg({type:'success',text:`جاري رفع المنهج... ${p}%`}));",
  );
  return s;
});

console.log('Storage reliability patch applied.');
