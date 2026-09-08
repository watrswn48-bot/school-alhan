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
).replace(
  'منصة إدارة مدرسة الشماس والأكاديمية',
  'مدرسة تي اتشرومبي للألحان'
));

patchFile('src/components/CurriculaModule.tsx', s => {
  if (!s.includes("import { uploadCurriculumFile } from '../services/mediaStorage';")) {
    s = s.replace(
      "import { sessionHasPermission } from '../services/permissions';",
      "import { sessionHasPermission } from '../services/permissions';\nimport { uploadCurriculumFile } from '../services/mediaStorage';"
    );
  }
  s = s.replace(
    "const [formTitle,setFormTitle]=useState(''); const [formSubject,setFormSubject]=useState('الألحان والتسبيحة');",
    "const [formTitle,setFormTitle]=useState(''); const [selectedFile,setSelectedFile]=useState<File|null>(null); const [formSubject,setFormSubject]=useState('الألحان والتسبيحة');"
  );
  s = s.replace(
    "const handleFileInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setFormFileName(f.name);",
    "const handleFileInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setSelectedFile(f);setFormFileName(f.name);"
  );
  s = s.replace(
    "const resetForm=()=>{setFormTitle('');setFormSubject('الألحان والتسبيحة');",
    "const resetForm=()=>{setFormTitle('');setSelectedFile(null);setFormSubject('الألحان والتسبيحة');"
  );
  s = s.replace(
    "const handleFileInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;setSelectedFile(f);setFormFileName(f.name);const kb=f.size/1024;setFormFileSize(kb>1024?`${(kb/1024).toFixed(1)} MB`:`${Math.round(kb)} KB`);if(f.type.startsWith('audio/')||/\\.(mp3|wav|ogg|m4a)$/i.test(f.name))setFormMaterialType('audio');else if(f.type==='application/pdf'||/\\.pdf$/i.test(f.name))setFormMaterialType('pdf');else if(f.type.startsWith('video/')||/\\.(mp4|webm|mkv)$/i.test(f.name))setFormMaterialType('video');else setFormMaterialType('doc');const r=new FileReader();r.onload=ev=>setFormFileData(ev.target?.result as string);r.readAsDataURL(f);};",
    "const handleFileInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>200*1024*1024){setFeedbackMsg({type:'error',text:'حجم الملف كبير جدًا. الحد الأقصى 200 ميجابايت.'});e.target.value='';return;}setSelectedFile(f);setFormFileName(f.name);const kb=f.size/1024;setFormFileSize(kb>1024?`${(kb/1024).toFixed(1)} MB`:`${Math.round(kb)} KB`);if(f.type.startsWith('audio/')||/\\.(mp3|wav|ogg|m4a)$/i.test(f.name))setFormMaterialType('audio');else if(f.type==='application/pdf'||/\\.pdf$/i.test(f.name))setFormMaterialType('pdf');else if(f.type.startsWith('video/')||/\\.(mp4|webm|mkv)$/i.test(f.name))setFormMaterialType('video');else setFormMaterialType('doc');};"
  );
  const old = "const handleUploadSubmit=(e:React.FormEvent)=>{e.preventDefault();if(!canUpload){setFeedbackMsg({type:'error',text:'ليس لديك صلاحية رفع الملفات.'});return;}if(!formTitle.trim()){setFeedbackMsg({type:'error',text:'يرجى كتابة العنوان'});return;}setIsSubmitting(true);try{saveCurriculum({title:formTitle.trim(),subject:formSubject,levelName:formLevel,yearName:formYear,materialType:formMaterialType,fileUrl:formFileUrl.trim()||undefined,fileName:formFileName.trim()||undefined,fileSize:formFileSize.trim()||undefined,fileData:formFileData||undefined,contentNotes:formNotes.trim()||undefined,uploadedBy:session.fullName||'إدارة المدرسة',uploadedById:session.userId||'admin',createdAt:new Date().toISOString()});refreshList();setIsUploadModalOpen(false);resetForm();setFeedbackMsg({type:'success',text:'تم رفع المنهج ومزامنته بنجاح.'});setTimeout(()=>setFeedbackMsg(null),4000);}catch(err){setFeedbackMsg({type:'error',text:`فشل الحفظ: ${err instanceof Error?err.message:String(err)}`});}finally{setIsSubmitting(false);}};"
  const replacement = "const handleUploadSubmit=async(e:React.FormEvent)=>{e.preventDefault();if(!canUpload){setFeedbackMsg({type:'error',text:'ليس لديك صلاحية رفع الملفات.'});return;}if(!formTitle.trim()){setFeedbackMsg({type:'error',text:'يرجى كتابة العنوان'});return;}if(!selectedFile&&!formFileUrl.trim()){setFeedbackMsg({type:'error',text:'اختر ملفًا أو أدخل رابطًا مباشرًا للمادة.'});return;}setIsSubmitting(true);try{let uploadedUrl=formFileUrl.trim()||undefined;if(selectedFile){setFeedbackMsg({type:'success',text:'جاري رفع الملف إلى التخزين السحابي...'});uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin');}saveCurriculum({title:formTitle.trim(),subject:formSubject,levelName:formLevel,yearName:formYear,materialType:formMaterialType,fileUrl:uploadedUrl,fileName:formFileName.trim()||selectedFile?.name||undefined,fileSize:formFileSize.trim()||undefined,fileData:undefined,contentNotes:formNotes.trim()||undefined,uploadedBy:session.fullName||'إدارة المدرسة',uploadedById:session.userId||'admin',createdAt:new Date().toISOString()});refreshList();setIsUploadModalOpen(false);resetForm();setFeedbackMsg({type:'success',text:'تم رفع الملف وحفظه في مكتبة المناهج بنجاح.'});setTimeout(()=>setFeedbackMsg(null),4000);}catch(err){const message=err instanceof Error?err.message:'خطأ غير معروف';setFeedbackMsg({type:'error',text:`فشل رفع الملف: ${message}`});}finally{setIsSubmitting(false);}};"
  if (s.includes(old)) s = s.replace(old, replacement);
  return s;
});

