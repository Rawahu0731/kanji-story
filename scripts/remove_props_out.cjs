const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'memo2.txt');
const outPath = path.join(__dirname, '..', 'memo2_cleaned.txt');

try {
  const raw = fs.readFileSync(inPath, 'utf8');
  const data = JSON.parse(raw);
  let count = 0;
  if (Array.isArray(data.chapters)) {
    data.chapters.forEach(ch => {
      if (Array.isArray(ch.dialogues)) {
        ch.dialogues.forEach(d => {
          if (d && typeof d === 'object') {
            if ('characters' in d) { delete d.characters; count++; }
            if ('background' in d) { delete d.background; count++; }
          }
        });
      }
    });
  }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log(`Wrote ${outPath}. Removed ~${count} properties.`);
} catch (err) {
  console.error('Error:', err.message);
  process.exitCode = 1;
}
