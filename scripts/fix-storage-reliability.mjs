import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after);
}

patchFile('src/services/mediaStorage.ts', s => {
  s = s.replace("import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';", "import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';");
  const start = s.indexOf('export async function uploadCurriculumFile(');
  const end = s.indexOf('\nasync function compressStudentPhoto', start);
  if (start >= 0 && end > start) {
    const fn = `export async function uploadCurriculumFile(\n  file: File,\n  uploaderId = 'admin',\n  onProgress?: (percent: number) => void,\n): Promise<string> {\n  if (file.size > 200 * 1024 * 1024) throw new Error('حجم الملف كبير جدًا. الحد الأقصى 200 ميجابايت.');\n  const safeName = safeFileName(file.name);\n  const path = \\`curricula/\\${uploaderId}/\\${Date.now()}-\\${safeName}\\`;\n  const storageRef = ref(storage, path);\n  const task = uploadBytesResumable(storageRef, file, {\n    contentType: file.type || 'application/octet-stream',\n    customMetadata: { originalName: file.name },\n  });\n  onProgress?.(0);\n  return await new Promise<string>((resolve, reject) => {\n    let finished = false;\n    const timeout = window.setTimeout(() => {\n      if (finished) return;\n      finished = true;\n      task.cancel();\n      reject(new Error('رفع المنهج استغرق أكثر من 60 ثانية. تأكد من الإنترنت وإعدادات Firebase Storage ثم حاول مرة أخرى.'));\n    }, 60000);\n    task.on('state_changed', snapshot => {\n      onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));\n    }, error => {\n      if (finished) return;\n      finished = true;\n      window.clearTimeout(timeout);\n      const code = String((error as { code?: string }).code || '');\n      if (code.includes('storage/unauthorized')) reject(new Error('Firebase Storage رفض رفع المنهج. راجع صلاحيات Storage.'));\n      else if (code.includes('storage/canceled')) reject(new Error('تم إلغاء رفع المنهج.'));\n      else if (code.includes('storage/quota-exceeded')) reject(new Error('مساحة Firebase Storage غير كافية حاليًا.'));\n      else if (code.includes('storage/retry-limit-exceeded')) reject(new Error('انقطع الاتصال أثناء رفع المنهج. حاول مرة أخرى.'));\n      else reject(new Error(\\`تعذر رفع المنهج (\\${code || 'خطأ غير معروف'}).\\`));\n    }, async () => {\n      if (finished) return;\n      finished = true;\n      window.clearTimeout(timeout);\n      try {\n        const url = await getDownloadURL(task.snapshot.ref);\n        onProgress?.(100);\n        resolve(url);\n      } catch {\n        reject(new Error('تم رفع المنهج لكن تعذر الحصول على رابطه. راجع صلاحيات Firebase Storage.'));\n      }\n    });\n  });\n}\n\nexport function normalizeDriveUrl(value: string): string {\n  const input = value.trim();\n  if (!input) return '';\n  const id = input.match(/(?:drive\\.google\\.com\\/file\\/d\\/|drive\\.google\\.com\\/open\\?id=|drive\\.google\\.com\\/uc\\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]+)/)?.[1] || (input.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(input) ? input : '');\n  return id ? \\`https://drive.google.com/uc?export=download&id=\\${id}\\` : input;\n}\n`;
    s = s.slice(0, start) + fn + s.slice(end);
  }
  return s;
});

patchFile('src/components/CurriculaModule.tsx', s => {
  if (!s.includes("normalizeDriveUrl")) {
    s = s.replace("import { uploadCurriculumFile } from '../services/mediaStorage';", "import { normalizeDriveUrl, uploadCurriculumFile } from '../services/mediaStorage';");
  }
  s = s.replace("uploadedUrl=formFileUrl.trim()||undefined;", "uploadedUrl=normalizeDriveUrl(formFileUrl.trim())||undefined;");
  s = s.replace("uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin');", "uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin',p=>setFeedbackMsg({type:'success',text:`جاري رفع المنهج... ${p}%`}));");
  return s;
});

console.log('Storage reliability patch applied.');
