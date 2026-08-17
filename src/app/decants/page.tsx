import type { Metadata } from "next";
import Link from "next/link";
import {
  FlaskConical,
  Sparkles,
  Car,
  Wallet,
  Gift,
  Ban,
  HeartHandshake,
  Droplets,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Decants — SYNAPSE DIGITAL",
  description: "Probá tus perfumes favoritos antes de comprar la botella. Decants de 5 ml por 35.000 Gs. y 10 ml por 60.000 Gs. Envío y retiro coordinados por WhatsApp.",
};

const PHONE = '595985798538';

const painPoints = [
  {
    icon: Ban,
    title: "¿Comprar a ciegas?",
    text: "Gastar 300.000 Gs. o más en una botella completa y que al final la fragancia no dure en tu piel o no sea para vos es un riesgo real.",
  },
  {
    icon: Wallet,
    title: "¿Un solo perfume?",
    text: "Con el precio de una botella podrías probar 5 o 6 fragancias distintas y elegir la que de verdad va con tu estilo.",
  },
  {
    icon: Car,
    title: "¿Llevarlo siempre encima?",
    text: "Las botellas grandes no viajan bien en el auto, el bolso o la mochila. O simplemente preferís no andar con todo el frasco.",
  },
  {
    icon: Gift,
    title: "¿Regalar sin saber?",
    text: "Regalar un perfume a ciegas es arriesgado. Con un decant, quien lo recibe puede probarlo antes de decidir la botella completa.",
  },
];

const benefits = [
  {
    icon: FlaskConical,
    title: "Probalo antes de comprar",
    text: "Descubrí si la fragancia realmente te gusta en tu piel antes de invertir en la botella completa. El mismo perfume original, sin riesgo.",
  },
  {
    icon: Sparkles,
    title: "Más opciones, menos gasto",
    text: "Rotá tu perfume según el día, el clima o la ocasión. Una colección de decants cuesta menos que una sola botella.",
  },
  {
    icon: Car,
    title: "Tamaño para todos lados",
    text: "Dejá uno en el auto, otro en el bolso, otro en la oficina. El atomizador es compacto, seguro y no ocupa nada.",
  },
  {
    icon: Droplets,
    title: "Frasco con atomizador",
    text: "Cada decant viene en su envase sellado con spray, listo para usar y llevar. Mismo aroma, misma calidad, tamaño inteligente.",
  },
];

const sizes = [
  { ml: "5 ml", price: "35.000 Gs.", note: "Ideal para probar. Unos 60 a 80 usos.", featured: false },
  { ml: "10 ml", price: "60.000 Gs.", note: "El más elegido: dura el doble y viaja perfecto.", featured: true },
];

export default function DecantsPage() {
  const waLink = `https://wa.me/${PHONE}?text=${encodeURIComponent('¡Hola! Quiero pedir decants de perfume 🧪')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#7c3aed] mb-2">Decants · Probalo antes</p>
        <h1 className="text-3xl md:text-5xl font-bold text-[#0f0f1a] mb-4">
          El perfume que querés, sin pagar toda la botella
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Un <strong className="text-[#0f0f1a]">decant</strong> es la misma esencia original de tus
          fragancias favoritas, envasada en un frasco con atomizador. Ideal para probar, regalar y
          llevar siempre encima.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
        <div>
          <img
            src="/decants.jpeg"
            alt="Decants de perfumes SYNAPSE DIGITAL"
            className="w-full rounded-2xl shadow-lg object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0f0f1a] mb-6">Precios de decants</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {sizes.map(size => (
              <div
                key={size.ml}
                className={`flex-1 rounded-2xl p-6 text-center ${
                  size.featured
                    ? "bg-[#7c3aed] text-white shadow-lg"
                    : "bg-white border border-[#7c3aed]/20"
                }`}
              >
                <p className={`text-sm font-medium mb-1 ${size.featured ? "text-[#e9d5ff]" : "text-gray-500"}`}>
                  Decant {size.ml}
                </p>
                <p className={`text-3xl font-bold mb-2 ${size.featured ? "" : "text-[#0f0f1a]"}`}>
                  {size.price}
                </p>
                <p className={`text-xs ${size.featured ? "text-[#e9d5ff]" : "text-gray-400"}`}>{size.note}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Si el perfume que probás te encanta, después podés pasar directo a la{" "}
            <Link href="/products" className="text-[#7c3aed] font-medium underline hover:no-underline">
              botella completa
            </Link>{" "}
            con total confianza.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
          >
            <Gift size={20} />
            Pedir mis decants por WhatsApp
          </a>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#0f0f1a] mb-2">¿Te suena familiar?</h2>
      <p className="text-gray-600 mb-6">El problema que resolvemos con los decants</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {painPoints.map(point => (
          <div key={point.title} className="bg-red-50 border border-red-100 rounded-xl p-6">
            <point.icon className="text-red-500 mb-3" size={28} />
            <h3 className="font-semibold text-[#0f0f1a] mb-1">{point.title}</h3>
            <p className="text-sm text-gray-600">{point.text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-[#0f0f1a] mb-2">La solución</h2>
      <p className="text-gray-600 mb-6">Por qué pedir un decant</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {benefits.map(benefit => (
          <div key={benefit.title} className="bg-[#f5f3ff] border border-[#7c3aed]/10 rounded-xl p-6">
            <benefit.icon className="text-[#7c3aed] mb-3" size={28} />
            <h3 className="font-semibold text-[#0f0f1a] mb-1">{benefit.title}</h3>
            <p className="text-sm text-gray-600">{benefit.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0f0f1a] rounded-2xl p-8 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">¿Ya sabés qué perfume querés probar?</h3>
        <p className="text-gray-300 mb-6 max-w-lg mx-auto">
          Decime cuál y qué tamaño preferís (5 ml o 10 ml). Coordinamos envío o retiro por WhatsApp,
          con la misma garantía de siempre.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          <HeartHandshake size={20} />
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
