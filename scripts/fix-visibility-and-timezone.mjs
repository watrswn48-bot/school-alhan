import fs from 'node:fs';

const path = 'src/App.tsx';
let s = fs.readFileSync(path, 'utf8');

s = s.replace("  const canSubjects=isAdministrator||sessionHasPermission(session,'canManageSubjects');\n  const lectureNotifications=lecturesNeedingEvaluation(getLectures(),session.userId,isAdministrator);", "  const canSubjects=isAdministrator||sessionHasPermission(session,'canManageSubjects');\n  const canLectures=isAdministrator||sessionHasPermission(session,'canManageLectures')||sessionHasPermission(session,'canEvaluateLectures');\n  const lectureNotifications=canLectures?lecturesNeedingEvaluation(getLectures(),session.userId,isAdministrator):[];");
s = s.replace("{nav('class2',<Church className=\"w-4 h-4\"/>,'حضور القداس',true)}", "{nav('class2',<Church className=\"w-4 h-4\"/>,'حضور القداس',true)}");
s = s.replace("{nav('class3',<BookOpen className=\"w-4 h-4\"/>,'المحاضرات',true)}", "{nav('class3',<BookOpen className=\"w-4 h-4\"/>,'المحاضرات',canLectures)}");
s = s.replace("{activeNavTab==='class2'&&<FridayLiturgyModule session={session}/>} ", "{activeNavTab==='class2'&&<FridayLiturgyModule session={session}/>} ");
fs.writeFileSync(path, s);
console.log('Kept liturgy attendance tab, hid its attendance history, and restricted lectures to authorized servants.');
