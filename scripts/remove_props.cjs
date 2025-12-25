const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'memo2.txt');

try {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (Array.isArray(data.chapters)) {
    data.chapters.forEach(ch => {
      if (Array.isArray(ch.dialogues)) {
        ch.dialogues.forEach(d => {
          if (d && typeof d === 'object') {
            delete d.characters;
            delete d.background;
          }
        });
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log('memo2.txt updated: removed characters and background from dialogues.');
} catch (err) {
  console.error('Error processing file:', err.message);
  process.exitCode = 1;
}
