# Castro's Park Hotel — Guia Digital
## Arquitetura Tecnica v1

**Ultima revisao:** 2026-03-05 (Sprint Change Proposal — correct-course)

---

## Stack atual (real)

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui | SPA |
| Deploy | Vercel | Auto-deploy no push para main |
| Backend | Vercel Serverless Functions (ES modules) | Pasta api/ |
| Banco de dados | Supabase PostgreSQL | Service role no server, anon no frontend |
| Storage | Supabase Storage | Bucket hotel-images para uploads |
| Admin | React.lazy() — bundle isolado | Nao afeta bundle principal |

---

## Diagrama de arquitetura

```
FRONTEND (Vercel CDN)
  React 18 + TypeScript + Vite
  ┌─────────────┬──────────────┬─────────────────┐
  │  App Guest  │  App Admin   │  Concierge IA   │
  │  (bundle    │  (lazy load  │  (E2.3 - futuro)│
  │   principal)│   /admin)    │                  │
  └──────┬──────┴──────┬───────┴────────┬─────────┘
         │             │                │
         │      VERCEL FUNCTIONS (api/) │
         │      ┌──────┴───────┐        │
         │      │ /api/admin/* │        │
         │      │ login        │        │
         │      │ stats        │   /api/concierge
         │      │ places CRUD  │   (E2.3 - futuro)
         │      │ events CRUD  │        │
         │      │ itineraries  │        │
         │      │ partners     │        │
         │      │ upload       │        │
         │      └──────┬───────┘        │
         │             │                │
         └─────────────┴────────────────┘
                       │
              SUPABASE (PostgreSQL + Storage)
              ┌─────────────────────────────┐
              │  places                     │
              │  itineraries                │
              │  itinerary_places           │
              │  events                     │
              │  partners                   │
              │                             │
              │  Storage: hotel-images      │
              └─────────────────────────────┘
                       │
              LLM API (E2.3 - futuro)
              Gemini 2.0 Flash ou Claude Haiku
```

---

## Variaveis de ambiente

| Variavel | Escopo | Descricao |
|----------|--------|-----------|
| VITE_SUPABASE_URL | Frontend (publico) | URL do projeto Supabase |
| VITE_SUPABASE_ANON_KEY | Frontend (publico) | Chave anonima (respeita RLS) |
| SUPABASE_SERVICE_ROLE_KEY | Server only (secreto) | Acesso total — apenas nas Vercel Functions |
| ADMIN_PASSWORD | Server only (secreto) | Senha do painel admin |
| LLM_API_KEY | Server only (secreto) | Chave do provider LLM (E2.3) |
| LLM_PROVIDER | Server only | "gemini" ou "claude" (E2.3) |

---

## Estrutura do banco de dados (Supabase)

```sql
places
  id, name, category, subcategory, description,
  address, phone, website, photo_url,
  rating, price_level, lat, lng,
  is_active, hotel_recommended,
  created_at, updated_at

itineraries
  id, title, subtitle, icon, cover_image,
  duration, best_time, profile, tips (jsonb),
  is_active, created_at

itinerary_places
  id, itinerary_id (fk), place_id (fk),
  order_index, note, suggested_time

events
  id, title, description, location, image,
  start_date, end_date, link, is_active,
  created_at

partners
  id, name, description, logo_url, website,
  category, discount_info, is_active,
  created_at
```

---

## Estrutura de arquivos

```
castro-park-discover/
  api/
    _lib/
      auth.js           # Token auth helpers
      supabase.js       # Supabase admin client
    admin/
      login.js          # POST /api/admin/login
      stats.js          # GET  /api/admin/stats
      places.js         # CRUD /api/admin/places
      events.js         # CRUD /api/admin/events
      itineraries.js    # CRUD /api/admin/itineraries
      partners.js       # CRUD /api/admin/partners
      upload.js         # POST /api/admin/upload
  src/
    pages/
      Index.tsx         # Home — entrada principal do hóspede
      Place.tsx         # Detalhe de lugar
      Itineraries.tsx   # Lista de roteiros
      Itinerary.tsx     # Detalhe de roteiro
      admin/            # Painel admin (lazy loaded)
        AdminLogin.tsx
        AdminLayout.tsx
        AdminDashboard.tsx
        AdminPlaces.tsx
        AdminEvents.tsx
        AdminItineraries.tsx
        AdminPartners.tsx
    hooks/
      useAdminApi.ts    # Hook compartilhado para chamadas admin
    lib/
      supabase.ts       # Supabase client frontend (anon key)
```

---

## Rotas

| Rota | Componente | Descricao |
|------|-----------|-----------|
| / | Index.tsx | Home — busca, atalhos, lugares em destaque |
| /place/:id | Place.tsx | Detalhe do lugar |
| /itineraries | Itineraries.tsx | Lista de roteiros |
| /itinerary/:id | Itinerary.tsx | Detalhe do roteiro |
| /admin | AdminLayout + AdminDashboard | Dashboard admin |
| /admin/login | AdminLogin | Login admin |
| /admin/places | AdminPlaces | CRUD lugares |
| /admin/events | AdminEvents | CRUD eventos |
| /admin/itineraries | AdminItineraries | CRUD roteiros |
| /admin/partners | AdminPartners | CRUD parceiros |
| /events | (E3.1 — futuro) | Agenda de eventos publica |
| /partners | (E3.2 — futuro) | Parceiros especiais |
| /welcome | (E4.3 — futuro) | Landing page QR Code |

---

## Decisoes arquiteturais

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Deploy | Vercel | CI/CD simples, serverless functions integradas, free tier generoso |
| Backend | Vercel Functions | Sem servidor para gerenciar, co-localizado com o frontend |
| Banco | Supabase PostgreSQL | Hosted, RLS nativo, Storage incluso, SDK TypeScript |
| Admin auth | base64(password) | Suficiente para MVP single-admin, sem complexidade de JWT |
| Admin bundle | React.lazy() | Isola codigo do admin — erros nao afetam hóspedes |
| Concierge IA | Opcao B — API backend | Vercel Functions ja disponivel, mais robusto que client-side RAG |
| LLM provider | Gemini 2.0 Flash (principal) | Custo minimo, velocidade alta, bom em portugues |

---

## Evolucao planejada

| Feature | Epic | Componentes novos |
|---------|------|------------------|
| Concierge IA | E2.3 | api/concierge.js, ConciergeChat.tsx, useConcierge.ts |
| Agenda de eventos | E3.1 | pages/Events.tsx |
| Parceiros especiais | E3.2 | pages/Partners.tsx, badge em PlaceCard |
| Versao em ingles | E4.2 | i18n/locales/pt.json + en.json |
| QR Code / Welcome | E4.3 | pages/Welcome.tsx |

---

Documento mantido por Orion (aiox-master).
Ultima atualizacao: 2026-03-05 via Sprint Change Proposal (correct-course).
