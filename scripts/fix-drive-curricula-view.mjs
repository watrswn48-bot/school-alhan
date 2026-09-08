import fs from 'node:fs';

const path = 'src/components/CurriculaModule.tsx';
let s = fs.readFileSync(path, 'utf8');

s = s.replace("import { normalizeDriveUrl, uploadCurriculumFile } from '../services/mediaStorage';", "import { normalizeDriveUrl } from '../services/mediaStorage';");
s = s.replace(/, Download\b/g, '');
s = s.replace(/ const \[formTitle,setFormTitle\]=useState\(''\); const \[selectedFile,setSelectedFile\]=useState<File\|null>\(null\);/, " const [formTitle,setFormTitle]=useState('');");
s = s.replace(/ const handleFileInputChange=.*?;\n const resetForm=/s, ' const resetForm=');
s = s.replace(/const resetForm=\(\)=>\{setFormTitle\(''\);setSelectedFile\(null\);setFormTerm/, "const resetForm=()=>{setFormTitle('');setFormTerm");
s = s.replace(/setFormFileUrl\(''\);setFormFileName\(''\);setFormFileSize\(''\);setFormFileData\(undefined\);/, "setFormFileUrl('');setFormFileName('');setFormFileSize('');setFormFileData(undefined);");
s = s.replace(/let uploadedUrl=normalizeDriveUrl\(formFileUrl\.trim\(\)\)\|\|undefined;if\(selectedFile\)\{.*?\}saveCurriculum/s, "const uploadedUrl=normalizeDriveUrl(formFileUrl.trim());if(!uploadedUrl){setFeedbackMsg({type:'error',text:'أدخل رابط ملف من Google Drive أولاً.'});setIsSubmitting(false);return;}saveCurriculum");
s = s.replace(/fileUrl:uploadedUrl,fileName:formFileName\.trim\(\)\|\|selectedFile\?\.name\|\|undefined,fileSize:formFileSize\.trim\(\)\|\|undefined,fileData:undefined,/, "fileUrl:uploadedUrl,fileName:formFileName.trim()||undefined,fileSize:undefined,fileData:undefined,");
s = s.replace("setFeedbackMsg({type:'success',text:'تم رفع الملف وحفظه في مكتبة المناهج بنجاح.'});", "setFeedbackMsg({type:'success',text:'تم حفظ رابط Google Drive ويمكن فتح المنهج للمشاهدة.'});");
s = s.replace("{isStudentPortal?'استمع وحمّل المواد الخاصة بصفك':'رفع وإدارة المناهج والتسجيلات والمذكرات'}", "{isStudentPortal?'شاهد واستمع إلى المواد الخاصة بصفك':'إضافة وإدارة روابط المناهج والتسجيلات والمذكرات'}");
s = s.replace(/\{item\.fileData&&<a href=\{item\.fileData\} download=\{item\.fileName\|\|item\.title\}[^]*?<\/a>\} /, '');
s = s.replace(/<input type="file" onChange=\{handleFileInputChange\}[^>]*\/>/, '');
s = s.replace(/<input type="url" value=\{formFileUrl\} onChange=\{e=>setFormFileUrl\(e\.target\.value\)\} placeholder="رابط خارجي \(اختياري\)" className="[^"]*"\/>/, '<input required type="url" value={formFileUrl} onChange={e=>setFormFileUrl(e.target.value)} placeholder="رابط Google Drive للمنهج" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"/>');
s = s.replace("<div className=\"grid sm:grid-cols-2 gap-3\"><select value={formMaterialType}", "<div className=\"grid sm:grid-cols-2 gap-3\"><select value={formMaterialType}");
s = s.replace("<button disabled={isSubmitting} className=\"px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs\">{isSubmitting?'جاري الحفظ...':'اعتماد ورفع المنهج'}</button>", "<button disabled={isSubmitting} className=\"px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs\">{isSubmitting?'جاري الحفظ...':'حفظ رابط المنهج'}</button>");
s = s.replace("import { normalizeDriveUrl } from '../services/mediaStorage';", "import { normalizeDriveUrl } from '../services/mediaStorage';");

fs.writeFileSync(path, s);

const storagePath = 'src/services/mediaStorage.ts';
let m = fs.readFileSync(storagePath, 'utf8');
m = m.replace(/return id \? `https:\/\/drive\.google\.com\/uc\?export=download&id=\$\{id\}` : input;/, "return id ? `https://drive.google.com/file/d/${id}/view` : input;");
fs.writeFileSync(storagePath, m);

console.log('Curricula are now Drive-link only and open for viewing instead of downloading.');
