'use client';

import { MessageCircle } from 'lucide-react';
import { useCart } from '@/store/cart';

const PHONE = '595985798538';

export default function WhatsAppButton() {
  const items = useCart(s => s.items);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function generateMessage() {
    let msg = '¡Hola! Quiero hacer el siguiente pedido:\n\n';

    items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name}`;
      if (item.brand) msg += ` - ${item.brand}`;
      if (item.selected_volume) msg += ` (${item.selected_volume.ml}ml)`;
      if (item.selected_flavor) msg += ` - ${item.selected_flavor}`;
      msg += `\n   Cantidad: ${item.quantity} x ${item.price.toLocaleString()} Gs.\n\n`;
    });

    msg += `Total: ${total.toLocaleString()} Gs.\n`;
    msg += '¿Está disponible? Gracias!';

    return encodeURIComponent(msg);
  }

  if (items.length === 0) return null;

  return (
    <a
      href={`https://wa.me/${PHONE}?text=${generateMessage()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors z-40 flex items-center gap-2"
    >
      <MessageCircle size={24} />
      <span className="hidden md:inline text-sm font-medium">Pedido por WhatsApp</span>
    </a>
  );
}
