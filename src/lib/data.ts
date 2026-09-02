import { supabase } from './supabase';
import type { Product, Category, VolumeOption } from './types';

const PERFUME_CATEGORY_IDS = [1, 2, 3];

const MIN_MARKUP = 65000;
const MAX_MARKUP = 115000;

export function calculateSalePrice(wholesale: number): number {
  if (wholesale <= 0) return 0;
  const ratio = Math.min(1, wholesale / 300000);
  const markup = Math.round(MIN_MARKUP + ratio * (MAX_MARKUP - MIN_MARKUP));
  const raw = wholesale + markup;
  return Math.round(raw / 5000) * 5000;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data.map(parseProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
  return data.map(parseProduct);
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .in('id', PERFUME_CATEGORY_IDS)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return parseProduct(data);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const cat = await getCategoryBySlug(slug);
  if (!cat) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('name');

  if (error) return [];
  return (data || []).map(parseProduct);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (error) return [];
  return (data || [])
    .map(parseProduct)
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
}

function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T[]; } catch { return []; }
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseProduct(raw: Record<string, unknown>): Product {
  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    brand: (raw.brand as string) || null,
    category_id: Number(raw.category_id),
    category_name: (raw.category_name as string) || '',
    description: (raw.description as string) || '',
    short_description: (raw.short_description as string) || '',
    price: Number(raw.price),
    price_wholesale: raw.price_wholesale ? Number(raw.price_wholesale) : 0,
    stock: Number(raw.stock) || 0,
    volume_ml: raw.volume_ml ? Number(raw.volume_ml) : null,
    volume_options: parseJsonArray<VolumeOption>(raw.volume_options),
    flavor_enabled: Boolean(raw.flavor_enabled),
    flavors: parseJsonArray<string>(raw.flavors),
    image_url: (raw.image_url as string) || null,
    image_urls: parseJsonArray<string>(raw.image_urls),
    is_active: raw.is_active !== false,
    created_at: (raw.created_at as string) || '',
  };
}

export function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return '/placeholder.svg';
  return imagePath;
}
