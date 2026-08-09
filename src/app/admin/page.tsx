'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Lock, Check, Pencil, RefreshCw, Trash2, Plus, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { getAllProducts, getCategories, calculateSalePrice } from '@/lib/data';
import type { Product, Category, ProductDraft, ProductPayload } from '@/lib/types';
import AdminProductForm from '@/components/AdminProductForm';

type Tab = 'active' | 'hidden' | 'all';

const TABS: { key: Tab; label: string; icon: typeof Eye | undefined }[] = [
  { key: 'active', label: 'Activos', icon: Eye },
  { key: 'hidden', label: 'Ocultos', icon: EyeOff },
  { key: 'all', label: 'Todos', icon: undefined },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tab, setTab] = useState<Tab>('active');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);

  async function loadData() {
    const [p, c] = await Promise.all([getAllProducts(), getCategories()]);
    setProducts(p);
    setCategories(c);
    setLoading(false);
  }

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    Promise.all([getAllProducts(), getCategories()]).then(([p, c]) => {
      if (cancelled) return;
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [authenticated]);

  const filtered = useMemo(() => {
    let result = products;
    if (tab === 'active') result = result.filter(p => p.is_active);
    else if (tab === 'hidden') result = result.filter(p => !p.is_active);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        String(p.id) === q
      );
    }
    if (selectedCategory) {
      result = result.filter(p => String(p.category_id) === selectedCategory);
    }
    return result;
  }, [search, selectedCategory, products, tab]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'auth', password }),
    })
      .then(async res => {
        if (res.status === 401) setGlobalMsg('Contraseña incorrecta');
        else if (!res.ok) setGlobalMsg((await res.json()).error || 'Error de conexión');
        else {
          setAuthenticated(true);
          setGlobalMsg(null);
        }
      })
      .catch(() => setGlobalMsg('Error de conexión'));
  }

  function openCreate() {
    setDraft({
      id: null,
      name: '',
      brand: '',
      category_id: categories[0]?.id || 0,
      price_wholesale: 0,
      stock: 0,
      description: '',
      short_description: '',
      image_url: '',
      volumes: [{ ml: 100, price_wholesale: 0, stock: 0 }],
    });
    setFormMode('create');
  }

  function openEdit(product: Product) {
    const wholesale = product.price_wholesale > 0 ? product.price_wholesale : product.price;
    setDraft({
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      category_id: product.category_id,
      price_wholesale: wholesale,
      stock: product.stock,
      description: product.description || '',
      short_description: product.short_description || '',
      image_url: product.image_url || '',
      volumes: product.volume_options.length > 0
        ? product.volume_options.map(v => ({
            ml: v.ml,
            price_wholesale: v.price_wholesale > 0 ? v.price_wholesale : v.price,
            stock: v.stock,
          }))
        : [],
    });
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setDraft(null);
  }

  function errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'Error desconocido';
  }

  async function saveProduct(payload: ProductPayload) {
    const isCreate = formMode === 'create';
    const body = isCreate
      ? { action: 'create', password, product: payload }
      : { action: 'update', password, id: draft?.id, fields: payload };

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');

    await loadData();
    closeForm();
    setGlobalMsg(isCreate ? `Producto creado correctamente` : `Producto #${draft?.id} actualizado correctamente`);
    setTimeout(() => setGlobalMsg(null), 3000);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', password, id: deleteTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      setProducts(prev => prev.map(p => (p.id === deleteTarget.id ? { ...p, is_active: false } : p)));
      setGlobalMsg(`"${deleteTarget.name}" oculto de la tienda`);
      setTimeout(() => setGlobalMsg(null), 3000);
    } catch (err: unknown) {
      setGlobalMsg(errorMessage(err));
    }
    setBusyId(null);
    setDeleteTarget(null);
  }

  async function restore(product: Product) {
    setBusyId(product.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', password, id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restaurar');
      setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, is_active: true } : p)));
      setGlobalMsg(`"${product.name}" restaurado`);
      setTimeout(() => setGlobalMsg(null), 3000);
    } catch (err: unknown) {
      setGlobalMsg(errorMessage(err));
    }
    setBusyId(null);
  }

  function getImgSrc(product: Product) {
    if (!product.image_url) return '/placeholder.svg';
    return product.image_url.startsWith('http') ? product.image_url : `/images/${product.image_url}`;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-sm shadow-lg">
          <div className="flex items-center justify-center w-14 h-14 bg-[#7c3aed]/10 rounded-full mx-auto mb-6">
            <Lock size={24} className="text-[#7c3aed]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f0f1a] text-center mb-2">Admin</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Ingresá la contraseña de administrador</p>
          {globalMsg && (
            <p className="text-sm text-red-600 text-center mb-4 bg-red-50 py-2 rounded-lg">{globalMsg}</p>
          )}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c3aed] mb-4"
            autoFocus
          />
          <button type="submit" className="w-full bg-[#7c3aed] text-white py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-colors">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-[#0f0f1a]">Admin — Productos</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#7c3aed] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#6d28d9] transition-colors"
            >
              <Plus size={18} /> Nuevo producto
            </button>
            <button
              onClick={() => { setAuthenticated(false); setPassword(''); }}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {globalMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <Check size={16} />
            {globalMsg}
            <button onClick={() => setGlobalMsg(null)} className="ml-auto font-bold">&times;</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#7c3aed] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7c3aed]/30'
              }`}
            >
              {Icon && <Icon size={15} />}
              {label}
            </button>
          ))}
          <span className="text-sm text-gray-500 ml-auto">{filtered.length} productos</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => {
              const wholesale = product.price_wholesale > 0 ? product.price_wholesale : product.price;
              const price = calculateSalePrice(wholesale);
              const isConsult = price <= 0;
              const imgSrc = getImgSrc(product);

              return (
                <div key={product.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#7c3aed]/20 transition-all relative">
                  <div className={`aspect-square bg-gray-50 relative overflow-hidden ${!product.is_active ? 'opacity-50' : ''}`}>
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-contain p-4 transition-transform" loading="lazy" />
                    {product.brand && (
                      <span className="absolute top-2 left-2 bg-[#7c3aed] text-white text-xs font-medium px-2 py-1 rounded">{product.brand}</span>
                    )}
                    {isConsult && !product.is_active && (
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded">Consultar</span>
                    )}
                    {!product.is_active && (
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs font-medium px-2 py-1 rounded">Oculto</span>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center hover:bg-[#6d28d9] transition-colors shadow-md opacity-0 group-hover:opacity-100"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      {product.is_active ? (
                        <button
                          onClick={() => setDeleteTarget(product)}
                          disabled={busyId === product.id}
                          className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Ocultar de la tienda"
                        >
                          {busyId === product.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => restore(product)}
                          disabled={busyId === product.id}
                          className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-md opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Restaurar"
                        >
                          {busyId === product.id ? <RefreshCw size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#7c3aed]">{isConsult ? 'Consultar' : `${price.toLocaleString()} Gs.`}</span>
                      <span className="text-[10px] text-gray-400">ID {product.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">No se encontraron productos</div>
        )}
      </div>

      {formMode && draft && (
        <AdminProductForm
          mode={formMode}
          initial={draft}
          categories={categories}
          password={password}
          onSave={saveProduct}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#0f0f1a] mb-2">Ocultar producto</h2>
            <p className="text-sm text-gray-600 mb-4">
              ¿Seguro que querés ocultar <strong>{deleteTarget.name}</strong> de la tienda?               Podés restaurarlo después desde la pestaña &quot;Ocultos&quot;.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={busyId === deleteTarget.id}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busyId === deleteTarget.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Ocultar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
