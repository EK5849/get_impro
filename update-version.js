const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, 'sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');

// Buscar CACHE_NAME = 'get-impro-vX'
const regex = /const CACHE_NAME = 'get-impro-v(\d+)';/;
const match = swContent.match(regex);

if (match) {
  const currentVersion = parseInt(match[1], 10);
  const nextVersion = currentVersion + 1;
  const newContent = swContent.replace(regex, `const CACHE_NAME = 'get-impro-v${nextVersion}';`);
  
  fs.writeFileSync(swPath, newContent);
  console.log(`✅ sw.js actualizado: v${currentVersion} -> v${nextVersion}`);
} else {
  console.error('❌ No se pudo encontrar CACHE_NAME en sw.js');
  process.exit(1);
}
