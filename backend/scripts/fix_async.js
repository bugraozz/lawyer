const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/routes');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts')) {
    let p = path.join(dir, file);
    let c = fs.readFileSync(p, 'utf8');
    // Replace non-async handlers
    c = c.replace(/,\s*\(\s*(req[^)]*)\s*\)\s*=>\s*\{/g, ', async ($1) => {');
    fs.writeFileSync(p, c);
  }
});
