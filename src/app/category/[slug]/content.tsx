'use client';

import { useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { calculateSalePrice } from '@/lib/data';
import type { Product } from '@/lib/types';

function effectivePrice(product: Product): number {
  const volumeOption = product.volume_options?.[0];
  const wholesale = volumeOption
    ? (volumeOption.price_wholesale > 0 ? volumeOption.price_wholesale : volumeOption.price)
    : (product.price_wholesale > 0 ? product.price_wholesale : product.price);
  return calculateSalePrice(wholesale);
}

export default function CategoryContent({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    if (sort === 'asc') {
      result = [...result].sort((a, b) => {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);
        return (pa <= 0 ? Infinity : pa) - (pb <= 0 ? Infinity : pb);
      });
    } else if (sort === 'desc') {
      result = [...result].sort((a, b) => {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);
        return (pb <= 0 ? -Infinity : pb) - (pa <= 0 ? -Infinity : pa);
      });
    }
    return result;
  }, [search, sort, products]);

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
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">Ordenar por precio</option>
          <option value="asc">Menor a mayor</option>
          <option value="desc">Mayor a menor</option>
        </select>
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
