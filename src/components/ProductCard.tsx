'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, MessageCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { calculateSalePrice } from '@/lib/data';
import { useCart } from '@/store/cart';

const PHONE = '595985798538';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCart(s => s.addItem);
  const [addedId, setAddedId] = useState<number | null>(null);

  const imgSrc = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `/images/${product.image_url}`)
    : '/placeholder.svg';

  const volumeOption = product.volume_options?.[0] ?? null;
  const wholesale = volumeOption
    ? (volumeOption.price_wholesale > 0 ? volumeOption.price_wholesale : volumeOption.price)
    : (product.price_wholesale > 0 ? product.price_wholesale : product.price);
  const price = calculateSalePrice(wholesale);
  const isConsult = price <= 0;

  const consultMessage = encodeURIComponent(
    `¡Hola! Quiero consultar por el precio de:\n\n${product.name}${product.brand ? ` - ${product.brand}` : ''}\n\n¿Está disponible?`
  );

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      name: product.name,
      brand: product.brand,
      price,
      quantity: 1,
      image_url: product.image_url,
      selected_volume: volumeOption,
      selected_flavor: null,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <div className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#7c3aed]/20 transition-all relative">
      <Link
        href={`/product/${product.id}`}
        className="block"
      >
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          {product.brand && (
            <span className="absolute top-2 left-2 bg-[#7c3aed] text-white text-xs font-medium px-2 py-1 rounded">
              {product.brand}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
          <div>
            {isConsult ? (
              <a
                href={`https://wa.me/${PHONE}?text=${consultMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-lg font-bold text-[#7c3aed] hover:underline"
              >
                Consultar
              </a>
            ) : (
              <span className="text-lg font-bold text-[#7c3aed]">{price.toLocaleString()} Gs.</span>
            )}
          </div>
        </div>
      </Link>
      {isConsult ? (
        <a
          href={`https://wa.me/${PHONE}?text=${consultMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-md"
          title="Consultar por WhatsApp"
        >
          <MessageCircle size={16} />
        </a>
      ) : (
        <button
          onClick={handleQuickAdd}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center hover:bg-[#6d28d9] transition-colors shadow-md"
          title="Agregar al carrito"
        >
          {addedId === product.id ? <Check size={16} /> : <ShoppingCart size={16} />}
        </button>
      )}
    </div>
  );
}
