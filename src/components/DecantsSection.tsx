import Link from 'next/link';
import { FlaskConical, CheckCircle2, Sparkles, Car, Wallet, Gift } from 'lucide-react';

const PHONE = '595985798538';

const benefits = [
  {
    icon: FlaskConical,
    title: 'Probalo antes de comprar',
    text: 'Descubrí si la fragancia realmente te gusta en tu piel antes de invertir en la botella completa.',
  },
  {
    icon: Sparkles,
    title: 'Más opciones, menos gasto',
    text: 'Probá varios perfumes distintos sin tener que pagar varias botellas. Cambiá según la ocasión.',
  },
  {
    icon: Car,
    title: 'Llevarlo a todos lados',
    text: 'Dejá uno en el auto, en el bolso, en la oficina o para viajar. Tamaño perfecto para la mochila.',
  },
  {
    icon: Wallet,
    title: 'Sin pagar toda la botella',
    text: 'Disfrutá de un perfume de lujo a una fracción del precio. Perfecto para regalar o estrenar.',
  },
];

export default function DecantsSection() {
  return (
    <section className="bg-[#f5f3ff] py-16" id="decants">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
          <div className="relative">
            <img
              src="/decants.jpeg"
              alt="Decants de perfumes SYNAPSE DIGITAL"
              className="w-full rounded-2xl shadow-lg object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#7c3aed] mb-2">
              Decants · Probalo antes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f0f1a] mb-4">
              ¿Miedo de comprar una botella y que no te guste?
            </h2>
            <p className="text-gray-600 mb-6">
              Con un <strong className="text-[#0f0f1a]">decant</strong> probás la fragancia en tu piel
              sin gastar de más. Es la misma esencia original, envasada en un frasco con atomizador,
              lista para llevar. Si te enamora, después invertís en la botella completa con total
              confianza.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 bg-white border border-[#7c3aed]/20 rounded-2xl p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Decant 5 ml</p>
                <p className="text-3xl font-bold text-[#0f0f1a] mb-2">35.000 Gs.</p>
                <p className="text-xs text-gray-400">Unos 60 a 80 usos aprox.</p>
              </div>
              <div className="flex-1 bg-[#7c3aed] rounded-2xl p-6 text-center text-white shadow-lg">
                <p className="text-sm font-medium text-[#e9d5ff] mb-1">Decant 10 ml</p>
                <p className="text-3xl font-bold mb-2">60.000 Gs.</p>
                <p className="text-xs text-[#e9d5ff]">Doble duración, el más elegido</p>
              </div>
            </div>

            <a
              href={`https://wa.me/${PHONE}?text=${encodeURIComponent('¡Hola! Quiero pedir decants de perfume 🧪')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
            >
              <Gift size={20} />
              Pedir mis decants por WhatsApp
            </a>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map(benefit => (
            <div key={benefit.title} className="bg-white border border-[#7c3aed]/10 rounded-xl p-6">
              <benefit.icon className="text-[#7c3aed] mb-3" size={28} />
              <h3 className="font-semibold text-[#0f0f1a] mb-1">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/decants" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c3aed] hover:underline">
            <CheckCircle2 size={18} />
            Ver toda la info de decants
          </Link>
        </div>
      </div>
    </section>
  );
}
