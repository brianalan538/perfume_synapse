'use client';

import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '@/store/cart';
import { track } from '@vercel/analytics';

const PHONE = '595985798538';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();

  function whatsappMessage() {
    if (items.length === 0) return '';
    let msg = '¡Hola! Quiero hacer el siguiente pedido:\n\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name}`;
      if (item.brand) msg += ` - ${item.brand}`;
      if (item.selected_volume) msg += ` (${item.selected_volume.ml}ml)`;
      if (item.selected_flavor) msg += ` - ${item.selected_flavor}`;
      msg += `\n   Cantidad: ${item.quantity} x ${item.price.toLocaleString()} Gs. = ${(item.price * item.quantity).toLocaleString()} Gs.\n\n`;
    });
    msg += `Total del pedido: ${totalPrice().toLocaleString()} Gs.\n\n`;
    msg += 'Por favor confirmame disponibilidad y el costo de envío. Gracias!';
    return encodeURIComponent(msg);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-[#0f0f1a] mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">Agregá productos para continuar con la compra</p>
        <Link href="/products" className="inline-block bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f0f1a]">Carrito ({items.length} productos)</h1>
        <button onClick={clearCart} className="text-sm text-red-600 hover:text-red-700">Vaciar carrito</button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const key = `${item.product_id}-${item.selected_flavor || ''}-${item.selected_volume?.ml || ''}`;
          const imgSrc = item.image_url
            ? (item.image_url.startsWith('http') ? item.image_url : `/images/${item.image_url}`)
            : '/placeholder.svg';

          return (
            <div key={key} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-4">
              <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                <img src={imgSrc} alt={item.name} className="w-full h-full object-contain p-2" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product_id}`} className="font-medium text-[#0f0f1a] hover:underline">
                  {item.name}
                </Link>
                {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                {item.selected_volume && (
                  <p className="text-sm text-gray-500">{item.selected_volume.ml}ml</p>
                )}
                <p className="text-sm font-semibold text-[#7c3aed] mt-1">{item.price.toLocaleString()} Gs.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.selected_flavor, item.selected_volume?.ml)}
                  className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.selected_flavor, item.selected_volume?.ml)}
                  className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#0f0f1a]">{((item.price * item.quantity)).toLocaleString()} Gs.</p>
              </div>
              <button
                onClick={() => removeItem(item.product_id, item.selected_flavor, item.selected_volume?.ml)}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-[#f5f3ff] border border-[#7c3aed]/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-[#0f0f1a]">Total</span>
          <span className="text-2xl font-bold text-[#7c3aed]">{totalPrice().toLocaleString()} Gs.</span>
        </div>
        <a
          href={`https://wa.me/${PHONE}?text=${whatsappMessage()}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { source: 'carrito', items: items.length, total: totalPrice() })}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={20} />
          Enviar pedido por WhatsApp
        </a>
        <p className="text-xs text-gray-500 text-center mt-2">Te responderemos a la brevedad para confirmar tu pedido</p>
      </div>
    </div>
  );
}
