import type { MetadataRoute } from 'next';
import { getProducts, getCategories } from '@/lib/data';

const SITE_URL = 'https://perfume-synapse.vercel.app';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map(c => ({
      url: `${SITE_URL}/category/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map(p => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
