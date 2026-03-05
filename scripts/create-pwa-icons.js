/**
 * PWA Icon Generator
 * 
 * This script resizes the Tasheel logo into PWA-required icon sizes
 * Requires: sharp package (npm install sharp)
 * 
 * Usage: node scripts/create-pwa-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_IMAGE = path.join(__dirname, '..', 'tasheel logo.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

const SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from Tasheel logo...\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('❌ Error: tasheel logo.png not found!');
    console.error('   Expected location:', INPUT_IMAGE);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate each icon size
  for (const { size, name } of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, name);
    
    try {
      await sharp(INPUT_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to create ${name}:`, error.message);
    }
  }

  console.log('\n🎉 PWA icons generated successfully!');
  console.log('📁 Location: public/icon-192.png, public/icon-512.png');
  console.log('\n📱 Next steps:');
  console.log('1. Test PWA installation on mobile');
  console.log('2. Check manifest.json is linked');
  console.log('3. Run Lighthouse PWA audit');
}

generateIcons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
