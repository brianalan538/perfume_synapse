'use client';

import { create } from 'zustand';
import type { CartItem, VolumeOption } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, flavor?: string | null, volume?: number | null) => void;
  updateQuantity: (productId: number, quantity: number, flavor?: string | null, volume?: number | null) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const CART_KEY = 'perfumes_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export const useCart = create<CartStore>((set, get) => ({
  items: loadCart(),

  addItem: (item) => {
    const items = get().items;
    const key = `${item.product_id}-${item.selected_flavor || ''}-${item.selected_volume?.ml || ''}`;
    const existing = items.find(i =>
      `${i.product_id}-${i.selected_flavor || ''}-${i.selected_volume?.ml || ''}` === key
    );
    let newItems: CartItem[];
    if (existing) {
      newItems = items.map(i =>
        `${i.product_id}-${i.selected_flavor || ''}-${i.selected_volume?.ml || ''}` === key
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...items, item];
    }
    set({ items: newItems });
    saveCart(newItems);
  },

  removeItem: (productId, flavor, volume) => {
    const key = `${productId}-${flavor || ''}-${volume || ''}`;
    const newItems = get().items.filter(i =>
      `${i.product_id}-${i.selected_flavor || ''}-${i.selected_volume?.ml || ''}` !== key
    );
    set({ items: newItems });
    saveCart(newItems);
  },

  updateQuantity: (productId, quantity, flavor, volume) => {
    const key = `${productId}-${flavor || ''}-${volume || ''}`;
    const newItems = get().items.map(i =>
      `${i.product_id}-${i.selected_flavor || ''}-${i.selected_volume?.ml || ''}` === key
        ? { ...i, quantity: Math.max(1, quantity) }
        : i
    );
    set({ items: newItems });
    saveCart(newItems);
  },

  clearCart: () => {
    set({ items: [] });
    saveCart([]);
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