// Student photo source: Google Drive link/file ID only. Device uploads are intentionally disabled.
patchFile('src/components/AddStudentModule.tsx', s => {
  s = s.replace("import { GraduationCap, UserPlus, CheckCircle2, Upload, Image as ImageIcon, HardDrive } from 'lucide-react';", "import { GraduationCap, UserPlus, CheckCircle2, HardDrive } from 'lucide-react';");
  s = s.replace("import { uploadStudentPhoto } from '../services/mediaStorage';\n", '');
  s = s.replace(",[photoFile,setPhotoFile]", '');
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
  return s;
});

patchFile('src/components/LoginModule.tsx', s => {
  if (!s.includes("import { SiteFooter } from './SiteFooter';")) {
    s = s.replace("import { QRScannerModal } from './QRScannerModal';", "import { QRScannerModal } from './QRScannerModal';\nimport { SiteFooter } from './SiteFooter';");
  }
  s = s.replace(
    'min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-[\'Tajawal\']',
    'min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-[\'Tajawal\']'
  );
  s = s.replace('أكاديمية ومدرسة الشماس المعتمدة', 'مدرسة تي اتشرومبي للألحان');
  s = s.replace('منصة الشماس والأكاديمية', 'مدرسة تي اتشرومبي للألحان');
  s = s.replace('أهلاً بك في نظام المتابعة الرقمي - اختر نوع الدخول للمتابعة', 'أهلاً بك في مدرسة تي اتشرومبي للألحان - اختر نوع الدخول للمتابعة');
  const end = '</div>\n  );\n};';
  if (s.includes(end) && !s.includes('<SiteFooter />')) s = s.replace(end, '</div>\n      <SiteFooter />\n  );\n};');
  return s;
});

patchFile('src/App.tsx', s => {
  if (!s.includes("import { SiteFooter } from './components/SiteFooter';")) {
    s = s.replace("import { SmartIDCardModal } from './components/SmartIDCardModal';", "import { SmartIDCardModal } from './components/SmartIDCardModal';\nimport { SiteFooter } from './components/SiteFooter';");
  }
  s = s.replace('</main></div><SmartIDCardModal', '</main><SiteFooter /></div><SmartIDCardModal');
  s = s.replace('</main></div></div>;', '</main><SiteFooter /></div></div>;');
  return s;
});

console.log('Media upload/title/branding/footer patches applied.');
