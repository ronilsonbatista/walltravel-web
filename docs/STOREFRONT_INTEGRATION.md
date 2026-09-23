# STOREFRONT_INTEGRATION — walltravel-web × Platform Public API (Phase 13)

## Contract

| Item | Value |
|---|---|
| Env | `WALLTRAVEL_PLATFORM_API_URL` (also `VITE_WALLTRAVEL_PLATFORM_API_URL`) |
| API | `GET /api/public/storefront`, `/categories`, `/:slug` |
| Ownership | Catalog = Platform; home hero/honeymoon copy = Web (local JSON) |
| Fallback | On API failure / missing env → local `data/vitrine.json` + sticky notice |
| Routes | `/vitrine`, `/vitrine/:category`, `/viagens/:slug` (+ `/pacote/:slug` alias) |
| Events | `data/storefront-events.js` — Phase 14 hooks only (`walltravel:storefront`) |

## Local

```bash
# Platform on :3000
cd ~/.walltravel/platform && npm run dev:local

# Web on :5173
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:5173/vitrine and http://127.0.0.1:5173/viagens/lencois-maranhenses

## Out of scope

Analytics dashboard, Mercado Pago, client login, Meta, WhatsApp API, Maya, Phase 14 ingestion.
