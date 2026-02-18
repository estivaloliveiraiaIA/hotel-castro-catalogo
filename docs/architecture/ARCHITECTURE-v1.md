# 🏨 Castro's Park Hotel — Guia Digital
## Arquitetura Técnica v1

---

## Stack atual
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn-ui
- **Dados:** JSON estático (`places.json`, `curation.json`)
- **Deploy:** GitHub Pages via GitHub Actions
- **Fontes de dados:** Google Maps API, Apify, TripAdvisor (scripts de ingestão)

## Stack pós-roadmap (projetada)

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│  React 18 + TypeScript + Vite               │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Roteiros│ │  Mapa    │ │ Concierge   │  │
│  │ F1      │ │  F3      │ │ IA (F2)     │  │
│  └─────────┘ └──────────┘ └──────┬──────┘  │
│  ┌─────────┐ ┌──────────┐        │         │
│  │ Eventos │ │Parceiros │        │         │
│  │ F7      │ │ F8       │        │         │
│  └─────────┘ └──────────┘        │         │
│  ┌─────────┐ ┌──────────┐        │         │
│  │  i18n   │ │ Welcome  │        │         │
│  │  F6     │ │ QR (F9)  │        │         │
│  └─────────┘ └──────────┘        │         │
│                                   │         │
│  ┌────────────────────────────────▼──────┐  │
│  │         Camada de Dados               │  │
│  │  places.json | itineraries.json       │  │
│  │  events.json | embeddings.json        │  │
│  │  pt.json | en.json                    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
            GitHub Pages (CDN)
                    │
         ┌──────────┴──────────┐
         │   OpenAI API        │
         │   (Concierge IA)    │
         └─────────────────────┘
```

## Decisões arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Deploy | GitHub Pages (estático) | Custo zero, performance máxima, já configurado |
| Mapa | Leaflet + OpenStreetMap | Gratuito, leve, customizável |
| i18n | react-i18next | Padrão de mercado, tree-shakeable |
| Concierge IA | Client-side RAG (MVP) | Sem backend adicional, custo por query mínimo |
| Embeddings | Pré-computados em build | Sem infra extra, atualiza com CI/CD |
| Contatos | Enriquecimento via Google Places | Dados oficiais, alta cobertura |

## Estrutura de dados ampliada

```
data/
  places.json          # 500+ lugares (existente)
  curation.json        # Top 30 curados (existente)
  itineraries.json     # Roteiros temáticos (F1 — novo)
  events.json          # Eventos da semana (F7 — novo)
  place-embeddings.json # Embeddings para Concierge (F2 — novo)
src/
  i18n/
    locales/
      pt.json          # Strings PT (F6 — novo)
      en.json          # Strings EN (F6 — novo)
```

## Novas rotas

| Rota | Feature | Componente |
|------|---------|-----------|
| `/` | Home (existente + seções novas) | `Index.tsx` |
| `/place/:id` | Detalhe do lugar (existente) | `PlacePage.tsx` |
| `/itineraries` | Lista de roteiros | `ItinerariesPage.tsx` (F1) |
| `/itinerary/:id` | Roteiro completo | `ItineraryPage.tsx` (F1) |
| `/map` | Mapa interativo | `MapPage.tsx` (F3) |
| `/events` | Agenda de eventos | `EventsPage.tsx` (F7) |
| `/partners` | Parceiros especiais | `PartnersPage.tsx` (F8) |
| `/welcome` | Landing QR Code | `WelcomePage.tsx` (F9) |

## Dependências novas (projetadas)

```json
{
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.x",
  "react-i18next": "^14.x",
  "i18next": "^23.x",
  "openai": "^4.x",
  "qrcode.react": "^3.x"
}
```

## CI/CD atualizado
1. Push para `main`
2. GitHub Actions:
   - `npm run build`
   - (novo) `npm run generate-embeddings` se places.json mudou
   - Deploy para GitHub Pages
3. QA gate: Lighthouse CI ≥ 90

---

*Documento gerado por Orion (aios-master) em 2026-02-18.*
