# Story E-UX.2: Sprint 1 — Navegação Mobile, Skeleton Loading e Polimento UX Base

## Status
Ready for Dev

## Executor Assignment
```
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["build", "typecheck", "lint"]
```

## Story
**As a** hóspede do Castro's Park Hotel usando o app no smartphone,
**I want** ter navegação clara entre todas as seções do app e feedback visual adequado durante o carregamento,
**so that** eu consiga explorar roteiros, eventos e o concierge sem dificuldade, com uma experiência digna de um hotel de luxo.

## Acceptance Criteria
1. Bottom navigation bar fixa no mobile (< md) com 4 itens: Guia (/), Roteiros (/itineraries), Eventos (/events), Concierge (ancora para #concierge na home)
2. Skeleton screens animados substituem todos os textos de loading (Index, Place, Itineraries, Events)
3. QuickActions em Index.tsx sem emojis — substituídos por ícones Lucide (Utensils, Coffee, Wine, TreePine, MapPin)
4. Hero com botão CTA âncora ("Explorar com o Concierge") que faz scroll suave para o ConciergeChat
5. Dot de status (verde pulsante = aberto, cinza = sem info) visível no canto superior direito do PlaceCard quando openStatusText contém "Aberto"
6. App builda sem erros de TypeScript

## Tasks / Subtasks

- [ ] **T1 — Bottom Navigation Bar mobile**
  - [ ] Criar `src/components/BottomNav.tsx` com 4 itens (Guia, Roteiros, Eventos, Concierge)
  - [ ] Ícones: `Home`, `Map`, `CalendarDays`, `Sparkles` do lucide-react
  - [ ] Estilo: `fixed bottom-0 left-0 right-0 z-50 border-t border-hotel-gold/20 bg-background/95 backdrop-blur md:hidden`
  - [ ] Item ativo com `text-hotel-gold`, inativo com `text-muted-foreground`
  - [ ] Concierge: scroll suave para `#concierge-section` na home; nas outras páginas, navega para `/?concierge=1`
  - [ ] Adicionar `<BottomNav />` em `App.tsx` fora das rotas (sempre visível no mobile)
  - [ ] Adicionar `pb-16 md:pb-0` no container principal para compensar a altura da nav

- [ ] **T2 — Skeleton Loading Screens**
  - [ ] Criar `src/components/PlaceCardSkeleton.tsx`: card com `animate-pulse`, mesma proporção do PlaceCard (aspect-[4/3] + 3 linhas de texto)
  - [ ] Criar `src/components/SkeletonGrid.tsx`: grid de 6 PlaceCardSkeleton (reutilizável)
  - [ ] Em `Index.tsx`: substituir `<div>Carregando lugares...</div>` por `<SkeletonGrid />`
  - [ ] Em `Itineraries.tsx`: substituir loading text por grid de 3 skeletons de ItineraryCard
  - [ ] Em `Events.tsx`: substituir loading text por grid de 3 skeletons de EventCard
  - [ ] Em `Place.tsx`: substituir loading state por skeleton da estrutura da página (hero + 3 blocos de conteúdo)

- [ ] **T3 — QuickActions sem emojis**
  - [ ] Em `Index.tsx` linhas 51-57: substituir array `quickActions` por versão com `icon` (Utensils, Coffee, Wine, TreePine, MapPin)
  - [ ] Renderizar ícone antes do label: `<Icon className="h-3.5 w-3.5" /> {item.label}`
  - [ ] Remover emojis dos labels (ex: "🍽️ Comer bem" → "Comer bem")

- [ ] **T4 — Hero CTA**
  - [ ] Em `Hero.tsx`: adicionar botão abaixo do subtítulo
  - [ ] Texto: "Explorar com o Concierge"
  - [ ] Ícone: `Sparkles` do lucide-react
  - [ ] Estilo: `Button` com variant default, `rounded-full`, `border-hotel-gold/40`
  - [ ] Ação: `document.getElementById("concierge-section")?.scrollIntoView({ behavior: "smooth" })`
  - [ ] Em `ConciergeChat.tsx` ou no wrapper em `Index.tsx`: adicionar `id="concierge-section"` na `<section>`

- [ ] **T5 — Status aberto/fechado no PlaceCard**
  - [ ] Em `PlaceCard.tsx`: verificar se `place.openStatusText` contém "Aberto" (case-insensitive)
  - [ ] Se aberto: renderizar `<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />`
  - [ ] Se fechado/desconhecido: não renderizar nada (não mostrar vermelho para não alarmar)
  - [ ] O span deve estar dentro do container `relative` da imagem

## Dev Notes

### BottomNav — estrutura base
```tsx
// src/components/BottomNav.tsx
import { Home, Map, CalendarDays, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Guia", href: "/", icon: Home },
  { label: "Roteiros", href: "/itineraries", icon: Map },
  { label: "Eventos", href: "/events", icon: CalendarDays },
  { label: "Concierge", href: "/#concierge-section", icon: Sparkles, scroll: true },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-hotel-gold/20 bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={label} to={href}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-hotel-gold" : "text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
```

### PlaceCardSkeleton — estrutura
```tsx
// src/components/PlaceCardSkeleton.tsx
export const PlaceCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 space-y-2">
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-5 w-2/3 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-4/5 bg-muted rounded" />
    </div>
  </div>
);
```

### Status dot no PlaceCard
```tsx
// Dentro do container da imagem (div relative)
{place.openStatusText?.toLowerCase().includes("aberto") && (
  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 animate-pulse ring-2 ring-background" />
)}
```

### Atenção: padding bottom para BottomNav
Adicionar `pb-16 md:pb-0` no `<div className="min-h-screen bg-background">` de cada página para que o conteúdo não fique sob a BottomNav no mobile.

## Change Log
| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 2026-03-06 | 1.0 | Story criada por Orion (@aiox-master) — Sprint 1 UX Base | aiox-master |
