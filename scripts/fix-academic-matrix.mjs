import fs from 'node:fs';

const path = 'src/components/AnalyticsModule.tsx';
let source = fs.readFileSync(path, 'utf8');

source = source.replaceAll('16-Year Matrix', '8-Year Matrix');
source = source.replaceAll('16-Year Grid', '8-Year Grid');
source = source.replaceAll('16 سنة دراسية', '8 سنوات دراسية');
source = source.replaceAll('16 سنة (Academic Progress Matrix)', '8 سنوات (Academic Progress Matrix)');
source = source.replaceAll('/* 16 Stage Cells */', '/* 8 Stage Cells */');

source = source.replace(
  '{[0, 1, 2, 3].map((lvlIdx) =>\n                  [0, 1, 2, 3].map((yrIdx) => (',
  '{ACADEMIC_LEVELS.map((_, lvlIdx) =>\n                  ACADEMIC_YEARS.map((_, yrIdx) => ('
);

source = source.replace(
  '{[0, 1, 2, 3].map((lIdx) =>\n                    [0, 1, 2, 3].map((yIdx) => {',
  '{ACADEMIC_LEVELS.map((_, lIdx) =>\n                    ACADEMIC_YEARS.map((_, yIdx) => {'
);

source = source.replace(
  'const scoreA = a.levelIndex * 4 + a.yearIndex;',
  'const scoreA = a.levelIndex * ACADEMIC_YEARS.length + a.yearIndex;'
);
source = source.replace(
  'const scoreB = b.levelIndex * 4 + b.yearIndex;',
  'const scoreB = b.levelIndex * ACADEMIC_YEARS.length + b.yearIndex;'
);

fs.writeFileSync(path, source, 'utf8');
console.log('Academic matrix fixed to 2 levels x 4 years = 8 years.');
