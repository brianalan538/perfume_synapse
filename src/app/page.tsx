import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allProducts = await getProducts();
  const categories = await getCategories();
  const featured = allProducts.slice(0, 8);

  return (
    <div>
      <section className="relative bg-gray-900 text-white bg-cover bg-center" style={{ backgroundImage: "url('https://efwdhmhuwgtmfaqbomnl.supabase.co/storage/v1/object/public/perfumes/hero-bg.jpg')" }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">SYNAPSE DIGITAL</h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Descubrí nuestra colección exclusiva de perfumes árabes originales
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Ver Catálogo
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-[#0f0f1a] mb-8">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="bg-white border border-gray-100 rounded-xl p-6 text-center hover:shadow-md hover:border-[#7c3aed]/30 hover:bg-[#faf5ff] transition-all"
            >
              <h3 className="font-semibold text-[#0f0f1a]">{cat.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{allProducts.filter(p => p.category_id === cat.id).length} productos</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#f5f3ff] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#0f0f1a]">Perfumes Destacados</h2>
            <Link href="/products" className="text-sm font-medium text-[#7c3aed] underline hover:no-underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
