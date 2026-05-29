import fs from 'fs';
import path from 'path';

const searchDir = 'c:/Users/Raman K Singh/Documents/RR Digital Solutions/Sampooran Holidays/sampooran-holidays-source/admin-panel/src';

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('127.0.0.1:8080')) {
        console.log(`Updating ${filePath}`);
        content = content.replace(/127\.0\.0\.1:8080/g, 'localhost:8080');
        fs.writeFileSync(filePath, content);
      }
    }
  });
}

walk(searchDir);
