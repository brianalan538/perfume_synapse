// Sincroniza el campo price (y volume_options[].price) de la BD
// con el precio que la app realmente muestra (calculado desde el costo base).
// Uso: evita que el campo price quede desactualizado y confunda reportes/lecturas.
const { createClient } = require('@supabase/supabase-js');
const { WebSocket } = require('ws');
const { getBaseWholesale, getDisplayPrice, recalcVolumeOptions, numOrZero } = require('./pricing');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: { WebSocket }, params: { eventsPerSecond: 0 } },
});

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, price_wholesale, volume_options, is_active')
    .eq('is_active', true)
    .order('id');

  if (error) {
    console.error('Error leyendo productos:', error.message);
    process.exit(1);
  }

  let updated = 0;
  let upToDate = 0;

  for (const p of products) {
    const displayPrice = getDisplayPrice(p);
    const wholesaleBase = getBaseWholesale(p);

    // Recalcular volumenes: usa wholesale existente por volumen (o el base del producto)
    const newVols = recalcVolumeOptions(p, wholesaleBase);

    const oldVolsStr = typeof p.volume_options === 'string' ? p.volume_options : JSON.stringify(p.volume_options);
    const newVolsStr = JSON.stringify(newVols);

    const priceChanged = numOrZero(p.price) !== displayPrice;
    const volsChanged = oldVolsStr !== newVolsStr;

    if (priceChanged || volsChanged) {
      const { error: uerr } = await supabase
        .from('products')
        .update({ price: displayPrice, volume_options: newVols })
        .eq('id', p.id);
      if (uerr) console.error(`  ERROR id=${p.id} ${p.name}: ${uerr.message}`);
      else {
        updated++;
        console.log(`  OK id=${p.id} | ${p.name.trim().slice(0,35)} | costo ${wholesaleBase} -> venta ${displayPrice}`);
      }
    } else {
      upToDate++;
    }
  }

  console.log(`\nActualizados: ${updated} | Ya consistentes: ${upToDate}`);
  console.log('DONE');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });