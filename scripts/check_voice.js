const fs = require('fs');
const p = "public/story.json";
try {
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  const missing = [];
  (data.chapters || []).forEach((ch, ci) => {
    const dialogs = ch.dialogues || [];
    dialogs.forEach((d, di) => {
      if (!Object.prototype.hasOwnProperty.call(d, 'voice')) {
        missing.push({ chapterIndex: ci, chapterTitle: ch.title || null, dialogueIndex: di, preview: d.text || d.speaker || null });
      }
    });
  });
  if (missing.length === 0) {
    console.log('NO_MISSING_VOICE');
  } else {
    console.log('MISSING_COUNT:' + missing.length);
    missing.forEach(m => {
      console.log(`${m.chapterIndex}\t${m.chapterTitle}\t${m.dialogueIndex}\t${m.preview}`);
    });
  }
} catch (e) {
  console.error('ERROR', e.message);
  process.exit(2);
}
