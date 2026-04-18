# Judo-Candoi-Api-Light

Backend leve em Node.js (Express + JSON file) compativel com as mesmas rotas do backend Spring atual.

## Requisitos
- Node.js 20+

## Rodar local (sem Docker)
```powershell
cd Judo-Candoi-Api-Light
npm install
npm run dev
```

API em `http://localhost:8080`.

## Variaveis de ambiente
- `PORT` (default: `8080`)
- `ADMIN_PASSWORD` (default: `1234`)
- `CORS_ALLOWED_ORIGINS` (default: `http://localhost:5173`)
- `DB_FILE` (default: `data/db.json`)
- `UPLOAD_DIR` (default: `uploads`)
- `UPLOAD_MAX_SIZE_BYTES` (default: `15728640`)
- `WHATSAPP_NUMBER`
- `INSTAGRAM_HANDLE`
- `ACADEMY_ADDRESS`
- `GOOGLE_MAPS_EMBED`

## Endpoints principais
- `GET /api/v1/site/content`
- `POST /api/v1/leads/experimental-class`
- `GET /api/v1/leads/experimental-class`
- `GET /api/v1/uploads/images/{id}`
- `GET /api/v1/uploads/images/{id}/{fileName}`

## Admin (`X-Admin-Password`)
- `GET /api/v1/admin/auth/check`
- `GET/PUT /api/v1/admin/site-settings`
- `GET/POST/PUT/DELETE /api/v1/admin/blog-posts`
- `GET/POST/PUT/DELETE /api/v1/admin/pride-students`
- `GET/POST/PUT/DELETE /api/v1/admin/sponsors`
- `POST /api/v1/admin/uploads/images`

## Persistencia
- Dados estruturados em `data/db.json`
- Imagens em `uploads/<pasta>/<arquivo>`

