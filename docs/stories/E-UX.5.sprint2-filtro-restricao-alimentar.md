# E-UX.5 — Filtro Restrição Alimentar

**Epic:** UX Sprint 2 — Features Alto Impacto
**Status:** Dispensado
**Executor:** —
**Prioridade:** —
**Motivo:** Dispensado pelo usuário (feature #9 do plano de pesquisa — fora do escopo do sprint 2)

---

## Story

Como hóspede com restrição alimentar, quero filtrar restaurantes e cafés por opções disponíveis (vegano, vegetariano, sem glúten, etc.) para encontrar rapidamente onde posso comer sem preocupação.

## Acceptance Criteria

- [ ] AC1: Chips de filtro alimentar exibidos apenas quando categoria ativa é `restaurants` ou `cafes`
- [ ] AC2: Filtros disponíveis: Vegano, Vegetariano, Sem Glúten, Sem Lactose, Opções Fit
- [ ] AC3: Filtro funciona por correspondência de tags nos places (`place.tags[]`)
- [ ] AC4: Múltiplos filtros podem ser selecionados simultaneamente (AND logic)
- [ ] AC5: Chips com visual hotel-gold quando ativos, secondary quando inativos
- [ ] AC6: Ao trocar de categoria, filtros alimentares são resetados automaticamente
- [ ] AC7: Contagem de resultados visível: "X lugares encontrados"
- [ ] AC8: Se nenhum lugar atende os filtros, empty state: "Nenhum lugar com essa combinação"

## Dev Notes

### Tags esperadas nos places (já existentes ou a mapear)
```
"vegano" | "vegetariano" | "sem-gluten" | "sem-lactose" | "fit"
```
Os dados em `public/data/places.json` já possuem campo `tags: string[]`. Os filtros fazem match contra esse array. Não é necessário alterar os dados — filtros cujas tags não existirem simplesmente retornam 0 resultados (comportamento correto).

### Componente sugerido
```
src/components/DietaryFilters.tsx
```
Props: `activeFilters: string[]`, `onChange: (filters: string[]) => void`

### Integração em Index.tsx
- Estado: `const [dietaryFilters, setDietaryFilters] = useState<string[]>([])`
- Exibir `<DietaryFilters />` logo abaixo dos chips de categoria, apenas quando `activeCategory === 'restaurants' || activeCategory === 'cafes'`
- Reset: `useEffect(() => setDietaryFilters([]), [activeCategory])`
- Filtro de places: após filtrar por categoria, filtrar adicionalmente por tags se `dietaryFilters.length > 0`
  ```ts
  const filteredPlaces = places.filter(p =>
    dietaryFilters.every(f => p.tags?.includes(f))
  );
  ```

### Visual dos chips
```tsx
<button
  className={cn(
    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
    active
      ? "bg-hotel-gold text-hotel-charcoal border-hotel-gold"
      : "border-hotel-gold/30 text-muted-foreground hover:border-hotel-gold/60"
  )}
>
  {label}
</button>
```

### Contagem de resultados
Exibir `<p className="text-xs text-muted-foreground">{count} lugares encontrados</p>` acima do grid de places, visível apenas quando filtros estiverem ativos.

## Tasks

- [ ] T1: Criar `src/components/DietaryFilters.tsx`
- [ ] T2: Atualizar `src/pages/Index.tsx` — estado `dietaryFilters`, exibição condicional, lógica de filtro AND, contagem

## Dev Agent Record

### Checklist
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Build sem erros (`vite build`)
- [ ] Filtros só aparecem em restaurants/cafes
- [ ] Reset automático ao trocar categoria
- [ ] AND logic funcionando com múltiplos filtros
- [ ] Empty state visível quando sem resultados

### File List
<!-- Preencher durante implementação -->

### Change Log
<!-- Preencher durante implementação -->
