'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';

export default function CategoryContent({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [search, products]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder={`Buscar en ${products.length} productos...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>

      <p className="text-sm text-gray-500 mb-6">{filtered.length} productos encontrados</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No se encontraron productos. Intentá con otra búsqueda.</p>
        </div>
      )}
    </>
  );
}
