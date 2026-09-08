import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after);
}

// Student photos are now URL/Google Drive only. Keep existing stored photo URLs intact.
patchFile('src/components/AddStudentModule.tsx', s => {
  s = s.replace("import { GraduationCap, UserPlus, CheckCircle2, Upload, Image as ImageIcon, HardDrive } from 'lucide-react';", "import { GraduationCap, UserPlus, CheckCircle2, HardDrive } from 'lucide-react';");
  s = s.replace("import { uploadStudentPhoto } from '../services/mediaStorage';\n", '');
  s = s.replace(", [photoFile,setPhotoFile]", '');
  s = s.replace(",[photoPreview,setPhotoPreview]", '');
  s = s.replace(",[uploading,setUploading]", '');
  s = s.replace(",[uploadProgress,setUploadProgress]", '');

  const oldHandle = " const handlePhoto=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){setError('من فضلك اختر ملف صورة فقط.');e.target.value='';return;}if(file.size>12*1024*1024){setError('حجم الصورة الأصلية يجب ألا يتجاوز 12 ميجابايت.');e.target.value='';return;}setError('');setPhotoFile(file);const reader=new FileReader();reader.onload=ev=>setPhotoPreview(String(ev.target?.result||''));reader.readAsDataURL(file);};\n";
  s = s.replace(oldHandle, '');

  s = s.replace("if(!photoFile&&!form.photoUrl.trim()){setError('الصورة الشخصية إجبارية: اختر صورة من الجهاز أو أدخل رابط صورة أو كود Google Drive.');return;}setUploading(true);setUploadProgress(0);try{", "if(!form.photoUrl.trim()){setError('الصورة الشخصية إجبارية: أدخل رابط صورة أو كود Google Drive.');return;}try{");
  s = s.replace("let photoUrl=normalizePhotoSource(form.photoUrl);const draftCode=`STU-${Date.now()}`;if(photoFile){photoUrl=await uploadStudentPhoto(photoFile,draftCode,setUploadProgress);}if(!photoUrl){", "let photoUrl=normalizePhotoSource(form.photoUrl);if(!photoUrl){");
  s = s.replace("setForm(makeForm());setPhotoFile(null);setPhotoPreview('');}catch(err){setError(err instanceof Error?err.message:'تعذر حفظ الطالب أو رفع الصورة.');}finally{setUploading(false);}};", "setForm(makeForm());}catch(err){setError(err instanceof Error?err.message:'تعذر حفظ الطالب.');}};");

  const photoBlockStart = '<div className="sm:col-span-2"><label className="label">الصورة الشخصية:';
  const photoBlockEnd = '<div><label className="label">الرتبة الشماسية:';
  const start = s.indexOf(photoBlockStart);
  const end = s.indexOf(photoBlockEnd, start);
  if (start >= 0 && end > start) {
    const photoBlock = `<div className="sm:col-span-2"><label className="label">الصورة الشخصية: <span className="req">*</span></label><div className="relative"><HardDrive className="absolute right-3 top-2.5 w-4 h-4 text-slate-500"/><input required type="text" value={form.photoUrl} onChange={e=>set('photoUrl',e.target.value)} placeholder="رابط صورة مباشر أو كود Google Drive" className="field pr-9"/><p className="text-[10px] text-slate-500 mt-1">الصورة من خلال رابط فقط. لو الصورة على Google Drive: اجعل الملف متاحًا لمن لديه الرابط، ثم ضع رابط المشاركة أو كود الملف هنا.</p></div>{form.photoUrl&&<img src={normalizePhotoSource(form.photoUrl)} alt="معاينة الصورة" className="mt-2 w-16 h-16 rounded-2xl object-cover ring-1 ring-amber-500/40"/>}</div>\n `;
    s = s.slice(0, start) + photoBlock + s.slice(end);
  }
  s = s.replace("disabled={uploading}", "");
  s = s.replace("{uploading?<><ImageIcon className=\"w-4 h-4 animate-pulse\"/>جاري رفع الصورة {uploadProgress}%...</>:<><UserPlus", "<><UserPlus");
  return s;
});

// Remove the school logo badge from the student profile to save space.
patchFile('src/components/CumulativeProfileModal.tsx', s => {
  const start = s.indexOf('            {/* School Logo Badge */}');
  const end = s.indexOf('            {/* Photo & QR Code */}', start);
  if (start >= 0 && end > start) s = s.slice(0, start) + s.slice(end);

  // On the student account, keep only Logout. The close X remains available to servants/admins.
  s = s.replace("          <button\n            onClick={onClose}\n            className=\"absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-2xl transition-colors no-print z-20\"\n          >\n            <X className=\"w-6 h-6\" />\n          </button>", "          {session.mode !== 'student' && (\n            <button\n              onClick={onClose}\n              className=\"absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-2xl transition-colors no-print z-20\"\n            >\n              <X className=\"w-6 h-6\" />\n            </button>\n          )}");

  // Make the profile header adapt cleanly on phones after removing the logo column.
  s = s.replace('max-w-5xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh]', 'max-w-5xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh]');
  s = s.replace('className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10"', 'className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10"');
  return s;
});

console.log('Student profile cleanup patch applied.');
