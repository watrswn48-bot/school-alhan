import fs from 'node:fs';

const path = 'src/components/AdminPanelModule.tsx';
let source = fs.readFileSync(path, 'utf8');

source = source.replace("import { CurriculaModule } from './CurriculaModule';\n", '');
source = source.replace("useState<'servants' | 'curricula' | 'branding' | 'backup'>('servants')", "useState<'servants' | 'branding' | 'backup'>('servants')");
source = source.replace("[['servants','إدارة الخدام والصلاحيات'],['curricula','مناهج الشمامسة ومكتبة الألحان'],['branding','شعار الأكاديمية والموقع'],['backup','النسخ الاحتياطي والاستعادة']]", "[['servants','إدارة الخدام والصلاحيات'],['branding','شعار الأكاديمية والموقع'],['backup','النسخ الاحتياطي والاستعادة']]");
source = source.replace("\n    {activeAdminTab==='curricula' && <CurriculaModule session={session}/>}\n", '\n');

fs.writeFileSync(path, source, 'utf8');
console.log('Removed the duplicate curriculum/materials section from the Admin panel.');
