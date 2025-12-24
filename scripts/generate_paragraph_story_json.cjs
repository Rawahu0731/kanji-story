const fs = require('fs');
const path = require('path');

const inFile = path.join(__dirname, '..', 'public', 'story.txt');
const outFile = path.join(__dirname, '..', 'public', 'story.json');

const text = fs.readFileSync(inFile, 'utf8');

// 段落（空行で区切られたブロック）ごとに分割して JSON にする
const blocks = text.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean);

const book = { title: '', chapters: [] };
let currentChapter = null;

blocks.forEach(block => {
  if (block.startsWith('# ')) {
    book.title = block.replace('# ', '').trim();
    return;
  }
  if (block.startsWith('## ')) {
    if (currentChapter) book.chapters.push(currentChapter);
    currentChapter = { title: block.replace('## ', '').trim(), dialogues: [] };
    return;
  }
  if (!currentChapter) currentChapter = { title: '導入', dialogues: [] };

  // 段落が台詞のみ（「」で始まる）なら speaker を未設定のまま text を入れる
  currentChapter.dialogues.push({ text: block });
});

if (currentChapter) book.chapters.push(currentChapter);

fs.writeFileSync(outFile, JSON.stringify(book, null, 2), 'utf8');
console.log('Wrote', outFile);
