# Story E-PERF.1: Sprint 1 — Performance e Arquitetura Base

## Status
Ready for Dev

## Executor Assignment
```
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["build", "typecheck", "lint"]
```

## Story
**As a** hóspede do Castro's Park Hotel,
**I want** que o app carregue rapidamente e não faça requisições desnecessárias ao servidor,
**so that** a experiência seja fluida mesmo em conexões lentas (rede do hotel, roaming internacional).

## Acceptance Criteria
1. `QueryClient` em `App.tsx` tem `defaultOptions` com `refetchOnWindowFocus: false`, `staleTime: 1000 * 60 * 5`, `retry: 1`
2. `PlaceCard` não chama `usePartners()` diretamente — o dado de partner é resolvido e passado como prop pelo componente pai
3. Rotas `/place/:id`, `/events`, `/itineraries`, `/itinerary/:id` são lazy-loaded com `React.lazy()` e `<Suspense>` com skeleton fallback adequado
4. `apify-client`, `better-sqlite3` e `cheerio` movidos de `dependencies` para `devDependencies` em `package.json`
5. App builda sem erros de TypeScript
6. Bundle do build não regride (verificar que `recharts` não aumentou — ele deve aparecer apenas no chunk admin)

## Tasks / Subtasks

- [ ] **T1 — QueryClient com defaultOptions**
  - [ ] Em `App.tsx` linha 25: substituir `new QueryClient()` por:
    ```ts
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })
    ```
  - [ ] Verificar que hooks individuais (usePlaces, useEvents, etc.) com staleTime próprio continuam sobrescrevendo corretamente o default

- [ ] **T2 — usePartners() fora do PlaceCard**
  - [ ] Em `PlaceCard.tsx`: remover `import { usePartners }` e a chamada `usePartners()`
  - [ ] Adicionar prop opcional `partner?: Partner` na interface `PlaceCardProps`
  - [ ] Substituir a lógica `partners?.find(p => p.placeId === place.id)` pela prop `partner`
  - [ ] Em `PlaceSection.tsx`: verificar se recebe lista de partners ou se precisa receber
  - [ ] Em `Index.tsx`: resolver o partner para cada place antes de renderizar o PlaceCard (usando `partners?.find(...)`) e passar como prop
  - [ ] Garantir que a badge de parceiro ainda aparece corretamente

- [ ] **T3 — Lazy loading de rotas públicas**
  - [ ] Em `App.tsx`: converter imports diretos para `React.lazy()`:
    ```ts
    const Place = React.lazy(() => import("@/pages/Place"));
    const Events = React.lazy(() => import("@/pages/Events"));
    const Itineraries = React.lazy(() => import("@/pages/Itineraries"));
    const Itinerary = React.lazy(() => import("@/pages/Itinerary"));
    ```
  - [ ] Envolver cada rota lazy em `<Suspense fallback={<PageSkeleton />}>` (ou skeleton específico por página)
  - [ ] Criar `src/components/PageSkeleton.tsx`: layout genérico de skeleton para páginas (header + hero placeholder + grid placeholder)
  - [ ] Manter `Index` e `NotFound` como eager (carregamento imediato)

- [ ] **T4 — Mover dependências de ingestão para devDependencies**
  - [ ] Em `package.json`: mover `apify-client`, `better-sqlite3`, `cheerio` de `dependencies` para `devDependencies`
  - [ ] Rodar `npm install` para atualizar `package-lock.json`
  - [ ] Verificar que o build continua passando (esses pacotes não devem ser importados em nenhum arquivo do `src/`)

## Dev Notes

### T1 — QueryClient config
```tsx
// App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min default
      refetchOnWindowFocus: false,    // não refetcha ao trocar de aba
      retry: 1,                       // 1 retry em caso de erro
    },
  },
});
```
Os hooks que definem `staleTime` próprio (ex: `useEvents` com 10min) continuam sobrescrevendo o default — React Query usa o mais específico.

### T2 — PlaceCard sem usePartners
```tsx
// PlaceCard.tsx — antes
const { data: partners } = usePartners();
const partner = partners?.find(p => p.placeId === place.id);

// PlaceCard.tsx — depois
interface PlaceCardProps {
  place: Place;
  partner?: Partner; // novo prop opcional
}
export const PlaceCard = ({ place, partner }: PlaceCardProps) => {
  // usar `partner` diretamente, sem hook
};
```

```tsx
// Em PlaceSection.tsx (verificar se recebe partners)
// Em Index.tsx — resolver antes de renderizar:
{curatedTop.map((place) => (
  <PlaceCard
    key={place.id}
    place={place}
    partner={partners?.find(p => p.placeId === place.id)}
  />
))}
```

### T3 — Lazy loading e PageSkeleton
```tsx
// PageSkeleton.tsx — skeleton genérico de página
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <div className="h-16 bg-muted/30 border-b" />
    <div className="h-48 bg-muted/20" />
    <div className="container px-4 py-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <div className="aspect-[4/3] bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

### Verificação de bundle
Após o build, verificar no output do Vite se `recharts` aparece apenas nos chunks admin:
```
dist/assets/AdminDashboard-*.js  ← recharts deve estar aqui
dist/assets/index-*.js           ← recharts NÃO deve estar aqui
```

## Change Log
| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 2026-03-06 | 1.0 | Story criada por Orion (@aiox-master) — Sprint 1 Performance | aiox-master |
