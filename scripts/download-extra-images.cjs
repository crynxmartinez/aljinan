const fs = require('fs');
const path = require('path');
const https = require('https');

const PEXELS_API_KEY = 'UPJp8zwqFjKnUL2CUqxcn3U90JtMAhPWUB3ItNMHqu01Sf06gvl0qNVT';

const imageQueries = [
  { query: 'push notification phone alert', filename: 'feature-notifications.jpg', size: 'large' },
  { query: 'cybersecurity digital lock', filename: 'feature-security.jpg', size: 'large' },
  { query: 'mobile phone construction site', filename: 'feature-mobile.jpg', size: 'large' },
];

const outputDir = path.join(__dirname, '..', 'public', 'images', 'marketing');

async function searchPexels(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      headers: { 'Authorization': PEXELS_API_KEY }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.photos && json.photos.length > 0 ? json.photos[0] : null);
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
  for (const { query, filename, size } of imageQueries) {
    try {
      console.log(`Searching: "${query}"`);
      const photo = await searchPexels(query);
      if (photo) {
        const imageUrl = photo.src[size] || photo.src.large;
        const filepath = path.join(outputDir, filename);
        console.log(`Downloading: ${filename}`);
        await downloadImage(imageUrl, filepath);
        console.log(`Saved: ${filename}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`No photo found for: "${query}"`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  console.log('Done!');
}
run();
