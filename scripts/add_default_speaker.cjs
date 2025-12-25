const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'memo2.txt');

try {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let added = 0;

  if (Array.isArray(data.chapters)) {
    data.chapters.forEach(ch => {
      if (Array.isArray(ch.dialogues)) {
        ch.dialogues.forEach(d => {
          if (d && typeof d === 'object') {
            if (!('speaker' in d)) {
              d.speaker = "ナレーション";
              added++;
            }
          }
        });
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
  console.log(`Updated ${filePath}: added speaker to ${added} dialogues.`);
} catch (err) {
  console.error('Error:', err.message);
  process.exitCode = 1;
}
