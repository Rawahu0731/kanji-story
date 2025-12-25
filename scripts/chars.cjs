const fs = require('fs');
const raw = fs.readFileSync('public/story.json', 'utf8');
for (let i = 0; i < 100; i++) {
  const ch = raw[i];
  if (!ch) break;
  console.log(i, ch, ch.charCodeAt(0));
}
console.log('---LEN', raw.length);
