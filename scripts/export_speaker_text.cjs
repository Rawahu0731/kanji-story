const fs = require('fs');
const path = require('path');

const inPath = path.join(__dirname, '..', 'memo2.txt');
const outPath = path.join(__dirname, '..', 'memo2_speaker_text.csv');

function csvEscape(s){
  if (s === undefined || s === null) return '""';
  return '"' + String(s).replace(/"/g, '""') + '"';
}

try{
  const raw = fs.readFileSync(inPath, 'utf8');
  const data = JSON.parse(raw);
  const lines = [];
  // header
  lines.push('speaker,text');

  if (Array.isArray(data.chapters)){
    data.chapters.forEach(ch => {
      if (Array.isArray(ch.dialogues)){
        ch.dialogues.forEach(d => {
          if (d && typeof d === 'object'){
            let speaker = d.speaker;
            if (Array.isArray(speaker)) speaker = speaker.join('/');
            if (speaker === undefined || speaker === null) speaker = '';
            const text = d.text === undefined || d.text === null ? '' : d.text;
            lines.push([csvEscape(speaker), csvEscape(text)].join(','));
          }
        });
      }
    });
  }

  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log('Wrote', outPath, 'with', lines.length-1, 'rows');
} catch(err){
  console.error('Error:', err.message);
  process.exitCode = 1;
}
