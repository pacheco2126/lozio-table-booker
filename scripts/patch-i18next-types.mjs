import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'node_modules', 'react-i18next', 'index.d.ts');

if (existsSync(filePath)) {
  let content = readFileSync(filePath, 'utf8');
  content = content.replace(
    /type ObjectOrNever = TypeOptions\['allowObjectInHTMLChildren'\] extends true/,
    'type ObjectOrNever = false extends true'
  );
  writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched react-i18next types');
}
