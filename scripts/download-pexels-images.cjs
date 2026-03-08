const fs = require('fs');
const path = require('path');
const https = require('https');

const PEXELS_API_KEY = 'UPJp8zwqFjKnUL2CUqxcn3U90JtMAhPWUB3ItNMHqu01Sf06gvl0qNVT';

// Image queries matching our safety contractor platform
const imageQueries = [
  { query: 'safety inspector professional', filename: 'hero-safety-inspector.jpg', size: 'large2x' },
  { query: 'industrial safety equipment', filename: 'hero-industrial-safety.jpg', size: 'large2x' },
  { query: 'contractor checklist tablet', filename: 'feature-work-orders.jpg', size: 'large' },
  { query: 'safety equipment inspection', filename: 'feature-equipment.jpg', size: 'large' },
  { query: 'compliance certificate document', filename: 'feature-certificates.jpg', size: 'large' },
  { query: 'business handshake professional', filename: 'feature-client-portal.jpg', size: 'large' },
  { query: 'dashboard analytics computer', filename: 'feature-reports.jpg', size: 'large' },
  { query: 'invoice payment business', filename: 'feature-billing.jpg', size: 'large' },
  { query: 'safety team meeting', filename: 'about-team.jpg', size: 'large' },
];

const outputDir = path.join(__dirname, '..', 'public', 'images', 'marketing');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function searchPexels(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.photos && json.photos.length > 0 ? json.photos[0] : null);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('🎨 Downloading images from Pexels...\n');

  for (const { query, filename, size } of imageQueries) {
    try {
      console.log(`🔍 Searching for: "${query}"`);
      const photo = await searchPexels(query);
      
      if (photo) {
        const imageUrl = photo.src[size] || photo.src.large;
        const filepath = path.join(outputDir, filename);
        
        console.log(`📥 Downloading: ${filename}`);
        await downloadImage(imageUrl, filepath);
        console.log(`✅ Saved: ${filename}\n`);
        
        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ No photo found for: "${query}"\n`);
      }
    } catch (error) {
      console.error(`❌ Error downloading "${query}":`, error.message, '\n');
    }
  }

  console.log('✨ Done! Images saved to:', outputDir);
}

downloadAllImages();
