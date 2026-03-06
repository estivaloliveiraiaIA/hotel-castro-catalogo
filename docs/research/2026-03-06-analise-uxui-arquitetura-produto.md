# Análise Completa — UX/UI, Arquitetura e Produto
**Castro's Park Hotel — Guia Digital Goiânia**
**Data:** 2026-03-06
**Equipe:** @ux-design-expert (Uma) + @architect (Aria) + @analyst (Alex)
**Orquestrador:** Orion (@aiox-master)

---

## Diagnóstico Geral

O app está acima da média do mercado hoteleiro brasileiro — cobre as 10 features universais de luxury hotels, tem Concierge IA funcional, design tokens consistentes e curadoria genuína.

| Categoria | Severidade máxima | Itens |
|-----------|-------------------|-------|
| UX/UI | CRÍTICO | 3 críticos, 6 altos, 6 médios |
| Arquitetura | CRÍTICO | 3 críticos, 5 altos, 6 médios |
| Produto/Features | ALTA | 10 features novas priorizadas |

---

## UX/UI — Problemas Identificados

### CRÍTICOS
- **C1** — Sem navegação mobile: `<nav className="hidden md:flex">` — usuário no smartphone não navega além da home
- **C2** — Hero sem CTA: nenhum elemento interativo no Hero
- **C3** — Loading states genéricos: texto sem tratamento de marca

### ALTOS
- **A1** — 14 seções sequenciais na home sem hierarquia (ferramentas + conteúdo misturados)
- **A2** — QuickActions duplicam CategoryTabs + usam emojis (quebra tom de luxo)
- **A3** — Cards sem status aberto/fechado visível
- **A4** — Reviews em Place.tsx sem tratamento editorial
- **A5** — Sem skeleton screens (layout shift)
- **A6** — Aspect ratio 4/3 fixo em todos os cards

### MÉDIOS
- **M1** — Concierge sem persistência de sessão
- **M2** — `updatedAt` no Hero com opacity 40% (ilegível e sem valor para hóspede)
- **M3** — Sem favoritos/salvos
- **M4** — Footer sem links úteis (recepção, WiFi)
- **M5** — Tags filtradas com lógica hardcoded no PlaceCard
- **M6** — `referrerPolicy="no-referrer"` pode quebrar imagens

### Recomendações UX — Ordenadas por Impacto
1. Bottom navigation bar mobile (4 itens: Descobrir · Roteiros · Concierge · Eventos)
2. Skeleton screens substituindo text loading
3. Remover emojis das QuickActions → ícones Lucide
4. Elevar padding das seções (py-8 → py-12/py-16)
5. Redesenhar reviews com tratamento editorial (border-l hotel-gold, serif)
6. Hero com imagem de fundo de Goiânia + CTA contextual
7. Dot de status aberto/fechado nos cards (dado já existe em openStatusText)
8. Consolidar ou remover QuickActions (duplicam CategoryTabs)

---

## Arquitetura — Problemas Identificados

### CRÍTICOS
- **C1** — `QueryClient` sem `defaultOptions`: `refetchOnWindowFocus: true` por padrão causa refetches agressivos em dados quasi-estáticos
- **C2** — `usePartners()` chamado por instância de PlaceCard: até 60 subscriptions simultâneas desnecessárias
- **C3** — `apify-client`, `better-sqlite3`, `cheerio` em `dependencies` (deveriam ser devDependencies)

### ALTOS
- **H1** — `Index.tsx` com 505 linhas — God Component
- **H2** — Rotas públicas (Events, Itineraries, Itinerary, Place) não são lazy-loaded
- **H3** — `recharts` e `react-day-picker` possivelmente no bundle principal (usados só no admin)
- **H4** — Sem PWA / Service Worker
- **H5** — Sem nenhum teste no projeto

### MÉDIOS
- **M1** — `applyFilters` não é memoizada adequadamente
- **M2** — `rowToPlace` usa casting unsafe sem validação Zod
- **M3** — Duplo sistema de toast (Radix + Sonner) montados simultaneamente
- **M4** — `src/data/mockPlaces.ts` arquivo morto
- **M5** — `next-themes` instalado mas dark mode não implementado
- **M6** — Categoria mapeada com if/else hardcoded (deveria ser objeto CATEGORY_LABELS)

