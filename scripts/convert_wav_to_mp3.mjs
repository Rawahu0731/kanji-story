import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath || undefined);

const voiceDir = path.join(process.cwd(), 'public', 'voice');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function convertFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

async function main() {
  const files = await fs.readdir(voiceDir);
  const wavs = files.filter((f) => f.toLowerCase().endsWith('.wav'));
  if (wavs.length === 0) {
    console.log('No .wav files found in', voiceDir);
    return;
  }

  for (const f of wavs) {
    const input = path.join(voiceDir, f);
    const outName = f.replace(/\.wav$/i, '.mp3');
    const output = path.join(voiceDir, outName);
    if (await exists(output)) {
      console.log('Skipping existing:', outName);
      continue;
    }
    try {
      console.log('Converting:', f, '→', outName);
      await convertFile(input, output);
      console.log('Done:', outName);
      try {
        await fs.unlink(input);
        console.log('Removed original:', f);
      } catch (rmErr) {
        console.error('Failed to remove original file:', input, rmErr.message || rmErr);
      }
    } catch (e) {
      console.error('Failed to convert', f, e.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
