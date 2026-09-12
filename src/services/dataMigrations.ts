import { getServants, saveServant } from './storage';
export function runDataMigrations(): void {
  try {
    const servants=getServants(); const seen=new Set<string>();
    for(const servant of servants){
      const raw=servant.role as string;
      const role=raw==='admin'?'admin':(raw==='family_admin'||raw==='senior_servant')?'senior_servant':'junior_servant';
      let code=servant.secretCode||'';
      if(code&&seen.has(code)){do{code=String(Math.floor(100000+Math.random()*900000));}while(seen.has(code));}
      seen.add(code);
      if(role!==raw||code!==servant.secretCode)saveServant({...servant,role:role as any,secretCode:code});
    }
  }catch(error){console.warn('Data migration skipped:',error);}
}
