import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after === before) console.log(`No change: ${path}`);
  else { fs.writeFileSync(path, after); console.log(`Patched: ${path}`); }
}

patchFile('index.html', s => s.replace(
  '<title>Deacon School & Academy Management System - نظام إدارة مدرسة الشمامسة</title>',
  '<title>مدرسة تي اتشرومبي للألحان</title>'
).replace('منصة إدارة مدرسة الشماس والأكاديمية','مدرسة تي اتشرومبي للألحان'));

patchFile('src/components/CurriculaModule.tsx', s => {
  s = s.replace(/import \{ normalizeDriveUrl, uploadCurriculumFile \} from '..\/services\/mediaStorage';\n(?:import \{ normalizeDriveUrl, uploadCurriculumFile \} from '..\/services\/mediaStorage';\n)+/g, "import { normalizeDriveUrl, uploadCurriculumFile } from '../services/mediaStorage';\n");
  s = s.replace(/import \{ uploadCurriculumFile \} from '..\/services\/mediaStorage';\n/g, "import { normalizeDriveUrl, uploadCurriculumFile } from '../services/mediaStorage';\n");
  return s;
});

patchFile('src/components/AddStudentModule.tsx', s => {
  s = s.replace(/import \{ GraduationCap, UserPlus, CheckCircle2,[^\n]+\} from 'lucide-react';/, "import { GraduationCap, UserPlus, CheckCircle2, HardDrive } from 'lucide-react';");
  s = s.replace(/import \{ uploadStudentPhoto \} from '..\/services\/mediaStorage';\n/g, '');
  s = s.replace(/\n\s*const \[photoFile,setPhotoFile\][^;]+;\n\s*const \[photoPreview,setPhotoPreview\][^;]+;\n\s*const \[uploading,setUploading\][^;]+;\n\s*const \[uploadProgress,setUploadProgress\][^;]+;/g, '');
  s = s.replace(/\n\s*const handlePhoto=.*?\n(?= const submit=)/s, '\n');
  s = s.replace(/if\(!form\.photoUrl\.trim\(\)\)\{setError\([^}]+\);return;\}setUploading\(true\);setUploadProgress\(0\);try\{/g, "if(!form.photoUrl.trim()){setError('الصورة الشخصية إجبارية: أدخل رابط صورة أو كود Google Drive.');return;}try{");
  s = s.replace(/let photoUrl=normalizePhotoSource\(form\.photoUrl\);const draftCode=`STU-\$\{Date\.now\(\)\}`;if\(photoFile\)\{photoUrl=await uploadStudentPhoto\(photoFile,draftCode,setUploadProgress\);\}if\(!photoUrl\)\{/g, "let photoUrl=normalizePhotoSource(form.photoUrl);if(!photoUrl){");
  s = s.replace(/setForm\(makeForm\(\)\);setPhotoFile\(null\);setPhotoPreview\('\'\);\}catch\(err\)\{setError\(err instanceof Error\?err\.message:'تعذر حفظ الطالب أو رفع الصورة\.'\);\}finally\{setUploading\(false\);\}\};/g, "setForm(makeForm());}catch(err){setError(err instanceof Error?err.message:'تعذر حفظ الطالب.');}};");
  const photoStart = s.indexOf('<div className="sm:col-span-2"><label className="label">الصورة الشخصية:');
  const rankStart = s.indexOf('<div><label className="label">الرتبة الشماسية:', photoStart);
  if (photoStart >= 0 && rankStart > photoStart) {
    const block = `<div className="sm:col-span-2"><label className="label">الصورة الشخصية: <span className="req">*</span></label><div className="relative"><HardDrive className="absolute right-3 top-2.5 w-4 h-4 text-slate-500"/><input required type="text" value={form.photoUrl} onChange={e=>set('photoUrl',e.target.value)} placeholder="رابط صورة مباشر أو كود Google Drive" className="field pr-9"/><p className="text-[10px] text-slate-500 mt-1">الصورة من خلال رابط فقط. لو الصورة على Google Drive: اجعل الملف متاحًا لمن لديه الرابط، ثم ضع رابط المشاركة أو كود الملف هنا.</p></div>{form.photoUrl&&<img src={normalizePhotoSource(form.photoUrl)} alt="معاينة الصورة" className="mt-2 w-16 h-16 rounded-2xl object-cover ring-1 ring-amber-500/40"/>}</div>\n `;
    s = s.slice(0, photoStart) + block + s.slice(rankStart);
  }
  s = s.replace(/\n\s*\{uploading&&<div className="mt-2 space-y-1">[\s\S]*?<\/div>\}\}\n(?=<div><label className="label">الرتبة الشماسية:)/, '\n');
  s = s.replace(/<button disabled=\{uploading\} type="submit"[^>]*>\{uploading\?[\s\S]*?:<><UserPlus/, '<button type="submit" className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md flex items-center gap-2"><UserPlus');
  s = s.replace(/\}\}<\/button>/g, '}</button>');
  return s;
});

patchFile('src/components/LoginModule.tsx', s => {
  if (!s.includes("import { SiteFooter } from './SiteFooter';")) s = s.replace("import { QRScannerModal } from './QRScannerModal';", "import { QRScannerModal } from './QRScannerModal';\nimport { SiteFooter } from './SiteFooter';");
  s = s.replace('min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden', 'min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden');
  s = s.replace('أكاديمية ومدرسة الشماس المعتمدة','مدرسة تي اتشرومبي للألحان').replace('منصة الشماس والأكاديمية','مدرسة تي اتشرومبي للألحان').replace('أهلاً بك في نظام المتابعة الرقمي - اختر نوع الدخول للمتابعة','أهلاً بك في مدرسة تي اتشرومبي للألحان - اختر نوع الدخول للمتابعة');
  return s;
});

patchFile('src/App.tsx', s => {
  if (!s.includes("import { SiteFooter } from './components/SiteFooter';")) s = s.replace("import { SmartIDCardModal } from './components/SmartIDCardModal';", "import { SmartIDCardModal } from './components/SmartIDCardModal';\nimport { SiteFooter } from './components/SiteFooter';");
  s = s.replace('</main></div><SmartIDCardModal', '</main><SiteFooter /></div><SmartIDCardModal').replace('</main></div></div>;', '</main><SiteFooter /></div></div>;');
  return s;
});

console.log('Media upload/title/branding/footer patches applied.');
