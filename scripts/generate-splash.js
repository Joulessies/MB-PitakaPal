#!/usr/bin/env node
/**
 * Generates the PitakaPal splash screen image.
 * Dark background #282828, wallet logo from 8.png, "PitakaPal" text.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'assets/images/8.png');
const outputPath = path.join(root, 'assets/images/splash-icon.png');

const WIDTH = 440;
const HEIGHT = 956;
const BG_COLOR = '#282828';
const LOGO_SIZE = 120;
const LOGO_Y = 380;
const TEXT_Y = 520;

async function generate() {
  // Read logo and convert to base64 for SVG embedding
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BG_COLOR}"/>
      <image 
        href="data:image/png;base64,${logoBase64}" 
        x="${(WIDTH - LOGO_SIZE) / 2}" 
        y="${LOGO_Y}" 
        width="${LOGO_SIZE}" 
        height="${LOGO_SIZE}"
        preserveAspectRatio="xMidYMid meet"
      />
      <text 
        x="${WIDTH / 2}" 
        y="${TEXT_Y}" 
        fill="#FFFFFF" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="28" 
        font-weight="600" 
        text-anchor="middle"
      >PitakaPal</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log('Splash screen generated:', outputPath);
}

generate().catch((err) => {
  console.error('Failed to generate splash:', err);
  process.exit(1);
});
