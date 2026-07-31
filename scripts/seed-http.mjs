import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMG_DIR = path.join(__dirname, '..', 'downloaded_images');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan variables de entorno');
  process.exit(1);
}

async function supabaseFetch(method, pathname, body, prefer) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  };
  if (prefer) headers['Prefer'] = prefer;
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${pathname}: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function uploadImageToStorage(fileName) {
  const filePath = path.join(IMG_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  const fileBuf = fs.readFileSync(filePath);
  const ext = path.extname(fileName) || '.jpg';
  const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const storagePath = `products/${fileName}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/perfumes/${storagePath}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: fileBuf,
  });

  if (!res.ok && res.status !== 409) {
    console.error(`  Error subiendo ${fileName}: ${res.status}`);
    return null;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/perfumes/${storagePath}`;
}

async function main() {
  // 1. Crear bucket si no existe
  console.log('Verificando bucket...');
  const bucketsRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  const buckets = await bucketsRes.json();
  const bucketExists = buckets.some(b => b.name === 'perfumes');

  if (!bucketExists) {
    await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ id: 'perfumes', name: 'perfumes', public: true }),
    });
    console.log('✅ Bucket "perfumes" creado');
  } else {
    console.log('✅ Bucket "perfumes" ya existe');
  }

  // 2. Insertar categorías
  const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'categories.json'), 'utf-8'));
  console.log(`Insertando ${categories.length} categorías...`);

  await supabaseFetch('POST', '/rest/v1/categories', categories.map(c => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
  })), 'resolution=merge-duplicates');
  console.log('✅ Categorías insertadas');

  // 3. Subir imágenes
  const perfumes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'perfumes.json'), 'utf-8'));

  const allImages = new Set();
  for (const p of perfumes) {
    if (p.image_url) allImages.add(p.image_url);
    if (p.image_urls) p.image_urls.forEach(u => u && allImages.add(u));
  }

  console.log(`Subiendo ${allImages.size} imágenes...`);
  const imgUrlMap = {};
  let uploaded = 0;

  for (const fname of allImages) {
    uploaded++;
    const publicUrl = await uploadImageToStorage(fname);
    if (publicUrl) imgUrlMap[fname] = publicUrl;
    process.stdout.write(`\r  [${uploaded}/${allImages.size}] ${fname ? fname.substring(0, 30) : '?'}`);
  }
  console.log(`\n✅ Subidas: ${Object.keys(imgUrlMap).length}`);

  // 4. Insertar productos
  console.log('Insertando productos...');
  const productsToInsert = perfumes.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category_id: p.category_id,
    category_name: p.category_name,
    description: p.description,
    short_description: p.short_description || '',
    price: p.price,
    price_wholesale: p.price_wholesale,
    stock: p.stock || 0,
    volume_ml: p.volume_ml,
    volume_options: JSON.stringify(p.volume_options || []),
    flavor_enabled: p.flavor_enabled || false,
    flavors: JSON.stringify(p.flavors || []),
    image_url: imgUrlMap[p.image_url] || p.image_url,
    image_urls: JSON.stringify((p.image_urls || []).map(u => imgUrlMap[u] || u)),
    is_active: p.is_active !== false,
    created_at: p.created_at,
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    try {
      await supabaseFetch('POST', '/rest/v1/products', batch, 'resolution=merge-duplicates');
      process.stdout.write(`\r  Insertados ${Math.min(i + BATCH_SIZE, productsToInsert.length)}/${productsToInsert.length}...`);
    } catch (e) {
      // Handle conflict - use upsert with PUT
      for (const item of batch) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${item.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify(item),
          });
        } catch {}
      }
    }
  }
  console.log(`\n✅ ${perfumes.length} productos insertados`);
  console.log('🎉 Migración completada');
}

main().catch(console.error);
