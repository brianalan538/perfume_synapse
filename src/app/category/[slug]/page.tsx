import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CategoryContent from './content';
import { getCategoryBySlug, getProductsByCategory } from '@/lib/data';

const SITE_URL = 'https://perfume-synapse.vercel.app';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) {
    return { title: 'Categoría no encontrada | SYNAPSE DIGITAL' };
  }

  const name = category.name;
  const title = `Perfumes ${name} | SYNAPSE DIGITAL`;
  const description = `Descubrí ${products.length} perfumes ${name.toLowerCase()} originales en SYNAPSE DIGITAL. Envíos a todo Paraguay.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
    openGraph: {
      type: 'website',
      siteName: 'SYNAPSE DIGITAL',
      title,
      description,
      url: `${SITE_URL}/category/${slug}`,
      locale: 'es_PY',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, catProducts] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
        <Link href="/products" className="text-gray-900 underline">Ver todos los productos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/products" className="text-sm text-gray-500 hover:text-[#7c3aed] flex items-center gap-1 mb-2">
          <ChevronLeft size={16} />
          Todos los productos
        </Link>
        <h1 className="text-3xl font-bold text-[#0f0f1a]">{category.name}</h1>
        <p className="text-gray-500 mt-1">{catProducts.length} productos</p>
      </div>

      <CategoryContent products={catProducts} />

      {catProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No hay productos en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
