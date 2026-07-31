'use client';

import { useState } from 'react';
import { X, Check, RefreshCw, Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Category, ProductDraft, ProductPayload } from '@/lib/types';
import { calculateSalePrice } from '@/lib/data';

interface Props {
  mode: 'create' | 'edit';
  initial: ProductDraft;
  categories: Category[];
  password: string;
  onSave: (payload: ProductPayload) => Promise<void>;
  onClose: () => void;
}

export default function AdminProductForm({ mode, initial, categories, password, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function setVolume(index: number, key: keyof ProductDraft['volumes'][number], value: number) {
    setDraft(prev => ({
      ...prev,
      volumes: prev.volumes.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }));
  }

  function addVolume() {
    setDraft(prev => ({ ...prev, volumes: [...prev.volumes, { ml: 100, price_wholesale: 0, stock: 0 }] }));
  }

  function removeVolume(index: number) {
    setDraft(prev => ({ ...prev, volumes: prev.volumes.filter((_, i) => i !== index) }));
  }

  const volumes = draft.volumes.filter(v => v.ml > 0 && v.price_wholesale > 0);
  const previewWholesale =
    (volumes.length > 0 && volumes[0].price_wholesale > 0 ? volumes[0].price_wholesale : 0) ||
    (draft.price_wholesale > 0 ? draft.price_wholesale : 0);
  const previewSale = calculateSalePrice(previewWholesale);

  function buildPayload(): ProductPayload {
    const volumeOptions = volumes.map(v => ({
      ml: Number(v.ml),
      price: calculateSalePrice(Number(v.price_wholesale)),
      price_wholesale: Number(v.price_wholesale),
      stock: Number(v.stock) || 0,
    }));
    const mainWholesale = volumeOptions.length > 0 ? volumeOptions[0].price_wholesale : (draft.price_wholesale || 0);
    const image = draft.image_url.trim();
    return {
      name: draft.name.trim(),
      brand: draft.brand.trim() || null,
      category_id: Number(draft.category_id),
      price: calculateSalePrice(mainWholesale),
      price_wholesale: mainWholesale,
      stock: Number(draft.stock) || 0,
      description: draft.description,
      short_description: draft.short_description,
      image_url: image || null,
      image_urls: image ? [image] : [],
      volume_options: volumeOptions,
      volume_ml: volumeOptions[0]?.ml ?? null,
      flavor_enabled: false,
      flavors: [],
    };
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!draft.category_id) {
      setError('Seleccioná una categoría');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(buildPayload());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          password,
          fileName: file.name,
          contentType: file.type,
          base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
      set('image_url', data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    }
    setUploading(false);
  }

  const imgSrc = draft.image_url
    ? (draft.image_url.startsWith('http') ? draft.image_url : `/images/${draft.image_url}`)
    : '/placeholder.svg';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6" onClick={() => !saving && onClose()}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0f0f1a]">{mode === 'create' ? 'Nuevo Producto' : `Editar Producto${draft.id != null ? ` #${draft.id}` : ''}`}</h2>
          <button onClick={() => !saving && onClose()} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-xl">
              <X size={16} /> {error}
            </div>
          )}

          <div className="flex gap-4">
            <div className="w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img src={imgSrc} alt="Preview" className="w-full h-full object-contain p-2" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">
                Imagen URL <span className="text-gray-400 font-normal">(o subí un archivo)</span>
              </label>
              <div className="relative mb-2">
                <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={draft.image_url}
                  onChange={e => set('image_url', e.target.value)}
                  placeholder="https://.../public/perfumes/products/ejemplo.jpg"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[#7c3aed] font-medium cursor-pointer">
                {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Subiendo...' : 'Subir imagen desde PC'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Nombre *</label>
              <input
                type="text"
                value={draft.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Nombre del perfume"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Marca</label>
              <input
                type="text"
                value={draft.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Ej: ARMAF"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Categoría</label>
              <select
                value={draft.category_id}
                onChange={e => set('category_id', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] bg-white"
              >
                <option value="">Seleccioná...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Precio de costo (Gs)</label>
              <input
                type="number"
                min="0"
                value={draft.price_wholesale || ''}
                onChange={e => set('price_wholesale', Number(e.target.value))}
                placeholder="Ej: 100000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Stock</label>
              <input
                type="number"
                min="0"
                value={draft.stock || ''}
                onChange={e => set('stock', Number(e.target.value))}
                placeholder="Ej: 5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-[#0f0f1a]">Volúmenes (ml)</label>
              <button
                type="button"
                onClick={addVolume}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9]"
              >
                <Plus size={16} /> Agregar volumen
              </button>
            </div>
            {draft.volumes.length === 0 && (
              <p className="text-sm text-gray-400 mb-2">Sin volúmenes. Usá &quot;Precio de costo&quot; para el precio base.</p>
            )}
            <div className="space-y-2">
              {draft.volumes.map((v, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={v.ml || ''}
                      onChange={e => setVolume(i, 'ml', Number(e.target.value))}
                      placeholder="ml"
                      className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ml</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={v.price_wholesale || ''}
                    onChange={e => setVolume(i, 'price_wholesale', Number(e.target.value))}
                    placeholder="Costo Gs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={v.stock || ''}
                      onChange={e => setVolume(i, 'stock', Number(e.target.value))}
                      placeholder="Stock"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeVolume(i)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                      title="Quitar volumen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Descripción corta</label>
            <textarea
              value={draft.short_description}
              onChange={e => set('short_description', e.target.value)}
              rows={2}
              placeholder="Breve descripción"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0f0f1a] mb-1.5">Descripción</label>
            <textarea
              value={draft.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Puede incluir HTML (ej: <ul><li>...</li></ul>)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
          </div>

          <div className="bg-[#f5f3ff] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Precio de venta calculado</span>
              <span className="text-2xl font-bold text-[#7c3aed]">{previewSale.toLocaleString()} Gs.</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 bg-[#7c3aed] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
            {saving ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
