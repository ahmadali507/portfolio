// Prepares the project screenshots that Ahmad keeps in the OnePercent Google Drive folder.
// Usage: node scripts/project-shots.mjs <folder with one subfolder per project>
//
// The raw screenshots are not in the repository: several show names, emails, a surname that is not
// approved yet, or a real child's photo. This script crops and blurs those regions, then writes:
//   public/projects/<slug>/<n>.webp     1600 px wide, for the page and the no-WebGL fallback
//   public/projects/<slug>/atlas.webp   1024 px wide, all shots stacked, the texture for the 3D card
//   src/data/shots.json                 per shot: file, alt text, aspect, focus box
// sharp ships with Astro, so this adds no dependency.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = process.argv[2];
if (!SRC) {
  console.error('project-shots: pass the folder that holds the Drive screenshots.');
  process.exit(1);
}

// Rectangles are [x, y, w, h] in source pixels. focus is [x, y, w, h] as fractions of the final image:
// the region the motion graphic lifts out and magnifies.
const PROJECTS = {
  'magicalbook-store': {
    dir: 'MagicalBook',
    shots: [
      {
        file: 'landing-page.png',
        alt: 'MagicalBook landing page: headline, the create-preview button, and an illustrated book cover.',
        blur: [[895, 470, 200, 280], [1545, 5, 80, 70]],
        focus: [0.6, 0.24, 0.245, 0.63],
      },
      {
        file: 'book-reader.png',
        alt: 'The book reader: an illustrated page beside the story text, with edit, share, export, and print actions.',
        blur: [[990, 320, 430, 225], [1470, 0, 90, 60]],
        focus: [0.24, 0.1, 0.26, 0.77],
      },
      {
        file: 'art-styles.png',
        alt: 'The art style picker: 3D cinematic, classic storybook, block, and realistic styles.',
        blur: [[450, 474, 320, 260], [1490, 0, 70, 50]],
        focus: [0.415, 0.215, 0.17, 0.28],
      },
    ],
  },
  codesmash: {
    dir: 'Codesmash',
    shots: [
      {
        file: 'main-battle-view.png',
        alt: 'A Codesmash battle: the problem on the left, your editor in the middle, the opponent editor blurred on the right, and a countdown.',
        blur: [[1040, 15, 280, 75], [2890, 10, 110, 90]],
        focus: [0.25, 0.11, 0.37, 0.49],
      },
      {
        file: 'lobby-page.png',
        alt: 'The Codesmash lobby with a live battle to watch and open challenges to join.',
        blur: [[430, 515, 710, 120], [430, 1095, 630, 130], [2530, 15, 100, 90]],
        focus: [0.14, 0.32, 0.235, 0.21],
      },
      {
        file: 'game-result-view.png',
        alt: 'The result screen after a battle ends, with both players and a button back to the lobby.',
        blur: [[940, 865, 1145, 160], [1455, 15, 250, 70], [2900, 10, 100, 80]],
        focus: [0.4, 0.3, 0.2, 0.22],
      },
    ],
  },
  shocodoc: {
    dir: 'ShocoDoc',
    shots: [
      {
        file: 'text-editor.png',
        alt: 'The Shocodoc editor: formatted text, a highlighted word, and an inline comment box.',
        blur: [[1080, 375, 115, 45]],
        focus: [0.44, 0.34, 0.24, 0.2],
      },
      {
        file: 'dashboard.png',
        alt: 'The document list with a button to start a blank document.',
        blur: [],
        focus: [0.26, 0.3, 0.3, 0.13],
      },
    ],
  },
  menumatch: {
    dir: 'MenuMatch',
    shots: [
      {
        file: 'LandingPage.png',
        alt: 'The MenuMatch admin overview: restaurant, menu, and admin totals, and recent activity.',
        blur: [[1395, 540, 450, 360], [1835, 5, 70, 65]],
        focus: [0.21, 0.24, 0.25, 0.23],
      },
      {
        file: 'Menu_page.png',
        alt: 'A menu editor with its generated QR code, versions, and sections.',
        blur: [[0, 872, 640, 27], [1830, 0, 89, 30]],
        focus: [0.68, 0.025, 0.31, 0.185],
      },
      {
        file: 'Theme_Customization.png',
        alt: 'The theme editor: colors on the left and a live preview of the themed menu on the right.',
        crop: [184, 25, 1125, 788],
        blur: [],
        focus: [0.51, 0.23, 0.45, 0.65],
      },
    ],
  },
  prepify: {
    dir: 'Prepify',
    shots: [
      {
        file: 'Landing-page.png',
        alt: 'The Prepify landing page: the headline, start and demo buttons, and an illustration.',
        blur: [[215, 705, 700, 105]],
        focus: [0.12, 0.3, 0.34, 0.31],
      },
      {
        file: 'Interview.png',
        alt: 'A list of mock interviews, each with a role, date, score, and short feedback.',
        blur: [[1360, 15, 300, 60]],
        focus: [0.365, 0.45, 0.26, 0.55],
      },
      {
        file: 'User-dashboard.png',
        alt: 'The progress dashboard: interview count, average score, and suggested next steps.',
        blur: [[1360, 15, 300, 60], [185, 395, 520, 72]],
        focus: [0.4, 0.18, 0.205, 0.6],
      },
    ],
  },
  echosign: {
    dir: 'EchoSign',
    shots: [
      {
        file: 'landing_page.png',
        alt: 'The EchoSign landing page and its call to try gesture recognition.',
        blur: [],
        focus: [0.385, 0.52, 0.23, 0.1],
      },
      {
        file: 'gesture_verification.png',
        alt: 'Gesture recognition: a captured hand sign, the recognized word, and audio export.',
        blur: [],
        focus: [0.114, 0.516, 0.247, 0.4],
      },
      {
        file: 'text_to_audio.png',
        alt: 'Text to voice: typed text, a voice picker, and convert and export buttons.',
        blur: [[112, 108, 765, 48], [775, 16, 100, 38]],
        focus: [0.11, 0.68, 0.35, 0.13],
      },
    ],
  },
  hundredpov: {
    dir: 'HundredPov',
    shots: [
      {
        file: 'landingpage.png',
        alt: 'The landing page: a headline for live game streams and a featured live card.',
        blur: [],
        focus: [0.595, 0.34, 0.295, 0.415],
      },
      {
        file: 'features.png',
        alt: 'Live stream cards with live markers, viewer counts, and watch buttons.',
        blur: [[165, 628, 165, 68], [738, 628, 165, 68], [1312, 628, 185, 68]],
        focus: [0.056, 0.34, 0.285, 0.52],
      },
      {
        file: 'game-lobby.png',
        alt: 'The match lobby with open, live, and completed tabs and a sign-in prompt.',
        blur: [],
        focus: [0.727, 0.26, 0.22, 0.36],
      },
    ],
  },
};

