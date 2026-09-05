# VORA Light API

A single Vercel serverless API backed by Neon Postgres. It powers the storefront catalog/categories and the admin category/product flows.

## Deploy
1. Create a Neon Postgres database.
2. Run `schema.sql` in the Neon SQL editor.
3. Import `backend/` as a Vercel project.
4. Add `DATABASE_URL` as a Vercel environment variable.
5. Optionally add `FRONTEND_ORIGIN` with the deployed storefront origin.
6. The API base URL is `https://<project>.vercel.app/api`.

## Main endpoints
- `GET /api/health`
- `GET /api/categories`
- `GET /api/products?q=&category=&sort=&min=&max=&page=&limit=`
- `GET /api/products/:id`
- `GET/POST /api/admin/categories`
- `PATCH/DELETE /api/admin/categories/:id`
- `GET/POST /api/admin/products`
- `GET/PATCH /api/admin/products/:id`
- `GET /api/admin/dashboard/summary`

This is intentionally a light MVP API. Production authentication, RBAC, payments, file storage, rate limiting, and audit logging should be added before exposing admin mutations publicly.
