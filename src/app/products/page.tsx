import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsContent from './content';
import { getProducts, getCategories } from '@/lib/data';

const SITE_URL = 'https://perfume-synapse.vercel.app';
const TITLE = 'Catálogo de Perfumes | SYNAPSE DIGITAL';
const DESCRIPTION =
  'Explorá nuestro catálogo de perfumes originales: árabes, de diseñador y nicho. Envíos a todo Paraguay.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    type: 'website',
    siteName: 'SYNAPSE DIGITAL',
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/products`,
    locale: 'es_PY',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center"><p className="text-gray-500">Cargando...</p></div>}>
      <ProductsContent initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
