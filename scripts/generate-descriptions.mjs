import fs from 'fs';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd2RobWh1d2d0bWZhcWJvbW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTM1NTYsImV4cCI6MjEwMDg4OTU1Nn0.QFZuxorr_3E-oLySPP-QwHa_04BKJauOl6NfmrVJCqQ';

const FAMILIAS_MASC = [
  'Amaderada Especiada', 'Cítrica Aromática', 'Oriental Amaderada',
  'Fougère Aromática', 'Ámbar Especiada', 'Acuática Fresca',
  'Leñosa Almizclada', 'Verde Aromática', 'Cuero Especiado',
];
const FAMILIAS_FEM = [
  'Floral Afrutada', 'Oriental Dulce', 'Floreal Almizclada',
  'Cítrica Floral', 'Amaderada Dulce', 'Gourmand Vainillada',
  'Polvada Floral', 'Acuática Floral', 'Ámbar Floral',
];
const FAMILIAS_UNI = [
  'Cítrica Aromática', 'Oriental Fresca', 'Amaderada Acuática',
  'Floral Verde', 'Ámbar Almizclada', 'Especiada Dulce',
];

const NOTAS_MASC = [
  ['bergamota', 'lavanda', 'pimienta negra', 'nuez moscada'],
  ['sándalo', 'cedro', 'ámbar', 'vainilla'],
  ['limón', 'toronja', 'menta', 'romero'],
  ['cuero', 'tabaco', 'vetiver', 'pachulí'],
];
const NOTAS_FEM = [
  ['jazmín', 'rosa', 'lirio', 'violeta'],
  ['vainilla', 'almizcle', 'ámbar', 'sándalo'],
  ['frutos rojos', 'melocotón', 'pera', 'cítricos'],
  ['caramelo', 'vainilla', 'almendra', 'cacao'],
];
const NOTAS_UNI = [
  ['bergamota', 'té verde', 'jazmín', 'almizcle'],
  ['cítricos', 'jengibre', 'madera de cedro', 'ámbar'],
  ['lavanda', 'romero', 'vetiver', 'pachulí'],
];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDescription(product) {
  const name = (product.name || '').trim().replace(/'/g, "''");
  const brand = (product.brand || '').trim().replace(/'/g, "''");
  const cat = product.category_id;

  let familia, notas;
  let tipo = 'Unisex';

  if (cat === 1) {
    familia = random(FAMILIAS_MASC);
    notas = random(NOTAS_MASC);
    tipo = 'Masculino';
  } else if (cat === 2) {
    familia = random(FAMILIAS_FEM);
    notas = random(NOTAS_FEM);
    tipo = 'Femenino';
  } else {
    familia = random(FAMILIAS_UNI);
    notas = random(NOTAS_UNI);
  }

  const title = brand ? `${name} – ${brand}` : name;

  return `<p><strong>${title}</strong></p>
<ul>
<li><strong>Tipo:</strong> ${tipo}</li>
<li><strong>Familia Olfativa:</strong> ${familia}</li>
<li><strong>Notas:</strong> ${notas[0]}, ${notas[1]}, ${notas[2]}, ${notas[3]}</li>
<li><strong>Duración:</strong> Alta</li>
<li><strong>Proyección:</strong> Moderada a Alta</li>
</ul>`;
}

async function main() {
  const res = await fetch('https://efwdhmhuwgtmfaqbomnl.supabase.co/rest/v1/products?select=id,name,brand,category_id,description', {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  const products = await res.json();

  const toUpdate = products.filter(p => !p.description || (!p.description.includes('<br>') && !p.description.includes('<li>') && !p.description.includes('</p>')));
  console.log(`Total: ${products.length}, a actualizar: ${toUpdate.length}`);

  let sql = '-- Descripciones generadas\n\n';
  for (const p of toUpdate) {
    const desc = generateDescription(p);
    const descEscaped = desc.replace(/'/g, "''");
    sql += `UPDATE products SET description = '${descEscaped}' WHERE id = ${p.id};\n`;
  }

  fs.writeFileSync('update_descripciones.sql', sql);
  console.log(`SQL generado: ${toUpdate.length} UPDATEs en update_descripciones.sql`);
  console.log('Ejecutalo en el SQL Editor de Supabase.');
}

main().catch(console.error);
