import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculateSalePrice, convertWholesale } = require('./pricing.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = 'https://www.cosmeking-py.com';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan variables de entorno');
  process.exit(1);
}

const TARGET_IDS = [350, 351, 352, 353, 354, 355, 282, 130];
const CATEGORY_NAMES = { 1: 'Masculinos', 2: 'Femeninos', 3: 'Unisex' };

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

async function uploadImage(url) {
  try {
    if (!url) throw new Error('sin imagen');
    const absolute = /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`;
    const name = path.basename(new URL(absolute).pathname);
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'img.jpg';
    const storagePath = `products/${Date.now()}_${safeName}`;
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    const imgRes = await fetch(absolute);
    if (!imgRes.ok) throw new Error(`descarga ${url}: ${imgRes.status}`);
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/perfumes/${storagePath}`;
    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: imgBuf,
    });
    if (!upRes.ok) throw new Error(`upload storage: ${upRes.status}`);
    return `${SUPABASE_URL}/storage/v1/object/public/perfumes/${storagePath}`;
  } catch (e) {
    console.error(`  [img fallback] ${e.message} -> usando URL original`);
    return url;
  }
}

const providerRes = await fetch(`${API_BASE}/public/products`);
const allProducts = await providerRes.json();
const targets = allProducts.filter(p => TARGET_IDS.includes(Number(p.id)));
console.log(`Encontrados en proveedor: ${targets.length}`);

for (const p of targets) {
  const wholesaleCost = p.price_wholesale != null && Number(p.price_wholesale) > 0 ? convertWholesale(Number(p.price_wholesale)) : null;
  const isConsult = wholesaleCost == null;
  const salePrice = wholesaleCost == null ? 0 : calculateSalePrice(wholesaleCost);

  const volume_options = (p.volume_options || []).map(v => {
    const vRaw = v.price_wholesale != null && Number(v.price_wholesale) > 0 ? Number(v.price_wholesale) : null;
    const vCost = vRaw == null ? null : convertWholesale(vRaw);
    return {
      ml: Number(v.ml) || 100,
      price: vCost == null ? 0 : Number(calculateSalePrice(vCost)),
      price_wholesale: vCost == null ? null : vCost,
      stock: Number(v.stock) || 0,
    };
  });

  const image = await uploadImage(p.image_url || p.image_urls?.[0]);

  const payload = {
    id: Number(p.id),
    name: (p.name || '').trim(),
    brand: (p.brand || '').trim() || null,
    category_id: p.category_id,
    category_name: CATEGORY_NAMES[p.category_id] || p.category_name,
    description: p.description || '',
    short_description: (p.short_description || p.short_description || '').trim(),
    price: salePrice,
    price_wholesale: wholesaleCost,
    stock: Number(p.stock) || 0,
    volume_ml: p.volume_ml ?? null,
    volume_options: JSON.stringify(volume_options),
    flavor_enabled: Boolean(p.flavor_enabled),
    flavors: JSON.stringify(p.flavors || []),
    image_url: image,
    image_urls: JSON.stringify([image]),
    is_active: true,
  };

  const existing = await supabaseFetch('GET', `/rest/v1/products?id=eq.${payload.id}&select=id`);
  if (existing.length) {
    await supabaseFetch('PATCH', `/rest/v1/products?id=eq.${payload.id}`, payload);
    console.log(`[ACTUALIZADO] id=${payload.id} ${payload.name}`);
  } else {
    await supabaseFetch('POST', '/rest/v1/products', payload);
    console.log(`[INSERTADO] id=${payload.id} ${payload.name}`);
  }
  console.log(`   ${isConsult ? 'CONSULTAR' : `costo ${wholesaleCost} -> venta ${salePrice}`} | imagen: ${image}`);
}

console.log('OK');