'use client';

import { useState } from 'react';
import { ShoppingCart, ChevronLeft, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { calculateSalePrice } from '@/lib/data';
import { useCart } from '@/store/cart';
import { track } from '@vercel/analytics';
import type { Product, VolumeOption } from '@/lib/types';

const PHONE = '595985798538';

export default function ProductDetail({ product }: { product: Product }) {
  const addItem = useCart(s => s.addItem);
  const [selectedVolume, setSelectedVolume] = useState<VolumeOption | null>(
    product.volume_options?.[0] || null
  );
  const [added, setAdded] = useState(false);

  const imgSrc = getStoredImg(product.image_url);

  const wholesalePrice = selectedVolume
    ? (selectedVolume.price_wholesale > 0 ? selectedVolume.price_wholesale : selectedVolume.price)
    : (product.price_wholesale > 0 ? product.price_wholesale : product.price);

  const currentPrice = calculateSalePrice(wholesalePrice);
  const isConsult = currentPrice <= 0;

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      name: product.name,
      brand: product.brand,
      price: currentPrice,
      quantity: 1,
      image_url: product.image_url,
      selected_volume: selectedVolume,
      selected_flavor: null,
    });
    track('add_to_cart', {
      source: 'detalle',
      product_id: product.id,
      name: product.name,
      price: isConsult ? null : currentPrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function trackWhatsApp() {
    track('whatsapp_click', {
      source: 'detalle',
      product_id: product.id,
      name: product.name,
      volume_ml: selectedVolume?.ml ?? null,
      price: isConsult ? null : currentPrice,
    });
  }

  function whatsappMessage() {
    let msg = `¡Hola! Quiero comprar:\n\n${product.name}`;
    if (product.brand) msg += ` - ${product.brand}`;
    if (selectedVolume) msg += ` (${selectedVolume.ml}ml)`;
    if (isConsult) {
      msg += `\n\n¿Cuál es el precio de este producto?`;
    } else {
      msg += `\nPrecio: ${currentPrice.toLocaleString()} Gs.\n\n¿Está disponible?`;
    }
    return encodeURIComponent(msg);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/products" className="text-sm text-gray-500 hover:text-[#7c3aed] flex items-center gap-1 mb-6">
        <ChevronLeft size={16} />
        Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
          <img src={imgSrc} alt={product.name} className="w-full h-full object-contain p-8" />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-1">
            {product.brand && (
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{product.brand}</span>
            )}
            {product.category_name && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] uppercase tracking-wide">
                {product.category_name}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f0f1a] mt-1 mb-4">{product.name}</h1>

          <div className="mb-6">
            {isConsult ? (
              <span className="text-3xl font-bold text-[#7c3aed]">Consultar</span>
            ) : (
              <span className="text-3xl font-bold text-[#7c3aed]">{currentPrice.toLocaleString()} Gs.</span>
            )}
          </div>

          {product.volume_options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Volumen</h3>
              <div className="flex flex-wrap gap-2">
                {product.volume_options.map((vo, i) => {
                  const wholesale = vo.price_wholesale > 0 ? vo.price_wholesale : vo.price;
                  const voPrice = calculateSalePrice(wholesale);
                  const label = voPrice > 0 ? `${vo.ml}ml - ${voPrice.toLocaleString()} Gs.` : `${vo.ml}ml`;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedVolume(vo)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        selectedVolume?.ml === vo.ml
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                          : 'border-gray-300 text-gray-700 hover:border-[#7c3aed]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {isConsult ? (
              <a
                href={`https://wa.me/${PHONE}?text=${whatsappMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhatsApp}
                className="flex-1 bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Consultar por WhatsApp
              </a>
            ) : (
              <>
                <button onClick={handleAddToCart} className="flex-1 bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2">
                  {added ? <><Check size={20} /> Agregado</> : <><ShoppingCart size={20} /> Agregar al Carrito</>}
                </button>
                <a href={`https://wa.me/${PHONE}?text=${whatsappMessage()}`} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp} className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                  <MessageCircle size={20} />
                  <span className="hidden md:inline">WhatsApp</span>
                </a>
              </>
            )}
          </div>

          {product.description && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
              <div className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {product.short_description && (
            <div className="mt-6">
              <div className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: product.short_description }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStoredImg(url: string | null): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('http')) return url;
  return `/images/${url}`;
}
