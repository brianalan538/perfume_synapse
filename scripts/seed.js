const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IMG_DIR = path.join(__dirname, '..', 'downloaded_images');

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno. Creá un archivo .env con:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'categories.json')));
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
  console.log('Categorías insertadas correctamente');

  // 2. Subir imágenes
  const IMG_BUCKET = 'perfumes';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === IMG_BUCKET);
  if (!bucketExists) {
    await supabase.storage.createBucket(IMG_BUCKET, {
      public: true,
    });
    console.log('Bucket "perfumes" creado');
  }

  const perfumes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'perfumes.json')));
  console.log(`Subiendo imágenes de ${perfumes.length} productos...`);

  // Collect all unique image filenames
  const allImages = new Set();
  for (const p of perfumes) {
    if (p.image_url) allImages.add(p.image_url);
    if (p.image_urls) p.image_urls.forEach(u => u && allImages.add(u));
  }

  console.log(`Total imágenes únicas: ${allImages.size}`);
  let uploaded = 0;

  const imgUrlMap = {};
  for (const fname of allImages) {
    process.stdout.write(`\r  Subiendo imagen ${++uploaded}/${allImages.size}...`);
    const publicUrl = await uploadImage(fname);
    if (publicUrl) imgUrlMap[fname] = publicUrl;
  }
  console.log('\nImágenes subidas');

  // 3. Insertar productos con URLs de imágenes actualizadas
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

  const { error: prodError } = await supabase
    .from('products')
    .upsert(productsToInsert, { onConflict: 'id' });

  if (prodError) {
    console.error('Error insertando productos:', prodError.message);
    return;
  }

  console.log(`${perfumes.length} productos insertados correctamente`);
  console.log('¡Migración completada!');
}

main().catch(console.error);
