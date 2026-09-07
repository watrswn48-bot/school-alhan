import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after === before) console.log(`No change: ${path}`);
  else { fs.writeFileSync(path, after); console.log(`Patched: ${path}`); }
}

const BRAND = 'مدرسة تي اتشرومبي للألحان';

patchFile('index.html', s => s
  .replace(/<title>[^<]*<\/title>/, `<title>${BRAND}</title>`)
  .replace(/منصة إدارة مدرسة الشماس والأكاديمية/g, BRAND)
);

patchFile('src/components/LoginModule.tsx', s => {
  if (!s.includes("import { SiteFooter } from './SiteFooter';")) {
    s = s.replace("import { QRScannerModal } from './QRScannerModal';", "import { QRScannerModal } from './QRScannerModal';\nimport { SiteFooter } from './SiteFooter';");
  }
  s = s.replace(
    'flex items-center justify-center p-4 relative overflow-hidden',
    'flex flex-col items-center justify-center p-4 relative overflow-hidden'
  );
  s = s.replace(/أكاديمية ومدرسة الشماس المعتمدة/g, BRAND);
  s = s.replace(/منصة الشماس والأكاديمية/g, BRAND);
  s = s.replace(/أهلاً بك في نظام المتابعة الرقمي/g, `أهلاً بك في ${BRAND}`);
  if (!s.includes('<SiteFooter />')) {
    const marker = '\n    </div>\n  );\n};';
    const idx = s.lastIndexOf(marker);
    if (idx !== -1) s = s.slice(0, idx) + '\n      <SiteFooter />' + s.slice(idx);
  }
  return s;
});

patchFile('src/App.tsx', s => {
  if (!s.includes("import { SiteFooter } from './components/SiteFooter';")) {
    s = s.replace("import { SmartIDCardModal } from './components/SmartIDCardModal';", "import { SmartIDCardModal } from './components/SmartIDCardModal';\nimport { SiteFooter } from './components/SiteFooter';");
  }
  s = s.replace('</main></div><SmartIDCardModal', '</main><SiteFooter /></div><SmartIDCardModal');
  s = s.replace('</main></div></div>;', '</main><SiteFooter /></div></div>;');
  return s;
});

console.log('Branding and site-wide footer fixes applied.');
