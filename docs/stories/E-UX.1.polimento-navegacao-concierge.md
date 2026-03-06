# Story E-UX.1: Polimento Visual — Navegacao, Header e Concierge em Destaque

## Status
Ready for Dev

## Executor Assignment
```
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["build", "typecheck", "lint"]
```

## Story
**As a** hospede do Castro's Park Hotel,
**I want** navegar pelo app com clareza e encontrar o Concierge Digital facilmente,
**so that** eu tenha uma experiencia fluida e saiba que posso pedir ajuda por linguagem natural a qualquer momento.

## Acceptance Criteria
1. Campo de busca removido do Header — o header fica limpo, com apenas logo e links de navegacao
2. Todas as paginas secundarias (Place, Itinerary, Itineraries, Events) possuem o Header visivel com logo clicavel
3. Botoes de voltar em todas as paginas secundarias navegam para destino fixo (nao `navigate(-1)`): Place → "/", Itinerary → "/itineraries", Itineraries → "/", Events → "/"
4. O bloco do Concierge Digital na home tem visual elevado: fundo distinto, tipografia maior, chips de sugestao com icones
5. O titulo do Concierge comunica clareza de proposito (ex: "Seu concierge pessoal em Goiania")
6. App builda sem erros de TypeScript

## Tasks / Subtasks
- [ ] Remover o campo de busca do Header.tsx (props query e onQueryChange podem ser removidas; Header passa a ser simples)
- [ ] Atualizar Index.tsx: remover props query/onQueryChange do <Header /> e o estado relacionado (query, setQuery) que era exclusivo do header — manter a logica de busca interna da pagina via CategoryTabs/QuickActions
- [ ] Adicionar <Header /> em Place.tsx, Itinerary.tsx, Itineraries.tsx e Events.tsx
- [ ] Corrigir navigate(-1) → destinos fixos: Place → navigate("/"), Itinerary → navigate("/itineraries"), Itineraries → navigate("/"), Events → navigate("/")
- [ ] Redesenhar ConciergeChat.tsx: tipografia do titulo maior (text-2xl/3xl), subtitulo mais descritivo, chips de sugestao com icones (ex: Utensils, Baby, Coffee, Moon, ShoppingBag), fundo com gradiente mais pronunciado ou borda dourada mais evidente
- [ ] Verificar que o estado `query` em Index.tsx ainda funciona para busca interna (CategoryTabs/filtros) apos remocao do header search

## Dev Notes

### Header simplificado apos remocao da busca
```tsx
// Header.tsx — remover as props query e onQueryChange
// O componente fica apenas com logo + nav links
export const Header = () => { ... }

// Index.tsx — remover do <Header>
<Header /> // sem props
```

### Destinos fixos de navegacao
```tsx
// Place.tsx
<Button onClick={() => navigate("/")}>
  <ArrowLeft /> Voltar
</Button>

// Itinerary.tsx
<Button onClick={() => navigate("/itineraries")}>
  <ArrowLeft /> Roteiros
</Button>

// Itineraries.tsx
<Button onClick={() => navigate("/")}>
  <ArrowLeft /> Inicio
</Button>

// Events.tsx
<Button onClick={() => navigate("/")}>
  <ArrowLeft /> Inicio
</Button>
```

### ConciergeChat — sugestoes com icones
```tsx
import { Utensils, Baby, Coffee, Moon, ShoppingBag } from "lucide-react";

const SUGGESTIONS = [
  { label: "Jantar romantico", icon: Utensils },
  { label: "Passeio com filhos", icon: Baby },
  { label: "Cafe especial", icon: Coffee },
  { label: "Vida noturna", icon: Moon },
  { label: "Compras", icon: ShoppingBag },
];
```

### Atencao: query state em Index.tsx
O estado `query` em Index.tsx alimenta tanto o header (a ser removido) quanto a logica de `baseSearchResults` e `normalizedQuery` internos. Apos a remocao do header search, a busca interna ainda pode ser ativada via CategoryTabs. Confirmar que nenhum outro componente depende de `query` via prop.

## Change Log
| Data | Versao | Descricao | Autor |
|------|--------|-----------|-------|
| 2026-03-06 | 1.0 | Story criada por @aiox-master (Orion) | aiox-master |
