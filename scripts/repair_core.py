from pathlib import Path
import re

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p,s): Path(p).write_text(s,encoding='utf-8')

# Firebase authentication
p='src/lib/firebase.ts'; s=read(p)
if 'firebase/auth' not in s:
    s=s.replace("import firebaseConfig from '../../firebase-applet-config.json';", "import firebaseConfig from '../../firebase-applet-config.json';\nimport { getAuth, signInAnonymously } from 'firebase/auth';")
    s=s.replace("export const db: Firestore = firestoreDb;", "export const db: Firestore = firestoreDb;\nexport const auth = getAuth(app);\nexport const authReady: Promise<void> = signInAnonymously(auth).then(() => undefined).catch((error) => { console.error('Firebase anonymous authentication failed:', error); throw error; });")
    write(p,s)

# Firebase service authentication and reliable errors
p='src/services/firebaseService.ts'; s=read(p)
if 'authReady' not in s: s=s.replace("import { db } from '../lib/firebase';", "import { db, authReady } from '../lib/firebase';")
names=['syncStudentToCloud','deleteStudentFromCloud','syncServantToCloud','deleteServantFromCloud','syncLiturgyAttendanceToCloud','syncLectureToCloud','deleteLectureFromCloud','syncLectureAttendanceToCloud','syncSubjectResultToCloud','deleteSubjectResultFromCloud','syncBehaviorNoteToCloud','syncAcademicSettingsToCloud','syncCurriculumToCloud','deleteCurriculumFromCloud','syncSchoolLogoToCloud','uploadAllLocalDataToFirebase','fetchAllDataFromFirebase']
for name in names:
    s=re.sub(r'(export async function '+re.escape(name)+r'\([^\{]*\{)', r'\1\n  await authReady;', s, count=1)
if 'syncChantSubjectToCloud' not in s:
    marker='// -------------------------------------------------------------\n// BULK CLOUD SYNC & PULL HELPERS\n// -------------------------------------------------------------'
    insert="""export async function syncChantSubjectToCloud(subject: { id: string }): Promise<void> {\n  await authReady;\n  await setDoc(doc(db, 'chantSubjects', subject.id), sanitizeForFirestore(subject), { merge: true });\n}\nexport async function deleteChantSubjectFromCloud(id: string): Promise<void> {\n  await authReady;\n  await deleteDoc(doc(db, 'chantSubjects', id));\n}\n\n"""
    s=s.replace(marker,insert+marker)
s=re.sub(r"(console\.warn\('Firebase [^']+ error:', error\);\n)  \}", r"\1    throw error;\n  }", s)
write(p,s)

# Firestore rules now match the anonymous authenticated client.
write('firestore.rules', "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} { allow read, write: if request.auth != null; }\n  }\n}\n")

# Queue: subjects + never discard failed writes.
p='src/services/syncQueue.ts'; s=read(p)
s=s.replace('  syncSchoolLogoToCloud,','  syncSchoolLogoToCloud,\n  syncChantSubjectToCloud,\n  deleteChantSubjectFromCloud,')
s=s.replace("  | 'save_school_logo';", "  | 'save_school_logo'\n  | 'save_chant_subject'\n  | 'delete_chant_subject';")
s=s.replace("    case 'save_school_logo':\n      await syncSchoolLogoToCloud(mutation.payload);\n      break;", "    case 'save_school_logo':\n      await syncSchoolLogoToCloud(mutation.payload);\n      break;\n    case 'save_chant_subject':\n      await syncChantSubjectToCloud(mutation.payload);\n      break;\n    case 'delete_chant_subject':\n      await deleteChantSubjectFromCloud(mutation.payload);\n      break;")
s=re.sub(r"\s*// If it failed fewer than 5 times, keep it in queue to retry later\s*if \(mutation\.retryCount < 5\) \{\s*remainingQueue\.push\(mutation\);\s*\} else \{\s*console\.error\(`Giving up on mutation \$\{mutation\.id\} after 5 failed attempts`\);\s*\}", "\n      remainingQueue.push(mutation);", s)
write(p,s)

