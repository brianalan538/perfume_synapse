// Módulo compartido de precios.
// Fuente de verdad: src/lib/data.ts (calculateSalePrice + regla del primer volumen).
// TODOS los scripts deben usar este módulo para no desincronizarse con la app.

const MIN_MARKUP = 50000;
const MAX_MARKUP = 100000;

// Igual que src/lib/data.ts:calculateSalePrice
function calculateSalePrice(wholesale) {
  if (wholesale <= 0) return 0;
  const ratio = Math.min(1, wholesale / 300000);
  const markup = Math.round(MIN_MARKUP + ratio * (MAX_MARKUP - MIN_MARKUP));
  const raw = wholesale + markup;
  return Math.round(raw / 5000) * 5000;
}

function numOrZero(v) {
  return v == null ? 0 : Number(v);
}

// Devuelve el costo base que la app usa para mostrar el precio.
// Orden (igual que ProductCard.tsx y product/[id]/page.tsx):
//   1) volume_options[0].price_wholesale si > 0
//   2) product.price_wholesale si > 0
//   3) product.price (fallback)
function getBaseWholesale(product) {
  let vols = product.volume_options;
  if (typeof vols === 'string') {
    try { vols = JSON.parse(vols); } catch { vols = []; }
  }
  const v0 = (Array.isArray(vols) ? vols : [])[0];
  if (v0 && numOrZero(v0.price_wholesale) > 0) return numOrZero(v0.price_wholesale);
  if (numOrZero(product.price_wholesale) > 0) return numOrZero(product.price_wholesale);
  return numOrZero(product.price);
}

// Precio de venta que la app muestra para el producto (basado en su primer volumen).
function getDisplayPrice(product) {
  return calculateSalePrice(getBaseWholesale(product));
}

// Reconstruye volume_options con precios recalculados.
// Preserva ml/stock, toma price_wholesale existente (o el provisto) y recalcula price.
function recalcVolumeOptions(product, fallbackWholesale) {
  let vols = product.volume_options;
  if (typeof vols === 'string') {
    try { vols = JSON.parse(vols); } catch { vols = []; }
  }
  if (!Array.isArray(vols)) vols = [];
  const fb = numOrZero(fallbackWholesale);
  return vols.map(v => {
    const w = numOrZero(v.price_wholesale) > 0 ? numOrZero(v.price_wholesale) : (fb > 0 ? fb : numOrZero(v.price));
    return {
      ml: numOrZero(v.ml),
      price: calculateSalePrice(w),
      price_wholesale: w > 0 ? w : null,
      stock: numOrZero(v.stock),
    };
  });
}

// Costo de venta unitario (lo que el proveedor cobra): price_wholesale ?? price.
function getProviderCost(p) {
  return numOrZero(p.price_wholesale ?? p.price);
}

module.exports = {
  MIN_MARKUP,
  MAX_MARKUP,
  calculateSalePrice,
  getBaseWholesale,
  getDisplayPrice,
  recalcVolumeOptions,
  getProviderCost,
  numOrZero,
};