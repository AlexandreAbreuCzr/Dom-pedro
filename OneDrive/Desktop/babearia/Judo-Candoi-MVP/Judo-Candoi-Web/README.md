# Judo-Candoi-Web

Landing page do Judô Candói em React + Vite.

## Stack
- React 19
- Vite 7
- TypeScript

## Executar localmente
```powershell
npm install
npm run dev
```

App em `http://localhost:5173`.
- Painel admin em `http://localhost:5173/?admin=1`

## Configuracao de API
Crie um `.env` com base no `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

No backend, configure `ADMIN_PASSWORD` para definir a senha compartilhada do painel.

## Build
```powershell
npm run build
npm run preview
```

## Observacao
As imagens em `public/images` sao placeholders SVG para MVP. Troque por fotos reais da academia para a versao final.
