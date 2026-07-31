-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category_id INTEGER REFERENCES categories(id),
  category_name TEXT,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL,
  price_wholesale NUMERIC,
  stock INTEGER DEFAULT 0,
  volume_ml NUMERIC,
  volume_options JSONB DEFAULT '[]'::jsonb,
  flavor_enabled BOOLEAN DEFAULT FALSE,
  flavors JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura pública para todos
DROP POLICY IF EXISTS "Lectura pública categorías" ON categories;
CREATE POLICY "Lectura pública categorías" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública productos" ON products;
CREATE POLICY "Lectura pública productos" ON products
  FOR SELECT USING (true);
