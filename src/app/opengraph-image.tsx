import { getProducts } from '@/lib/data';
import { OG_SIZE, pickOgItems, renderOgImage } from '@/lib/og';

export const alt = 'SYNAPSE DIGITAL - Perfumes originales';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Image() {
  const products = await getProducts();
  const items = await pickOgItems(products);

  return renderOgImage({
    title: 'Perfumes Originales',
    subtitle: 'Fragancias árabes y de diseñador seleccionadas',
    items,
  });
}
