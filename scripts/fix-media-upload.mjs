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
  'منصة مدرسة تي اتشرومبي للألحان ومدرسة الشمامسة'
));

patchFile('src/components/CurriculaModule.tsx', s => {
  s = s.replace(
    "import { sessionHasPermission } from '../services/permissions';",
    "import { sessionHasPermission } from '../services/permissions';\nimport { uploadCurriculumFile } from '../services/mediaStorage';"
  );
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
  const old = "const handleUploadSubmit=(e:React.FormEvent)=>{e.preventDefault();if(!canUpload){setFeedbackMsg({type:'error',text:'ليس لديك صلاحية رفع الملفات.'});return;}if(!formTitle.trim()){setFeedbackMsg({type:'error',text:'يرجى كتابة العنوان'});return;}setIsSubmitting(true);try{saveCurriculum({title:formTitle.trim(),subject:formSubject,levelName:formLevel,yearName:formYear,materialType:formMaterialType,fileUrl:formFileUrl.trim()||undefined,fileName:formFileName.trim()||undefined,fileSize:formFileSize.trim()||undefined,fileData:formFileData||undefined,contentNotes:formNotes.trim()||undefined,uploadedBy:session.fullName||'إدارة المدرسة',uploadedById:session.userId||'admin',createdAt:new Date().toISOString()});refreshList();setIsUploadModalOpen(false);resetForm();setFeedbackMsg({type:'success',text:'تم رفع المنهج ومزامنته بنجاح.'});setTimeout(()=>setFeedbackMsg(null),4000);}catch(err){setFeedbackMsg({type:'error',text:`فشل الحفظ: ${err instanceof Error?err.message:String(err)}`});}finally{setIsSubmitting(false);}};"
  const replacement = "const handleUploadSubmit=async(e:React.FormEvent)=>{e.preventDefault();if(!canUpload){setFeedbackMsg({type:'error',text:'ليس لديك صلاحية رفع الملفات.'});return;}if(!formTitle.trim()){setFeedbackMsg({type:'error',text:'يرجى كتابة العنوان'});return;}setIsSubmitting(true);try{let uploadedUrl=formFileUrl.trim()||undefined;if(selectedFile){setFeedbackMsg({type:'success',text:'جاري رفع الملف إلى التخزين السحابي...'});uploadedUrl=await uploadCurriculumFile(selectedFile,session.userId||'admin');}saveCurriculum({title:formTitle.trim(),subject:formSubject,levelName:formLevel,yearName:formYear,materialType:formMaterialType,fileUrl:uploadedUrl,fileName:formFileName.trim()||selectedFile?.name||undefined,fileSize:formFileSize.trim()||undefined,fileData:undefined,contentNotes:formNotes.trim()||undefined,uploadedBy:session.fullName||'إدارة المدرسة',uploadedById:session.userId||'admin',createdAt:new Date().toISOString()});refreshList();setIsUploadModalOpen(false);resetForm();setFeedbackMsg({type:'success',text:'تم رفع الملف وحفظه في مكتبة المناهج بنجاح.'});setTimeout(()=>setFeedbackMsg(null),4000);}catch(err){setFeedbackMsg({type:'error',text:`فشل رفع الملف: ${err instanceof Error?err.message:'تأكد من اتصال الإنترنت وإعداد Firebase Storage.'}`});}finally{setIsSubmitting(false);}};"
  if (s.includes(old)) s = s.replace(old, replacement);
  return s;
});

console.log('Media upload/title patches applied.');
