import { getProducts } from '@/lib/data';
import { OG_SIZE, pickOgItems, renderOgImage } from '@/lib/og';

export const alt = 'Catálogo de perfumes - SYNAPSE DIGITAL';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Image() {
  const products = await getProducts();
  const items = await pickOgItems(products);

  return renderOgImage({
    title: 'Catálogo de Perfumes',
    subtitle: `${products.length} fragancias disponibles`,
    items,
  });
}
