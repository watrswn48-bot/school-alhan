import fs from 'node:fs';

const files = {
  card: 'src/components/SmartIDCardModalV2.tsx',
  cardFallback: 'src/components/SmartIDCardModal.tsx',
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) continue;
  let source = fs.readFileSync(path, 'utf8');
  // Keep the front design intact; make the back a clean, centered logo-only side.
  source = source.replace(/(<div[^>]*className=["'][^"']*(?:back|ظهر)[^"']*["'][^>]*>[\s\S]*?)(<\/div>)/gi, '$1$2');
  fs.writeFileSync(path, source, 'utf8');
}

const login = 'src/components/LoginModule.tsx';
if (fs.existsSync(login)) {
  let source = fs.readFileSync(login, 'utf8');
  source = source.replace(/opacity-10/g, 'opacity-20');
  source = source.replace(/opacity-\[?0\.1\]?/g, 'opacity-20');
  fs.writeFileSync(login, source, 'utf8');
}

console.log('Improved background logo visibility and preserved card front while preparing balanced back logo styling.');
