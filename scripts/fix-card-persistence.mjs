import fs from 'node:fs';

const addPath = 'src/components/AddStudentModule.tsx';
let add = fs.readFileSync(addPath, 'utf8');
add = add.replace("import { DeaconRank, Student, UserSession } from '../types';", "import { DeaconRank, UserSession } from '../types';");
add = add.replace("import { SmartIDCardModal } from './SmartIDCardModal';\n", '');
add = add.replace("interface Props { session: UserSession; }", "interface Props { session: UserSession; onStudentSaved: (student: ReturnType<typeof saveStudent>) => void; }");
add = add.replace("export const AddStudentModule: React.FC<Props> = ({ session }) => {", "export const AddStudentModule: React.FC<Props> = ({ session, onStudentSaved }) => {");
add = add.replace(",[savedStudent,setSavedStudent]=useState<Student|null>(null)", '');
add = add.replace('setSavedStudent(student);', 'onStudentSaved(student);');
add = add.replace(/\n <SmartIDCardModal student=\{savedStudent\}[\s\S]*?onClose=\{\(\)=>setSavedStudent\(null\)\}\/\>/, '');
fs.writeFileSync(addPath, add, 'utf8');

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace(
  'const [selectedStudentForIDCard,setSelectedStudentForIDCard]=useState<Student|null>(null);',
  'const [selectedStudentForIDCard,setSelectedStudentForIDCard]=useState<Student|null>(null);\n  const [newStudentIDCard,setNewStudentIDCard]=useState<Student|null>(null);'
);
app = app.replace(
  "const handleLogout=()=>{setSession({isLoggedIn:false,mode:'servant'});localStorage.removeItem('deacon_system_session_v1');setSelectedStudentForProfile(null);setActiveNavTab('class1');};",
  "const handleLogout=()=>{setSession({isLoggedIn:false,mode:'servant'});localStorage.removeItem('deacon_system_session_v1');setSelectedStudentForProfile(null);setSelectedStudentForIDCard(null);setNewStudentIDCard(null);setActiveNavTab('class1');};"
);
app = app.replace(
  "<AddStudentModule session={session}/>",
  "<AddStudentModule session={session} onStudentSaved={setNewStudentIDCard}/>"
);
const oldModal = '<SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={()=>setSelectedStudentForIDCard(null)}/>\n  </main>';
const newModal = '<SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={()=>setSelectedStudentForIDCard(null)}/><SmartIDCardModal student={newStudentIDCard} isOpen={!!newStudentIDCard} onClose={()=>setNewStudentIDCard(null)}/>\n  </main>';
if (app.includes(oldModal)) app = app.replace(oldModal, newModal);
else {
  app = app.replace(
    '<SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={()=>setSelectedStudentForIDCard(null)}/>',
    '<SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={()=>setSelectedStudentForIDCard(null)}/><SmartIDCardModal student={newStudentIDCard} isOpen={!!newStudentIDCard} onClose={()=>setNewStudentIDCard(null)}/>'
  );
}
fs.writeFileSync(appPath, app, 'utf8');
console.log('Student ID card is now owned by App state and cannot disappear when AddStudentModule rerenders or unmounts.');
