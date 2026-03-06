# E-UX.6 — Redesign Reviews (Place.tsx)

**Epic:** UX Sprint 2 — Features Alto Impacto
**Status:** Ready for Dev
**Executor:** @dev (Dex)
**Prioridade:** Média

---

## Story

Como hóspede, quero ver as avaliações de outros visitantes de forma elegante e legível na página de detalhes do lugar, transmitindo confiança através de um design premium condizente com a experiência do hotel.

## Acceptance Criteria

- [ ] AC1: Seção "O que dizem" com design completamente redesenhado — remover visual de lista simples
- [ ] AC2: Cada review em card individual com aspas tipográficas estilizadas (font-serif, hotel-gold)
- [ ] AC3: Máximo de 3 reviews exibidas por padrão (era 4)
- [ ] AC4: Botão "Ver mais avaliações" quando houver mais de 3, expande inline (sem nova página)
- [ ] AC5: Rating do lugar (estrelas) exibido de forma proeminente no topo da seção
- [ ] AC6: Label de fonte discreta abaixo de cada review ("via Google", "via TripAdvisor") se `review.url` disponível
- [ ] AC7: Seção tem separador visual elegante (linha hotel-gold/20) antes do título
- [ ] AC8: Empty state se sem reviews: seção não renderiza (já existente — manter)

## Dev Notes

### Localização
`src/pages/Place.tsx` — bloco `{place.reviews && place.reviews.length > 0 && (...)}`

### Layout de cada review card
```tsx
<li className="rounded-xl bg-card border border-border/50 p-5 space-y-3">
  {/* Aspas decorativas */}
  <span className="font-serif text-4xl leading-none text-hotel-gold/40 select-none">"</span>
  {/* Texto da review */}
  <p className="text-sm text-foreground/80 leading-relaxed font-serif italic -mt-2">
    {review.text}
  </p>
  {/* Footer da review */}
  {review.url && (
    <a href={review.url} target="_blank" rel="noreferrer"
       className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
      via Google Maps ↗
    </a>
  )}
</li>
```

### Rating prominente
Antes da lista de reviews, exibir:
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="flex">
    {/* 5 estrelas — preenchidas de acordo com place.rating */}
  </div>
  <span className="font-serif text-2xl font-semibold">{place.rating.toFixed(1)}</span>
  <span className="text-sm text-muted-foreground">({place.reviewCount} avaliações)</span>
</div>
```
Remover rating duplicado da sidebar (Card de Informações) — manter apenas aqui.

### "Ver mais" expand
```tsx
const [showAllReviews, setShowAllReviews] = useState(false);
const visibleReviews = showAllReviews ? place.reviews : place.reviews.slice(0, 3);
```
Botão ghost pequeno: "Ver todas as {n} avaliações ↓" / "Mostrar menos ↑"

### Separador da seção
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="h-px flex-1 bg-hotel-gold/20" />
  <span className="text-xs uppercase tracking-widest text-hotel-gold/60 font-medium">O que dizem</span>
  <div className="h-px flex-1 bg-hotel-gold/20" />
</div>
```

### Detectar fonte da review
```ts
function getReviewSource(url?: string): string {
  if (!url) return "";
  if (url.includes("google")) return "via Google";
  if (url.includes("tripadvisor")) return "via TripAdvisor";
  return "ver avaliação";
}
```

## Tasks

- [ ] T1: Atualizar `src/pages/Place.tsx` — redesign completo da seção de reviews
  - Rating prominente no topo da seção
  - Cards de review com aspas tipográficas
  - Expand "ver mais" com useState
  - Separador visual hotel-gold
  - Fonte da review (Google/TripAdvisor)
  - Remover rating duplicado da sidebar

## Dev Agent Record

### Checklist
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Build sem erros (`vite build`)
- [ ] Máx 3 reviews visíveis por padrão
- [ ] Expand/collapse funcional
- [ ] Rating removido da sidebar (sem duplicata)
- [ ] Empty state mantido (seção não renderiza sem reviews)

### File List
<!-- Preencher durante implementação -->

### Change Log
<!-- Preencher durante implementação -->
