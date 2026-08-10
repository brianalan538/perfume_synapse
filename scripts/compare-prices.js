const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');
const https = require('https');
const { getProviderCost, getBaseWholesale, getDisplayPrice } = require('./pricing');

const API_BASE = 'https://www.cosmeking-py.com';
const PERFUME_CATEGORY_IDS = [1, 2, 3];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno. Ejecutá con:');
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL="..."');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="..."');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: { WebSocket }, params: { eventsPerSecond: 0 } },
});

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

async function main() {
  console.log('1) Descargando productos del proveedor...');
  const allProducts = await fetchJSON(`${API_BASE}/public/products`);
  const perfumes = allProducts.filter(p => PERFUME_CATEGORY_IDS.includes(Number(p.category_id)));
  console.log(`   - Proveedor: ${allProducts.length} productos, ${perfumes.length} perfumes (cat 1,2,3)`);

  const byId = new Map();
  for (const p of perfumes) byId.set(Number(p.id), p);

  console.log('2) Descargando productos de Supabase (precio de costo)...');
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, price, price_wholesale, volume_options');

  if (error) {
    console.error('Error al leer Supabase:', error.message);
    process.exit(1);
  }

  const dbById = new Map();
  for (const p of dbProducts || []) dbById.set(Number(p.id), p);

  console.log(`   - Supabase: ${dbProducts.length} productos`);

  const productsNew = [];
  const costChanges = [];
  const consultaEnContra = [];
  const removed = [];

  for (const provider of perfumes) {
    const db = dbById.get(Number(provider.id));

    if (!db) {
      productsNew.push(provider);
      continue;
    }

    // Compara el costo base que usa la app contra el costo del proveedor.
    const pCost = getProviderCost(provider);
    const dbCost = getBaseWholesale(db);
    if (dbCost <= 0) {
      consultaEnContra.push({
        id: provider.id,
        name: provider.name,
        brand: provider.brand || null,
        costo_proveedor: pCost,
        costo_supabase: 0,
      });
    } else if (pCost !== dbCost) {
      costChanges.push({
        id: provider.id,
        name: provider.name,
        brand: provider.brand || null,
        costo_proveedor: pCost,
        costo_supabase: dbCost,
        venta_supabase: getDisplayPrice(db),
        diferencia: pCost - dbCost,
      });
    }
  }

  for (const db of dbProducts || []) {
    if (!byId.has(Number(db.id))) {
      removed.push(db);
    }
  }

  console.log('\n===================== REPORTE =====================');
  console.log(`Productos NUEVOS en el proveedor: ${productsNew.length}`);
  for (const p of productsNew) {
    console.log(`  [NUEVO] id=${p.id} | ${p.name} | ${p.brand || 'sin marca'} | costo: ${p.price_wholesale ?? p.price}`);
  }

  console.log(`\nProductos con CAMBIO de costo: ${costChanges.length}`);
  for (const c of costChanges) {
    const dir = c.diferencia > 0 ? 'SUBIO' : (c.diferencia < 0 ? 'BAJO' : '=');
    console.log(`  [${dir}] id=${c.id} | ${c.name} | proveedor ${c.costo_proveedor} vs supabase ${c.costo_supabase} (${c.diferencia > 0 ? '+' : ''}${c.diferencia})`);
  }

  console.log(`\nProductos en Supabase pero SIN match en el proveedor: ${removed.length}`);
  for (const r of removed.slice(0, 50)) {
    console.log(`  [SIN MATCH] id=${r.id} | ${r.name} | costo supabase: ${r.price_wholesale}`);
  }
  if (removed.length > 50) console.log(`  ... y ${removed.length - 50} más`);

  console.log(`\nProductos SIN PRECIO en nuestro catálogo (CONSULTAR): ${consultaEnContra.length}`);
  for (const c of consultaEnContra) {
    console.log(`  [CONSULTA] id=${c.id} | ${c.name} | proveedor marca: ${c.costo_proveedor}`);
  }

  console.log('\n================ RESUMEN =================');
  console.log(`Nuevos: ${productsNew.length} | Cambios de costo: ${costChanges.length} | Sin match: ${removed.length} | En consulta: ${consultaEnContra.length}`);
}

main().catch(console.error);