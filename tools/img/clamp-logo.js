const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const srcPath = path.join(ROOT, 'assets/ui/gacha-logo.webp');
const outPath = path.join(ROOT, 'assets/ui/gacha-logo-fix.webp');

async function run() {
  const img = sharp(srcPath);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 3 (no alpha) per metadata check

  for (let i = 0; i < data.length; i++) {
    // Only clamp color channels, not alpha (if present, alpha is last channel per pixel)
    const chIdx = i % channels;
    const isAlpha = channels === 4 && chIdx === 3;
    if (!isAlpha && data[i] <= 24) {
      data[i] = 0;
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels } })
    .webp({ quality: 90, lossless: false })
    .toFile(outPath);

  console.log('meta:', JSON.stringify(meta));
  console.log('raw info:', JSON.stringify(info));
  console.log('OK ->', outPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
