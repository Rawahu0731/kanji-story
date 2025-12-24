const fs = require('fs');
const path = 'public/story.json';
const j = JSON.parse(fs.readFileSync(path, 'utf8'));
let total = 0;
let changed = 0;
const details = [];
for (const ch of j.chapters || []) {
  for (const d of ch.dialogues || []) {
    if (!d.text) continue;
    total++;
    const opens = (d.text.match(/「/g) || []).length;
    const closes = (d.text.match(/」/g) || []).length;
    if (opens > closes) {
      const need = opens - closes;
      d.text = d.text + '」'.repeat(need);
      changed++;
      details.push({ chapter: ch.title || '', need, newText: d.text });
    }
  }
}
fs.writeFileSync(path, JSON.stringify(j, null, 4), 'utf8');
console.log(JSON.stringify({ total, changed, detailsCount: details.length }, null, 2));
