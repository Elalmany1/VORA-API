import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': process.env.FRONTEND_ORIGIN || '*', 'access-control-allow-credentials': 'true' } })
const body = async req => { try { return await req.json() } catch { return {} } }
const pathParts = req => new URL(req.url).pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
const q = req => Object.fromEntries(new URL(req.url).searchParams.entries())

function cors(req) { if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers:{'access-control-allow-origin':process.env.FRONTEND_ORIGIN||'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':'Content-Type,Authorization'}}) }

export default async function handler(req) {
  const preflight = cors(req); if (preflight) return preflight
  const p = pathParts(req)
  try {
    if (p[0] === 'health') return json({ ok: true, service: 'vora-api' })

    if (p[0] === 'categories') {
      const rows = await sql`SELECT c.id,c.name,c.slug,c.image_url,c.parent_id,c.active,COUNT(p.id)::int AS product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.status='PUBLISHED' WHERE c.active=true GROUP BY c.id ORDER BY c.sort_order,c.name`
      return json({data:rows})
    }

    if (p[0] === 'products' && p.length === 1 && req.method === 'GET') {
      const params = q(req); const limit = Math.min(Number(params.limit || 24), 100); const offset = Math.max(Number(params.page || 1) - 1, 0) * limit
      const search = params.q ? `%${params.q}%` : null; const category = params.category || null; const min = params.min ? Number(params.min) : null; const max = params.max ? Number(params.max) : null
      let order = 'p.created_at DESC'; if(params.sort==='price_asc') order='p.price ASC'; if(params.sort==='price_desc') order='p.price DESC'; if(params.sort==='name') order='p.name ASC'
      const rows = await sql.query(`SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='PUBLISHED' AND ($1::text IS NULL OR p.name ILIKE $1 OR p.sku ILIKE $1) AND ($2::text IS NULL OR c.slug=$2) AND ($3::numeric IS NULL OR p.price >= $3) AND ($4::numeric IS NULL OR p.price <= $4) ORDER BY ${order} LIMIT $5 OFFSET $6`, [search,category,min,max,limit,offset])
      return json({data:rows,page:Number(params.page||1),limit})
    }

    if (p[0] === 'products' && p.length === 2 && req.method === 'GET') {
      const rows = await sql`SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=${Number(p[1])} AND p.status <> 'ARCHIVED' LIMIT 1`
      return rows[0] ? json({data:rows[0]}) : json({message:'Product not found'},404)
    }

    if (p[0] === 'admin' && p[1] === 'categories') {
      if (req.method === 'GET') { const rows=await sql`SELECT c.*,COUNT(p.id)::int AS product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`; return json({data:rows}) }
      if (req.method === 'POST') { const b=await body(req); const rows=await sql`INSERT INTO categories(name,slug,image_url,parent_id,active) VALUES(${b.name},${b.slug},${b.image_url||null},${b.parent_id||null},${b.active!==false}) RETURNING *`; return json({data:rows[0]},201) }
      if (p.length===3 && req.method==='PATCH') { const b=await body(req); const rows=await sql`UPDATE categories SET name=COALESCE(${b.name},name),slug=COALESCE(${b.slug},slug),image_url=COALESCE(${b.image_url},image_url),parent_id=${b.parent_id||null},active=COALESCE(${b.active},active),updated_at=NOW() WHERE id=${Number(p[2])} RETURNING *`; return rows[0]?json({data:rows[0]}):json({message:'Category not found'},404) }
      if (p.length===3 && req.method==='DELETE') { const used=await sql`SELECT COUNT(*)::int AS count FROM products WHERE category_id=${Number(p[2])}`; if(used[0].count>0)return json({message:'Category cannot be deleted while it has products'},409); await sql`DELETE FROM categories WHERE id=${Number(p[2])}`; return new Response(null,{status:204}) }
    }

    if (p[0] === 'admin' && p[1] === 'products') {
      if (req.method === 'GET' && p.length === 3) { const rows=await sql`SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=${Number(p[2])} LIMIT 1`; return rows[0]?json({data:rows[0]}):json({message:'Product not found'},404) }
      if (req.method === 'GET') { const params=q(req); const rows=await sql`SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC`; return json({data:rows}) }
      if (req.method === 'POST' || (p.length===3 && req.method==='PATCH')) { const b=await body(req); if(!b.name||!b.category_id)return json({message:'Name and category are required'},400); if(req.method==='POST'){const rows=await sql`INSERT INTO products(name,brand,sku,category_id,description,image_url,price,cost,discount,stock,threshold,weight,status) VALUES(${b.name},${b.brand||null},${b.sku||null},${Number(b.category_id)},${b.description||null},${b.image_url||null},${Number(b.price||0)},${Number(b.cost||0)},${Number(b.discount||0)},${Number(b.stock||0)},${Number(b.threshold||5)},${Number(b.weight||0)},${b.status||'DRAFT'}) RETURNING *`;return json({data:rows[0]},201)} const rows=await sql`UPDATE products SET name=${b.name},brand=${b.brand||null},sku=${b.sku||null},category_id=${Number(b.category_id)},description=${b.description||null},image_url=${b.image_url||null},price=${Number(b.price||0)},cost=${Number(b.cost||0)},discount=${Number(b.discount||0)},stock=${Number(b.stock||0)},threshold=${Number(b.threshold||5)},weight=${Number(b.weight||0)},status=${b.status||'DRAFT'},updated_at=NOW() WHERE id=${Number(p[2])} RETURNING *`; return rows[0]?json({data:rows[0]}):json({message:'Product not found'},404) }
    }

    if (p[0] === 'admin' && p[1] === 'dashboard' && p[2] === 'summary') {
      const [sales,orders,customers,products,low]=await Promise.all([sql`SELECT COALESCE(SUM(total),0)::numeric AS value FROM orders WHERE status NOT IN ('CANCELLED','REFUNDED')`,sql`SELECT COUNT(*)::int AS value FROM orders`,sql`SELECT COUNT(*)::int AS value FROM customers`,sql`SELECT COUNT(*)::int AS value FROM products WHERE status='PUBLISHED'`,sql`SELECT COUNT(*)::int AS value FROM products WHERE status='PUBLISHED' AND stock <= threshold`]); return json({data:{sales:sales[0].value,orders:orders[0].value,customers:customers[0].value,products:products[0].value,lowStock:low[0].value}})
    }

    return json({message:'Route not found'},404)
  } catch (error) { console.error(error); return json({message:'Internal server error'},500) }
}