# Subject writes and Friday attendance use the queue.
p='src/services/schoolSystem.ts'; s=read(p)
if 'enqueueMutation' not in s: s=s.replace("import { egyptDateString, isEgyptFriday } from './egyptTime';", "import { egyptDateString, isEgyptFriday } from './egyptTime';\nimport { enqueueMutation } from './syncQueue';")
s=s.replace("try{await setDoc(doc(db,'chantSubjects',item.id),item,{merge:true});}catch{}return item;", "enqueueMutation('save_chant_subject', item); return item;")
s=s.replace("try{await deleteDoc(doc(db,'chantSubjects',id));}catch{}", "enqueueMutation('delete_chant_subject', id);")
s=s.replace("localStorage.setItem('deacon_system_liturgies_v1',JSON.stringify([...getLiturgyAttendances().filter(r=>!(r.studentId===student.id&&r.dateStr===dateStr)),record]));window.dispatchEvent", "localStorage.setItem('deacon_system_liturgies_v1',JSON.stringify([...getLiturgyAttendances().filter(r=>!(r.studentId===student.id&&r.dateStr===dateStr)),record]));enqueueMutation('save_liturgy', record);window.dispatchEvent")
write(p,s)

# Keep old lectures; do not delete records merely because schoolClass is absent.
p='src/components/LectureSystemModule.tsx'; s=read(p)
s=re.sub(r"\n  // Remove legacy lectures created before the class field was mandatory\..*?\n  \},\[\]\);\n",'\n',s,flags=re.S,count=1)
s=s.replace("lectures.filter(l => l.schoolClass && SCHOOL_CLASSES.includes(normalizeSchoolClass(l.schoolClass))", "lectures.filter(l => (!l.schoolClass || SCHOOL_CLASSES.includes(normalizeSchoolClass(l.schoolClass)))")
write(p,s)

# Exactly three servant roles in UI and normalization.
p='src/services/permissions.ts'; s=read(p)
s=s.replace("if ((role as string) === 'family_admin' || role === 'senior_servant')", "if ((role as string) === 'family_admin' || (role as string) === 'servant' || role === 'senior_servant')")
write(p,s)

p='src/components/AdminPanelModule.tsx'; s=read(p)
s=s.replace('<div className="grid grid-cols-1 md:grid-cols-4 gap-3">','<div className="grid grid-cols-1 md:grid-cols-3 gap-3">')
s=re.sub(r'\n        <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5"><b className="text-sky-400">أمين الأسرة</b>.*?</div>', '', s, flags=re.S, count=1)
s=s.replace('<option value="family_admin">أمين الأسرة — حضور + ملفات + تقييمات</option>','')
write(p,s)

# Normalize legacy servant roles and duplicate secret codes once at startup.
write('src/services/dataMigrations.ts', """import { getServants, saveServant } from './storage';\nexport function runDataMigrations(): void {\n  try {\n    const servants=getServants(); const seen=new Set<string>();\n    for(const servant of servants){\n      const raw=servant.role as string;\n      const role=raw==='admin'?'admin':(raw==='family_admin'||raw==='senior_servant')?'senior_servant':'junior_servant';\n      let code=servant.secretCode||'';\n      if(code&&seen.has(code)){do{code=String(Math.floor(100000+Math.random()*900000));}while(seen.has(code));}\n      seen.add(code);\n      if(role!==raw||code!==servant.secretCode)saveServant({...servant,role:role as any,secretCode:code});\n    }\n  }catch(error){console.warn('Data migration skipped:',error);}\n}\n""")
p='src/main.tsx'; s=read(p)
if 'dataMigrations' not in s:
    s=s.replace("import './services/autoSyncBootstrap';", "import './services/autoSyncBootstrap';\nimport { runDataMigrations } from './services/dataMigrations';\nrunDataMigrations();")
write(p,s)

# Remove accidental repeated priest migration calls.
p='src/services/storage.ts'; s=read(p); s=re.sub(r'(  migratePriestName\(\);\n){2,}','  migratePriestName();\n',s); write(p,s)
