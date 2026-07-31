import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0f0f1a] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">SYNAPSE DIGITAL</h3>
            <p className="text-sm text-gray-400">Fragancias originales seleccionadas para quienes buscan calidad, estilo y distinción.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Inicio</Link></li>
              <li><Link href="/products" className="hover:text-white">Todos los Productos</Link></li>
              <li><Link href="/cart" className="hover:text-white">Carrito</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <p className="text-sm">Hace tu pedido por WhatsApp</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} SYNAPSE DIGITAL. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
