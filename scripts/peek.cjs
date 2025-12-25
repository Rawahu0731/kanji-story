const fs = require('fs');
const raw = fs.readFileSync('public/story.json', 'utf8');
console.log(raw.slice(0,800));
console.log('\n---LEN---', raw.length);
