# E-UX.3 — Favoritos "Minha Goiânia"

**Epic:** UX Sprint 2 — Features Alto Impacto
**Status:** Ready for Review
**Executor:** @dev (Dex)
**Prioridade:** Alta

---

## Story

Como hóspede, quero salvar lugares favoritos para criar meu roteiro pessoal de Goiânia, podendo revisitar rapidamente os locais que mais me interessaram durante a estadia.

## Acceptance Criteria

- [x] AC1: Ícone de coração no PlaceCard (canto superior direito da imagem) — clicável, toggle on/off
- [x] AC2: Favoritos persistidos em `localStorage` com chave `castro_favorites` (array de IDs)
- [x] AC3: Estado do coração sincronizado em toda a UI (PlaceCard e Place detail)
- [x] AC4: BottomNav atualizado — item "Favoritos" com Heart icon, rota `/favorites`
- [x] AC5: Página `/favorites` exibe grid de PlaceCards dos lugares salvos
- [x] AC6: Empty state elegante: "Ainda não há favoritos — explore o guia"
- [x] AC7: Coração preenchido (hotel-gold) = favoritado; vazio = não favoritado
- [x] AC8: Animação suave ao favoritar (scale + fill transition)

## Dev Notes

### Estrutura
```
src/hooks/useFavorites.ts         # get/toggle/isFavorite, sync localStorage
src/components/FavoriteButton.tsx # botão coração reutilizável
src/pages/Favorites.tsx           # página /favorites com grid + empty state
```

### useFavorites hook
```ts
// localStorage key: 'castro_favorites'
// retorna: { favorites: string[], toggle(id: string), isFavorite(id: string) }
// useState inicializado com JSON.parse(localStorage.getItem(...)) ?? []
// useEffect: localStorage.setItem sempre que favorites mudar
```

### PlaceCard — FavoriteButton
- Posição: `absolute top-2 right-2` sobre a imagem
- onClick: `e.stopPropagation()` + `toggle(place.id)`
- Visual: `Heart` icon do lucide-react, preenchido (fill-current) quando favoritado

### BottomNav — substituir item MapPin por Heart
- Label: "Favoritos", icon: Heart, rota: `/favorites`

### App.tsx — lazy route
```tsx
const Favorites = lazy(() => import("./pages/Favorites"));
<Route path="/favorites" element={<Suspense fallback={<PageSkeleton />}><Favorites /></Suspense>} />
```

## Tasks

- [x] T1: Criar `src/hooks/useFavorites.ts`
- [x] T2: Criar `src/components/FavoriteButton.tsx`
- [x] T3: Criar `src/pages/Favorites.tsx` — grid + empty state
- [x] T4: Atualizar `PlaceCard.tsx` — FavoriteButton sobre a imagem
- [x] T5: Atualizar `Place.tsx` — FavoriteButton no header do lugar
- [x] T6: Atualizar `BottomNav.tsx` — item Favoritos (Heart, /favorites)
- [x] T7: Atualizar `App.tsx` — lazy route /favorites

## Dev Agent Record

### Checklist
- [x] TypeScript sem erros (`tsc --noEmit`)
- [ ] Build sem erros (`vite build`)
- [x] Favoritos persistem após refresh
- [x] Toggle funciona em PlaceCard e Place.tsx
- [x] Empty state visível quando sem favoritos

### File List
- `src/hooks/useFavorites.ts` — CRIADO
- `src/components/FavoriteButton.tsx` — CRIADO
- `src/pages/Favorites.tsx` — CRIADO
- `src/components/PlaceCard.tsx` — MODIFICADO
- `src/pages/Place.tsx` — MODIFICADO
- `src/components/BottomNav.tsx` — MODIFICADO
- `src/App.tsx` — MODIFICADO

### Change Log
- feat: E-UX.3 — Favoritos "Minha Goiânia" implementado (localStorage + FavoriteButton + página /favorites)
