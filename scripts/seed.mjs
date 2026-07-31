import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMG_DIR = path.join(__dirname, '..', 'downloaded_images');

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno. Creá un archivo .env con:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  transport: { WebSocket },
  realtime: { params: { eventsPerSecond: 0 } },
});

async function uploadImage(fileName) {
  const filePath = path.join(IMG_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  const fileBuf = fs.readFileSync(filePath);
  const ext = path.extname(fileName) || '.jpg';
  const storagePath = `products/${fileName}`;

  const { error } = await supabase.storage
    .from('perfumes')
    .upload(storagePath, fileBuf, {
      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error(`Error subiendo ${fileName}:`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('perfumes')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

async function main() {
  // 1. Insertar categorías
  const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'categories.json'), 'utf-8'));
  console.log(`Insertando ${categories.length} categorías...`);

  const { error: catError } = await supabase
    .from('categories')
    .upsert(categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
    })), { onConflict: 'id' });

  if (catError) {
    console.error('Error insertando categorías:', catError.message);
    return;
  }
  console.log('✅ Categorías insertadas');

  // 2. Crear bucket y subir imágenes
  const IMG_BUCKET = 'perfumes';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === IMG_BUCKET);
  if (!bucketExists) {
    await supabase.storage.createBucket(IMG_BUCKET, { public: true });
    console.log('✅ Bucket "perfumes" creado');
  }

  const perfumes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'perfumes.json'), 'utf-8'));

  const allImages = new Set();
  for (const p of perfumes) {
    if (p.image_url) allImages.add(p.image_url);
    if (p.image_urls) p.image_urls.forEach(u => u && allImages.add(u));
  }

  console.log(`Subiendo ${allImages.size} imágenes...`);
  const imgUrlMap = {};
  let uploaded = 0;
  const total = allImages.size;

  for (const fname of allImages) {
    uploaded++;
    process.stdout.write(`\r  [${uploaded}/${total}]...`);
    const publicUrl = await uploadImage(fname);
    if (publicUrl) imgUrlMap[fname] = publicUrl;
  }
  console.log(`\n✅ Imágenes subidas: ${Object.keys(imgUrlMap).length}`);

  // 3. Insertar productos con URLs actualizadas
  console.log('Insertando productos...');
  const productsToInsert = perfumes.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category_id: p.category_id,
    category_name: p.category_name,
    description: p.description,
    short_description: p.short_description,
    price: p.price,
    price_wholesale: p.price_wholesale,
    stock: p.stock,
    volume_ml: p.volume_ml,
    volume_options: JSON.stringify(p.volume_options),
    flavor_enabled: p.flavor_enabled,
    flavors: JSON.stringify(p.flavors),
    image_url: imgUrlMap[p.image_url] || p.image_url,
    image_urls: JSON.stringify((p.image_urls || []).map(u => imgUrlMap[u] || u)),
    is_active: p.is_active,
    created_at: p.created_at,
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error lote ${i}:`, error.message);
      return;
    }
    process.stdout.write(`\r  Insertados ${Math.min(i + BATCH_SIZE, productsToInsert.length)}/${productsToInsert.length}...`);
  }

  console.log(`\n✅ ${perfumes.length} productos insertados`);
  console.log('🎉 Migración completada');
}

main().catch(console.error);
