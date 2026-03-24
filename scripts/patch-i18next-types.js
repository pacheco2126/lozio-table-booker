const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'node_modules', 'react-i18next', 'index.d.ts');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /type ObjectOrNever = TypeOptions\['allowObjectInHTMLChildren'\] extends true\s*\?\s*Record<string, unknown>\s*:\s*never;/,
    'type ObjectOrNever = never;'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched react-i18next types successfully');
} else {
  console.log('File not found:', filePath);
}
