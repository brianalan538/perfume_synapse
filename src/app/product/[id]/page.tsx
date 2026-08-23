import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/data';
import type { Product } from '@/lib/types';
import ProductDetail from './content';

const SITE_URL = 'https://perfume-synapse.vercel.app';

type Props = { params: Promise<{ id: string }> };

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) {
    return { title: 'Producto no encontrado | SYNAPSE DIGITAL' };
  }

  const name = product.brand ? `${product.name} - ${product.brand}` : product.name;
  const title = `${name} | SYNAPSE DIGITAL`;
  const description =
    stripHtml(product.short_description).slice(0, 158) ||
    stripHtml(product.description).slice(0, 158) ||
    `${name}. Fragancias originales seleccionadas por SYNAPSE DIGITAL.`;
  const image = product.image_url || '/og-image.png';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.id}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  let product: Product | null = null;
  try {
    product = await getProductById(numericId);
  } catch {
    product = null;
  }
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
