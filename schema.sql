CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  image_url TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  brand VARCHAR(120),
  sku VARCHAR(120) UNIQUE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description TEXT,
  image_url TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  threshold INTEGER NOT NULL DEFAULT 5,
  weight NUMERIC(8,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY,name VARCHAR(120),email VARCHAR(180) UNIQUE,phone VARCHAR(40),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY,customer_id INTEGER REFERENCES customers(id),total NUMERIC(12,2) NOT NULL DEFAULT 0,status VARCHAR(30) NOT NULL DEFAULT 'PENDING',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id,status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

INSERT INTO categories(name,slug,image_url,sort_order) VALUES
('أثاث خارجي','outdoor-furniture','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=240&q=80',1),
('أدوات المطبخ و الخَبز','kitchen-tools','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=240&q=80',2),
('سجاد','rugs','https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=240&q=80',3),
('بين باج','bean-bags','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=240&q=80',4),
('مستلزمات المطبخ و المنزل','home-kitchen','https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=240&q=80',5),
('كراسي','chairs','https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=240&q=80',6),
('إضاءة','lighting','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=240&q=80',7),
('وحدات التلفزيون','tv-units','https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=240&q=80',8),
('مراتب و مفارش','mattresses','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=240&q=80',9),
('ديكورات','decor','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=240&q=80',10),
('ستائر','curtains','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=240&q=80',11),
('مرايا','mirrors','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=240&q=80',12),
('المطبخ','kitchen','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=240&q=80',13),
('الأثاث المكتبي','office-furniture','https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=80',14),
('الدواليب','wardrobes','https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=240&q=80',15),
('وحدات التخزين و الجزامات','storage','https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=240&q=80',16)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products(name,brand,sku,category_id,description,image_url,price,stock,status)
SELECT v.name,v.brand,v.sku,c.id,v.description,v.image_url,v.price,v.stock,'PUBLISHED'
FROM (VALUES
('طاولة جانبية مودرن','VORA Home','VORA-001','كراسي','طاولة عملية بتصميم بسيط يناسب المساحات العصرية','https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=700&q=80',1290,12),
('كرسي Lounge فاخر','VORA Home','VORA-002','كراسي','كرسي مريح بتفاصيل ناعمة وتصميم أنيق','https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=700&q=80',3490,7),
('مصباح أرضي Minimal','VORA Lighting','VORA-003','إضاءة','مصباح أرضي بسيط لإضاءة دافئة وهادئة','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80',1890,18),
('وحدة تلفزيون خشبية','VORA Home','VORA-004','وحدات التلفزيون','وحدة تلفزيون عملية بخطوط نظيفة ومساحة تخزين','https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=80',4990,4),
('مرآة دائرية أنيقة','VORA Decor','VORA-005','مرايا','مرآة دائرية تضيف اتساعاً وأناقة للمكان','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=700&q=80',1590,20)
) v(name,brand,sku,category_name,description,image_url,price,stock) JOIN categories c ON c.name=v.category_name
ON CONFLICT (sku) DO NOTHING;
