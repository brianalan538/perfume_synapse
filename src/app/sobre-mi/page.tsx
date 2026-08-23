import type { Metadata } from "next";
import { ShieldCheck, BadgeCheck, HandCoins, HeartHandshake, Truck, Sparkles } from "lucide-react";
import TrackedWhatsAppLink from "@/components/TrackedWhatsAppLink";

export const metadata: Metadata = {
  title: "Sobre Mi — SYNAPSE DIGITAL",
  description: "Conocé a Brian Delvalle y la historia detrás de SYNAPSE DIGITAL: perfumes árabes originales, con garantía y atención personalizada.",
};

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "100% Originales",
    text: "Todos nuestros perfumes árabes son originales. Sin réplicas, sin imitaciones.",
  },
  {
    icon: ShieldCheck,
    title: "Total Garantía",
    text: "Comprás con total tranquilidad: respaldamos cada producto que sale de aquí.",
  },
  {
    icon: HandCoins,
    title: "Pago Flexible",
    text: "50% al confirmar tu pedido y el 50% restante a contra entrega.",
  },
  {
    icon: HeartHandshake,
    title: "Atención Cercana",
    text: "Estoy para ayudarte antes y después de tu compra. Tu confianza es lo más importante.",
  },
  {
    icon: Truck,
    title: "Entrega Segura",
    text: "Coordinamos la entrega para que recibas tu pedido sin contratiempos.",
  },
  {
    icon: Sparkles,
    title: "Calidad Constante",
    text: "Cada día sigo mejorando para ofrecerte la mejor experiencia y las mejores fragancias.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0f0f1a] mb-2">Sobre Mi</h1>
        <p className="text-gray-500">La persona detrás de SYNAPSE DIGITAL</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start mb-16">
        <div className="flex justify-center">
          <img
            src="/yo.jpeg"
            alt="Brian Delvalle"
            className="w-full max-w-sm rounded-2xl shadow-lg object-cover aspect-[3/4]"
          />
        </div>

        <div className="space-y-4 text-gray-700">
          <h2 className="text-2xl font-bold text-[#0f0f1a]">¡Hola! Soy Brian Delvalle</h2>
          <p>
            Soy apasionado por la tecnología y por el fascinante mundo de los perfumes
            árabes. Este es un nuevo camino que empecé en el mundo de las fragancias con
            un objetivo claro: acercarte perfumes árabes originales, con garantía y al
            mejor precio.
          </p>
          <p>
            En SYNAPSE DIGITAL no solo vas a encontrar fragancias de calidad, vas a
            encontrar un trato cercano y honesto. Trabajo con la modalidad de 50% al
            confirmar tu pedido y el 50% restante a contra entrega, para que compres con
            total confianza y sin riesgos.
          </p>
          <p className="font-medium text-[#0f0f1a]">
            Gracias por confiar en SYNAPSE DIGITAL. Acompañame a descubrir este mundo de
            fragancias juntos.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-[#0f0f1a] mb-6">¿Por qué comprar conmigo?</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        {trustPoints.map(point => (
          <div key={point.title} className="bg-[#f5f3ff] border border-[#7c3aed]/10 rounded-xl p-6">
            <point.icon className="text-[#7c3aed] mb-3" size={28} />
            <h4 className="font-semibold text-[#0f0f1a] mb-1">{point.title}</h4>
            <p className="text-sm text-gray-600">{point.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0f0f1a] rounded-2xl p-8 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">¿Tenés alguna duda?</h3>
        <p className="text-gray-300 mb-6 max-w-lg mx-auto">
          Escribime por WhatsApp y te respondo a la brevedad. Estoy para ayudarte a
          encontrar la fragancia perfecta para vos o para regalar.
        </p>
        <TrackedWhatsAppLink
          href="https://wa.me/595985798538"
          source="sobre_mi"
          className="inline-block bg-[#7c3aed] text-white px-8 py-3 rounded-full font-medium hover:bg-[#6d28d9] transition-colors"
        >
          Escribime por WhatsApp
        </TrackedWhatsAppLink>
      </div>
    </div>
  );
}
