// Sincroniza TODOS los precios con el proveedor (subidas y bajadas).
// Aplica CARGO el costo del proveedor en price_wholesale y volume_options[].price_wholesale,
// recalcula price (campo de reporte) y volume_options[].price con la fórmula actual de
// scripts/pricing.js (markup 50.000-100.000 Gs). También actualiza stock.
const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');
const https = require('https');
const {
  calculateSalePrice,
  getProviderCost,
  getBaseWholesale,
  getDisplayPrice,
  numOrZero,
} = require('./pricing');

const API_BASE = 'https://www.cosmeking-py.com';
const PERFUME_CATEGORY_IDS = [1, 2, 3];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
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

function parseVols(raw) {
  let vols = raw;
  if (typeof vols === 'string') {
    try { vols = JSON.parse(vols); } catch { vols = []; }
  }
  return Array.isArray(vols) ? vols : [];
}

function buildVolumeOptions(dbVols, providerVols, fallbackWholesale) {
  const provByMl = new Map((providerVols || []).map(v => [Number(v.ml), v]));
  if (dbVols.length) {
    return dbVols.map(v => {
      const ml = Number(v.ml);
      const pv = provByMl.get(ml);
      const volWholesale = pv ? numOrZero(pv.price_wholesale) : 0;
      const volCost = volWholesale > 0 ? volWholesale : fallbackWholesale;
      return {
        ml,
        price: calculateSalePrice(volCost),
        price_wholesale: volCost > 0 ? volCost : null,
        stock: pv ? numOrZero(pv.stock) : numOrZero(v.stock),
      };
    });
  }
  return (providerVols || []).map(v => {
    const volWholesale = numOrZero(v.price_wholesale);
    const volCost = volWholesale > 0 ? volWholesale : fallbackWholesale;
    return {
      ml: Number(v.ml),
      price: calculateSalePrice(volCost),
      price_wholesale: volCost > 0 ? volCost : null,
      stock: numOrZero(v.stock),
    };
  });
}

async function main() {
  console.log('1) Descargando productos del proveedor...');
  const allProducts = await fetchJSON(`${API_BASE}/public/products`);
  const provider = allProducts.filter(p => PERFUME_CATEGORY_IDS.includes(Number(p.category_id)));
  console.log(`   - Proveedor: ${allProducts.length} total, ${provider.length} perfumes`);

  const { data: db, error } = await supabase
    .from('products')
    .select('id,name,price,price_wholesale,volume_options,stock,is_active');
  if (error) { console.error('   DB read error:', error.message); process.exit(1); }
  const dbById = new Map(db.map(p => [Number(p.id), p]));
  console.log(`   - Supabase: ${db.length} productos`);

  const updated = [];
  const unchanged = [];
  const skippedNoCost = [];
  const noMatch = [];

  for (const p of provider) {
    const d = dbById.get(Number(p.id));
    if (!d) { continue; }

    const newCost = getProviderCost(p);
    if (newCost <= 0) {
      skippedNoCost.push({ id: p.id, name: p.name });
      continue;
    }

    const newVols = buildVolumeOptions(parseVols(d.volume_options), p.volume_options, newCost);
    const displayWholesale = (newVols[0] && numOrZero(newVols[0].price_wholesale) > 0)
      ? numOrZero(newVols[0].price_wholesale) : newCost;
    const newPrice = calculateSalePrice(displayWholesale);

    const oldCost = getBaseWholesale(d);
    const oldPrice = numOrZero(d.price);
    const oldVolsStr = JSON.stringify(parseVols(d.volume_options));
    const newVolsStr = JSON.stringify(newVols);

    const costChanged = oldCost !== newCost || oldPrice !== newPrice || oldVolsStr !== newVolsStr || numOrZero(d.stock) !== numOrZero(p.stock);

    if (costChanged) {
      const { error: uerr } = await supabase
        .from('products')
        .update({
          price: newPrice,
          price_wholesale: newCost,
          volume_options: newVols,
          stock: numOrZero(p.stock),
        })
        .eq('id', p.id);
      if (uerr) {
        console.error(`   ERROR id=${p.id} ${p.name}: ${uerr.message}`);
        continue;
      }
      const dir = newCost > oldCost ? 'SUBIO' : (newCost < oldCost ? 'BAJO' : '=');
      updated.push({ id: p.id, name: p.name, dir, oldCost, newCost, oldPrice, newPrice });
    } else {
      unchanged.push({ id: p.id, name: p.name });
    }
  }

  for (const d of db) {
    if (!provider.some(x => Number(x.id) === Number(d.id))) noMatch.push(d);
  }

  console.log('\n===================== APLICADO =====================');
  console.log(`Actualizados en DB: ${updated.length} | Ya consistentes: ${unchanged.length}`);
  for (const x of updated) {
    console.log(`  [${x.dir}] id=${x.id} | ${x.name.trim().slice(0, 35)} | costo ${x.oldCost} -> ${x.newCost} | venta ${x.oldPrice} -> ${x.newPrice}`);
  }

  console.log(`\nSin costo en proveedor (NO tocados): ${skippedNoCost.length}`);
  for (const s of skippedNoCost) console.log(`  [SKIP] id=${s.id} | ${s.name}`);

  console.log(`\nEn Supabase sin match en proveedor (NO tocados): ${noMatch.length}`);
  for (const r of noMatch) console.log(`  [SIN MATCH] id=${r.id} | ${r.name.trim().slice(0, 35)}`);

  console.log('\nDONE');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });