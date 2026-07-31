export interface VolumeOption {
  ml: number;
  price: number;
  price_wholesale: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  brand: string | null;
  category_id: number;
  category_name: string;
  description: string;
  short_description: string;
  price: number;
  price_wholesale: number;
  stock: number;
  volume_ml: number | null;
  volume_options: VolumeOption[];
  flavor_enabled: boolean;
  flavors: string[];
  image_url: string | null;
  image_urls: string[];
  is_active: boolean;
  created_at: string;
}

export interface VolumeDraft {
  ml: number;
  price_wholesale: number;
  stock: number;
}

export interface ProductDraft {
  id: number | null;
  name: string;
  brand: string;
  category_id: number;
  price_wholesale: number;
  stock: number;
  description: string;
  short_description: string;
  image_url: string;
  volumes: VolumeDraft[];
}

export interface ProductPayload {
  name: string;
  brand: string | null;
  category_id: number;
  price: number;
  price_wholesale: number;
  stock: number;
  description: string;
  short_description: string;
  image_url: string | null;
  image_urls: string[];
  volume_options: VolumeOption[];
  volume_ml: number | null;
  flavor_enabled: boolean;
  flavors: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  brand: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  selected_volume: VolumeOption | null;
  selected_flavor: string | null;
}
