import fs from 'node:fs';

const addPath = 'src/components/AddStudentModule.tsx';
let add = fs.readFileSync(addPath, 'utf8');

add = add.replace(
  "import { DeaconRank, Student, UserSession } from '../types';",
  "import { DeaconRank, UserSession } from '../types';"
);
add = add.replace("import { SmartIDCardModal } from './SmartIDCardModal';\n", '');
add = add.replace(
  "interface Props { session: UserSession; }",
  "interface Props { session: UserSession; onStudentSaved: (student: ReturnType<typeof saveStudent>) => void; }"
);
add = add.replace(
  "export const AddStudentModule: React.FC<Props> = ({ session }) => {",
  "export const AddStudentModule: React.FC<Props> = ({ session, onStudentSaved }) => {"
);
add = add.replace(",[savedStudent,setSavedStudent]=useState<Student|null>(null)", '');
add = add.replace('setSavedStudent(student);', 'onStudentSaved(student);');
add = add.replace(
  /\n <SmartIDCardModal student=\{savedStudent\}[\s\S]*?onClose=\{\(\)=>setSavedStudent\(null\)\}\/\>/,
  ''
);
fs.writeFileSync(addPath, add, 'utf8');

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

const selectedCardState = 'const [selectedStudentForIDCard,setSelectedStudentForIDCard]=useState<Student|null>(null);';
const newCardState = 'const [newStudentIDCard,setNewStudentIDCard]=useState<Student|null>(null);';

if (!app.includes(newCardState) && app.includes(selectedCardState)) {
  app = app.replace(selectedCardState, `${selectedCardState}\n  ${newCardState}`);
}

const oldLogout = "const handleLogout=()=>{setSession({isLoggedIn:false,mode:'servant'});localStorage.removeItem('deacon_system_session_v1');setSelectedStudentForProfile(null);setActiveNavTab('class1');};";
const newLogout = "const handleLogout=()=>{setSession({isLoggedIn:false,mode:'servant'});localStorage.removeItem('deacon_system_session_v1');setSelectedStudentForProfile(null);setSelectedStudentForIDCard(null);setNewStudentIDCard(null);setActiveNavTab('class1');};";
if (app.includes(oldLogout)) app = app.replace(oldLogout, newLogout);

app = app.replace(
  '<AddStudentModule session={session}/>',
  '<AddStudentModule session={session} onStudentSaved={setNewStudentIDCard}/>'
);

const selectedModal = '<SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={()=>setSelectedStudentForIDCard(null)}/>';
const newStudentModal = '<SmartIDCardModal student={newStudentIDCard} isOpen={!!newStudentIDCard} onClose={()=>setNewStudentIDCard(null)}/>';

if (!app.includes(newStudentModal) && app.includes(selectedModal)) {
  app = app.replace(selectedModal, `${selectedModal}${newStudentModal}`);
}

fs.writeFileSync(appPath, app, 'utf8');
console.log('Student ID card persistence patch applied safely and idempotently.');