### Roadmap Técnico Priorizado
**P0 (< 1h cada):**
1. QueryClient com defaultOptions (refetchOnWindowFocus: false, retry: 1)
2. Mover usePartners() para fora do PlaceCard
3. Mover apify-client, better-sqlite3, cheerio para devDependencies

**P1 (1-2 dias cada):**
4. Lazy loading de rotas públicas com skeleton fallbacks
5. Skeleton loading states estruturais
6. PWA com vite-plugin-pwa

**P2 (3-5 dias cada):**
7. Supabase Realtime para eventos
8. Virtualização da lista (react-virtual) para 60 cards
9. Cache do concierge serverless (Edge Cache ou Upstash Redis)
10. Refactor Index.tsx (God Component → hooks)

---

## Produto/Features — Gap Analysis

### Features Universais (já implementadas — ✅)
Todas as 10 features universais de hotel de luxo estão presentes:
listagem curada, direções, horários, ratings, concierge, recomendações do hotel, galeria, filtros, eventos, parceiros.

### Gaps Críticos (hóspede sente falta)
| Gap | Impacto |
|-----|---------|
| Mapa interativo integrado | ALTO |
| Concierge multi-turno (memória de sessão) | ALTO |
| Favoritos/salvos ("Minha Goiânia") | ALTO |
| Versão em inglês | MÉDIO-ALTO |
| "Hoje no Hotel" (eventos internos) | ALTO |
| Status em tempo real dos estabelecimentos | MÉDIO |

### Top 10 Features Novas — Priorizadas por Impacto × Viabilidade

| # | Feature | Esforço | Prioridade |
|---|---------|---------|------------|
| 1 | Favoritos / "Minha Goiânia" (localStorage) | P | ALTA |
| 2 | Concierge Multi-Turno (memória de sessão) | M | ALTA |
| 3 | Mapa Interativo (/mapa) | M | ALTA |
| 4 | Versão em Inglês (i18n PT/EN) | M | ALTA |
| 5 | "Hoje no Hotel" (scope: hotel nos events) | P | ALTA |
| 6 | Filtro Restrição Alimentar | P | ALTA |
| 7 | Personalização por Perfil de Viagem | M | MÉDIA-ALTA |
| 8 | Adicionar ao Calendário (.ics) | P | MÉDIA |
| 9 | QR Code /welcome | P | MÉDIA |
| 10 | Avaliação Pós-Visita ("Curtiu?") | M | MÉDIA |

---

## Roadmap de Execução

### Sprint 1 — Qualidade Base (stories: E-UX.2 + E-PERF.1)
- Bottom navigation mobile
- Skeleton loading screens
- Remover emojis QuickActions
- Hero com CTA
- Status aberto/fechado no card
- QueryClient defaultOptions
- usePartners() refactor
- Lazy loading de rotas públicas

### Sprint 2 — Features Alto Impacto (stories a criar)
- Favoritos "Minha Goiânia"
- "Hoje no Hotel"
- Filtro restrição alimentar
- Status aberto/fechado no card (se não feito no Sprint 1)
- Redesign reviews Place.tsx

### Sprint 3 — Diferenciação de Mercado (stories a criar)
- Concierge multi-turno
- Mapa Interativo (/mapa)
- Versão em inglês
- Personalização por perfil de viagem
- PWA + Offline Support

### Sprint 4+ — Backlog Estratégico
- Adicionar evento ao calendário (.ics)
- QR Code /welcome
- Avaliação pós-visita
- Realtime Supabase para eventos
- Sugestão proativa do Concierge
- Botão WhatsApp fixo → recepção
- Refactor Index.tsx (God Component)

---

## Oportunidades de Diferenciação Regional

1. **Primeiro concierge IA multi-turno da hotelaria goiana** — janela de 12-18 meses
2. **Guia editorial de Goiânia como ativo de marca** — Roteiros são o embrião
3. **Integração físico-digital no check-in via QR Code** — ainda raro em boutique BR
4. **Dataset proprietário de comportamento do hóspede** — favoritos + avaliações + perfil

---

*Gerado por equipe AIOX: @ux-design-expert (Uma), @architect (Aria), @analyst (Alex)*
*Orquestrado por Orion (@aiox-master) — 2026-03-06*
