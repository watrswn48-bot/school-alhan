import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
const baselineCommit = 'f1458617c66f54265f7777076fa52275d7aee8cb';

const content = execFileSync('git', ['show', `${baselineCommit}:${path}`], { encoding: 'utf8' });
fs.writeFileSync(path, content);
console.log(`Restored ${path} from known-good commit ${baselineCommit}.`);
