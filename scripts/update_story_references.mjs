import fs from 'fs/promises';
import path from 'path';

const storyPath = path.join(process.cwd(), 'public', 'story.json');

async function main() {
  const raw = await fs.readFile(storyPath, 'utf8');
  await fs.writeFile(storyPath + '.bak', raw, 'utf8');

  // Text-level replacement to avoid JSON parse issues (preserve formatting)
  const replaced = raw.replace(/\.wav\b/gi, '.mp3');

  if (replaced === raw) {
    console.log('No .wav references found in', storyPath);
    return;
  }

  await fs.writeFile(storyPath, replaced, 'utf8');
  console.log('Replaced .wav → .mp3 in', storyPath, '(backup:', storyPath + '.bak' + ')');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
