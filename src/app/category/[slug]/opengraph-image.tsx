import { getCategoryBySlug, getProductsByCategory } from '@/lib/data';
import { OG_SIZE, pickOgItems, renderOgImage } from '@/lib/og';

export const alt = 'Perfumes originales - SYNAPSE DIGITAL';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);
  const items = await pickOgItems(products);
  const name = category?.name ?? 'Originales';

  return renderOgImage({
    title: `Perfumes ${name}`,
    subtitle: `${products.length} fragancias disponibles`,
    items,
  });
}
