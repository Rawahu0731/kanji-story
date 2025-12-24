const fs = require('fs');
const path = require('path');

const inFile = path.join(__dirname, '..', 'public', 'story.txt');
const outFile = path.join(__dirname, '..', 'public', 'story.json');

const text = fs.readFileSync(inFile, 'utf8');

function splitIntoSentences(paragraph) {
  // 文末の句点を保持して文に分割（簡易）
  const matches = paragraph.match(/[^。！？\n]+[。！？]?/g);
  if (!matches) return [];
  return matches.map(s => s.trim()).filter(Boolean);
}

const lines = text.split(/\r?\n/);
const book = { title: '', chapters: [] };
let currentChapter = null;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const line = raw.trim();
  if (!line) continue;

  if (line.startsWith('# ')) {
    book.title = line.replace('# ', '').trim();
    continue;
  }

  if (line.startsWith('## ')) {
    if (currentChapter) book.chapters.push(currentChapter);
    currentChapter = { title: line.replace('## ', '').trim(), dialogues: [] };
    continue;
  }

  if (line.startsWith('-----')) continue;

  // 見出しや装飾でない通常の行は段落として扱い、文ごとに分割して追加
  const sentences = splitIntoSentences(line);
  sentences.forEach(s => {
    // 話者推定：名前を含む場合は話者に設定（簡易）
    const entry = { text: s };
    const speakerNames = ['太郎','彁','零','焔','結','守','問','希','老人','少女','じい'];
    for (const name of speakerNames) {
      if (s.includes(name + '：') || s.startsWith(name) || s.includes(name + '、') || s.includes(name + 'は') || (s.includes('「') && s.includes('」') && s.includes(name))) {
        entry.speaker = name;
        break;
      }
    }
    currentChapter ||= { title: '無題', dialogues: [] };
    currentChapter.dialogues.push(entry);
  });
}

if (currentChapter) book.chapters.push(currentChapter);

fs.writeFileSync(outFile, JSON.stringify(book, null, 2), 'utf8');
console.log('Wrote', outFile);
