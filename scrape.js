const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const API_BASE = 'https://www.cosmeking-py.com';
const IMG_DIR = path.join(__dirname, 'downloaded_images');
const PERFUME_CATEGORIES = [1, 2, 3]; // Masculinos, Femeninos, Unisex

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    if (!url || url === '') return resolve(null);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', () => resolve(null));
  });
}

function getImgUrl(imgPath) {
  if (!imgPath) return null;
  if (imgPath.startsWith('http')) return imgPath;
  if (imgPath.startsWith('/')) return `${API_BASE}${imgPath}`;
  return `${API_BASE}/${imgPath}`;
}

async function main() {
  console.log('Fetching products...');
  const allProducts = await fetchJSON(`${API_BASE}/public/products`);
  console.log(`Total products: ${allProducts.length}`);

  console.log('Fetching categories...');
  const categories = await fetchJSON(`${API_BASE}/public/categories`);
  fs.writeFileSync(path.join(__dirname, 'categories.json'), JSON.stringify(categories, null, 2));
  console.log(`Categories saved: ${categories.length}`);

  // Filter perfumes (categories 1,2,3)
  const perfumes = allProducts.filter(p => PERFUME_CATEGORIES.includes(p.category_id));
  console.log(`Perfume products: ${perfumes.length}`);

  // Collect all unique image URLs
  const allImageUrls = new Set();
  for (const p of perfumes) {
    if (p.image_url) allImageUrls.add(getImgUrl(p.image_url));
    if (p.image_urls && Array.isArray(p.image_urls)) {
      for (const u of p.image_urls) {
        if (u) allImageUrls.add(getImgUrl(u));
      }
    }
  }
  console.log(`Total unique images to download: ${allImageUrls.size}`);

  // Download images
  let downloaded = 0;
  const imgMap = {};
  let i = 0;
  for (const url of allImageUrls) {
    i++;
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const filename = `img_${String(i).padStart(4, '0')}${ext}`;
    const dest = path.join(IMG_DIR, filename);
    console.log(`[${i}/${allImageUrls.size}] Downloading: ${url}`);
    const result = await downloadImage(url, dest);
    if (result) {
      imgMap[url] = filename;
      downloaded++;
    } else {
      console.log(`  FAILED: ${url}`);
      imgMap[url] = null;
    }
  }
  console.log(`Downloaded ${downloaded}/${allImageUrls.size} images`);

  // Build final product data with local image paths
  const finalProducts = perfumes.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand || null,
    category_id: p.category_id,
    category_name: p.category_name,
    description: p.description || '',
    short_description: p.short_description || '',
    price: p.price,
    price_wholesale: p.price_wholesale,
    stock: p.stock || 0,
    volume_ml: p.volume_ml || null,
    volume_options: p.volume_options || [],
    flavor_enabled: p.flavor_enabled || false,
    flavors: p.flavors || [],
    image_url: imgMap[getImgUrl(p.image_url)] || null,
    image_urls: (p.image_urls || []).map(u => imgMap[getImgUrl(u)] || null).filter(Boolean),
    is_active: p.is_active !== false,
    created_at: p.created_at
  }));

  fs.writeFileSync(path.join(__dirname, 'perfumes.json'), JSON.stringify(finalProducts, null, 2));
  fs.writeFileSync(path.join(__dirname, 'perfumes_compact.json'), JSON.stringify(finalProducts));
  console.log(`Saved ${finalProducts.length} perfumes to perfumes.json`);
  console.log('Done!');
}

main().catch(console.error);