const CELL_W = 1024;
const CELL_H = 512;
const PAD = 8;

async function prepare(path, shot) {
  let img = sharp(path).removeAlpha();
  const meta = await img.metadata();
  let buf = await img.png().toBuffer();
  // Blur first, in source coordinates, then crop.
  for (const [x, y, w, h] of shot.blur) {
    const left = Math.max(0, x);
    const top = Math.max(0, y);
    const width = Math.min(w, meta.width - left);
    const height = Math.min(h, meta.height - top);
    const patch = await sharp(buf).extract({ left, top, width, height }).blur(Math.max(14, height / 3)).toBuffer();
    buf = await sharp(buf).composite([{ input: patch, left, top }]).png().toBuffer();
  }
  if (shot.crop) {
    const [left, top, width, height] = shot.crop;
    buf = await sharp(buf).extract({ left, top, width, height }).png().toBuffer();
  }
  return buf;
}

const data = {};
for (const [slug, project] of Object.entries(PROJECTS)) {
  const outDir = join('public', 'projects', slug);
  mkdirSync(outDir, { recursive: true });
  const cells = [];
  data[slug] = [];
  for (let i = 0; i < project.shots.length; i++) {
    const shot = project.shots[i];
    const buf = await prepare(join(SRC, project.dir, shot.file), shot);
    const meta = await sharp(buf).metadata();
    const name = `${i + 1}.webp`;
    await sharp(buf).resize({ width: Math.min(1600, meta.width) }).webp({ quality: 82 }).toFile(join(outDir, name));
    // Atlas cell: the shot fitted inside the cell, top left, with a margin so mipmaps do not bleed.
    const fit = await sharp(buf)
      .resize({ width: CELL_W - PAD * 2, height: CELL_H - PAD * 2, fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    cells.push({ input: fit.data, left: PAD, top: i * CELL_H + PAD });
    data[slug].push({
      src: `/projects/${slug}/${name}`,
      alt: shot.alt,
      width: Math.min(1600, meta.width),
      height: Math.round((Math.min(1600, meta.width) / meta.width) * meta.height),
      // Where the shot sits inside its atlas cell, as fractions of the cell.
      cell: [PAD / CELL_W, PAD / CELL_H, fit.info.width / CELL_W, fit.info.height / CELL_H],
      focus: shot.focus,
    });
  }
  await sharp({ create: { width: CELL_W, height: CELL_H * cells.length, channels: 3, background: '#000000' } })
    .composite(cells)
    .webp({ quality: 84 })
    .toFile(join(outDir, 'atlas.webp'));
  console.log(`project-shots: ${slug}, ${cells.length} shot(s)`);
}

mkdirSync(join('src', 'data'), { recursive: true });
writeFileSync(join('src', 'data', 'shots.json'), `${JSON.stringify(data, null, 2)}\n`);
console.log('project-shots: wrote src/data/shots.json');
