// Reporte de stock del proveedor (SOLO uso interno, no se usa en la web).
// Muestra por perfume el stock actual del proveedor y lo agrupa por nivel.
// Uso: node scripts/stock-report.js
const https = require('https');

const API_BASE = 'https://www.cosmeking-py.com';
const PERFUME_CATEGORY_IDS = [1, 2, 3];

// Umbrales de stock del proveedor
const AGOTADO_MAX = 0;    // 0 = agotado
const BAJO_MAX = 5;       // 1-5
const MEDIO_MAX = 12;     // 6-12
const BUENO_MAX = Infinity; // 13+

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

function getProductStock(p) {
  const vols = Array.isArray(p.volume_options) ? p.volume_options : [];
  const s = Number(p.stock);
  const totalVols = vols.reduce((acc, v) => acc + Number(v.stock || 0), 0);
  return { main: s, vols: totalVols, max: Math.max(s, totalVols) };
}

async function main() {
  const allProducts = await fetchJSON(`${API_BASE}/public/products`);
  const perfumes = allProducts.filter(p => PERFUME_CATEGORY_IDS.includes(Number(p.category_id)));

  const rows = perfumes.map(p => {
    const st = getProductStock(p);
    let nivel;
    if (st.max <= AGOTADO_MAX) nivel = 'AGOTADO';
    else if (st.max <= BAJO_MAX) nivel = 'BAJO';
    else if (st.max <= MEDIO_MAX) nivel = 'MEDIO';
    else nivel = 'BUENO';
    return { id: Number(p.id), name: p.name, brand: p.brand || '', stock: st.max, stockMain: st.main, stockVols: st.vols, nivel };
  });

  const order = { AGOTADO: 0, BAJO: 1, MEDIO: 2, BUENO: 3 };
  rows.sort((a, b) => order[a.nivel] - order[b.nivel] || b.stock - a.stock);

  const group = (label) => {
    const list = rows.filter(r => r.nivel === label);
    console.log(`\n${label} (${list.length})`);
    for (const r of list) {
      console.log(`  id=${r.id} | ${r.name.trim().slice(0, 38)} | stock ${r.stock}${r.stockVols !== r.stockMain && r.stockVols > 0 ? ` (vols ${r.stockVols})` : ''}`);
    }
  };

  console.log('===================== STOCK PROVEEDOR (SOLO INTERNO) =====================');
  console.log(`Perfumes totales: ${perfumes.length}`);
  group('AGOTADO');
  group('BAJO');
  group('MEDIO');
  group('BUENO');

  console.log('\n================ RESUMEN =================');
  for (const l of ['AGOTADO', 'BAJO', 'MEDIO', 'BUENO']) {
    console.log(`${l}: ${rows.filter(r => r.nivel === l).length}`);
  }
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
