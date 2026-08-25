const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..'); // C:/Users/takem/mg-wt-a1

const jobs = [
  { src: 'btn-gacha.png', width: 800, quality: 80 },
  { src: 'chest-wood.png', width: 256, quality: 85 },
  { src: 'chest-silver.png', width: 256, quality: 85 },
  { src: 'chest-gold.png', width: 256, quality: 85 },
  { src: 'chest-rainbow.png', width: 256, quality: 85 },
  { src: 'max-gem.png', width: 512, quality: 85 },
  { src: 'max-gold.png', width: 512, quality: 85 },
  { src: 'max-relic.png', width: 512, quality: 85 },
  { src: 'max-art.png', width: 512, quality: 85 },
  { src: 'max-space.png', width: 512, quality: 85 },
  { src: 'max-kingdom.png', width: 512, quality: 85 },
  { src: 'nav-home.png', width: 128, quality: 85 },
  { src: 'nav-gacha.png', width: 128, quality: 85 },
  { src: 'nav-game.png', width: 128, quality: 85 },
  { src: 'nav-collection.png', width: 128, quality: 85 },
  { src: 'nav-synth.png', width: 128, quality: 85 },
];

async function run() {
  for (const job of jobs) {
    const srcPath = path.join(ROOT, job.src);
    const outPath = path.join(ROOT, job.src.replace(/\.png$/i, '.webp'));
    await sharp(srcPath)
      .resize({ width: job.width })
      .webp({ quality: job.quality })
      .toFile(outPath);
    console.log('OK', job.src, '->', path.basename(outPath));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
