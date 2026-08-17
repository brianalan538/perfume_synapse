'use client';

import Link from 'next/link';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { getCategories } from '@/lib/data';
import type { Category } from '@/lib/types';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const totalItems = useCart(s => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <header className="bg-[#0f0f1a] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button className="lg:hidden p-2 text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SYNAPSE DIGITAL" className="h-8 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold tracking-tight text-white">SYNAPSE DIGITAL</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white">Inicio</Link>
            <Link href="/sobre-mi" className="text-sm font-medium text-gray-300 hover:text-white">Sobre Mi</Link>
            <Link href="/decants" className="text-sm font-medium text-gray-300 hover:text-white">Decants</Link>
            <div className="relative group">
              <button className="text-sm font-medium text-gray-300 hover:text-white">Categorías</button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a2e] border border-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {categories.map(cat => (
                  <Link key={cat.id} href={`/category/${cat.slug}`} className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a3e] hover:text-white">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/products" className="text-sm font-medium text-gray-300 hover:text-white">Todos los Productos</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-300 hover:text-white">
              <Search size={20} />
            </button>
            <Link href="/cart" className="relative p-2 text-gray-300 hover:text-white">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7c3aed] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`; }}>
              <input
                type="text"
                placeholder="Buscar perfumes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed] placeholder-gray-500"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-800 bg-[#0f0f1a]">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="block py-2 text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Inicio</Link>
            <Link href="/sobre-mi" className="block py-2 text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Sobre Mi</Link>
            <Link href="/decants" className="block py-2 text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Decants</Link>
            <div className="py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categorías</p>
              {categories.map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="block py-1.5 text-sm text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link href="/products" className="block py-2 text-sm font-medium text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Todos los Productos</Link>
          </div>
        </div>
      )}
    </header>
  );
}
