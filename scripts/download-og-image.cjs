const fs = require('fs');
const path = require('path');
const https = require('https');

const PEXELS_API_KEY = 'UPJp8zwqFjKnUL2CUqxcn3U90JtMAhPWUB3ItNMHqu01Sf06gvl0qNVT';

// Search queries in priority order
const queries = [
  'safety inspector construction site professional',
  'industrial safety equipment modern technology',
  'building inspection professional Saudi Arabia',
  'workplace safety construction helmet',
  'safety management technology digital'
];

const outputDir = path.join(__dirname, '..', 'public', 'images');
const outputFile = 'og-image.jpg';

async function searchPexels(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      headers: { 'Authorization': PEXELS_API_KEY }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.photos || []);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
  });
}

async function run() {
  console.log('Searching Pexels for perfect OG image (1200x630)...\n');
  
  for (const query of queries) {
    try {
      console.log(`Trying: "${query}"`);
      const photos = await searchPexels(query);
      
      if (photos.length > 0) {
        // Find best photo with good aspect ratio for OG (close to 1200x630 = 1.9:1)
        let bestPhoto = photos[0];
        let bestRatio = Math.abs((bestPhoto.width / bestPhoto.height) - 1.9);
        
        for (const photo of photos) {
          const ratio = Math.abs((photo.width / photo.height) - 1.9);
          if (ratio < bestRatio) {
            bestPhoto = photo;
            bestRatio = ratio;
          }
        }
        
        console.log(`✓ Found: ${bestPhoto.photographer} (${bestPhoto.width}x${bestPhoto.height})`);
        console.log(`  URL: ${bestPhoto.url}`);
        
        const imageUrl = bestPhoto.src.large2x || bestPhoto.src.large;
        const filepath = path.join(outputDir, outputFile);
        
        console.log(`\nDownloading to: ${outputFile}`);
        await downloadImage(imageUrl, filepath);
        console.log(`✓ Success! OG image saved.`);
        console.log(`\nPhoto by ${bestPhoto.photographer} on Pexels`);
        console.log(`Photo URL: ${bestPhoto.url}`);
        return;
      }
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✗ No suitable images found. Please try manual search.');
}

run();
