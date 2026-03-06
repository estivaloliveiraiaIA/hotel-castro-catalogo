# E-UX.8 — Página "Recomendados pelo Hotel"

**Epic:** UX Sprint 4 — Diferenciação Premium
**Status:** Ready for Review
**Executor:** @dev (Dex)
**Prioridade:** Alta

---

## Story

Como hóspede, quero acessar uma página dedicada e visualmente premium com os lugares favoritos do Castro's Park Hotel, para descobrir rapidamente o que o hotel considera as melhores experiências em Goiânia.

## Acceptance Criteria

- [ ] AC1: Página `/recomendados` com hero section elegante (fundo escuro, ornamentos dourados)
- [ ] AC2: Filtro por categoria (chips: Todos, Restaurantes, Cafés, Bares, Atrações...)
- [ ] AC3: Grid responsivo de PlaceCards (1 col mobile, 2 tablet, 3 desktop)
- [ ] AC4: Badge "✦ Hotel Pick" dourado em cada card
- [ ] AC5: Parceiros com destaque visual de vantagem exclusiva
- [ ] AC6: Header desktop — link "Recomendados" no nav superior
- [ ] AC7: BottomNav mobile — "Favoritos" aponta para `/recomendados` (em vez de scroll)
- [ ] AC8: Seção na home mantida como está

## Dev Notes

### Rota
`/recomendados` — lazy loaded em App.tsx

### Dados
```ts
const { data } = usePlaces();
const recomendados = data?.places
  .filter((p) => p.hotelRecommended)
  .sort((a, b) => (b.hotelScore ?? 0) - (a.hotelScore ?? 0)) ?? [];
```

### Estrutura da página
```
<Header />
<HeroSection />          ← fundo hotel-charcoal, ornamento ✦, badge "Seleção do Hotel"
<FiltroCategorias />     ← chips horizontais, estado local
<GridRecomendados />     ← PlaceCard com badge hotel-gold
<Footer simples />
```

### Hero
```tsx
<section className="bg-hotel-charcoal text-white py-16 md:py-24">
  {/* ornamento dourado + badge + h1 + subtítulo */}
</section>
```

### Navegação desktop (Header.tsx)
```tsx
<Link to="/recomendados" className="...">Recomendados</Link>
```

### Navegação mobile (BottomNav.tsx)
Alterar item "Favoritos":
```ts
{ label: "Favoritos", href: "/recomendados", icon: Heart }
// remover scrollTo — agora é rota direta
```

## Tasks

- [x] T1: Criar `src/pages/Recomendados.tsx` — hero + filtro + grid
- [x] T2: Atualizar `src/App.tsx` — rota lazy `/recomendados`
- [x] T3: Atualizar `src/components/Header.tsx` — link "Recomendados" no nav desktop
- [x] T4: Atualizar `src/components/BottomNav.tsx` — "Favoritos" → `/recomendados`

## Dev Agent Record

### Checklist
- [x] TypeScript sem erros (`tsc --noEmit`)
- [x] Build sem erros (`vite build`)
- [x] Página acessível em `/recomendados`
- [x] Filtro por categoria funcional
- [x] Link no Header desktop visível
- [x] BottomNav "Favoritos" navega para `/recomendados`

### File List
- `src/pages/Recomendados.tsx` — CRIADO
- `src/App.tsx` — MODIFICADO (rota lazy /recomendados)
- `src/components/Header.tsx` — MODIFICADO (link Recomendados no nav desktop)
- `src/components/BottomNav.tsx` — MODIFICADO (Favoritos → /recomendados)

### Change Log
- feat: E-UX.8 — Página premium /recomendados com hero, filtros e grid
