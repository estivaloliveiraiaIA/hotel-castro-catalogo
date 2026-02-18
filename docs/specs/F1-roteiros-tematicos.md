# F1 — Roteiros Temáticos Curados
## Spec Técnica

**Owner:** Dex (aios-dev)  
**Suporte:** Uma (aios-ux), Atlas (aios-analyst)  
**Fase:** 1 | **Prioridade:** P0

---

## Objetivo
Criar experiências prontas para hóspedes, organizadas por ocasião/perfil, eliminando a necessidade de o hóspede montar seu próprio roteiro.

## Roteiros iniciais (mínimo 5)

| Roteiro | Perfil | Lugares/roteiro |
|---------|--------|-----------------|
| 🕯️ Jantar Romântico | Casais | 4–6 restaurantes + 1 bar |
| 💼 Dia de Negócios | Executivos | 2 cafés + 2 restaurantes + 1 coworking |
| 👨‍👩‍👧‍👦 Família com Crianças | Famílias | 3 parques + 2 restaurantes kid-friendly |
| 🎭 Tarde Cultural | Turista cultural | 3 museus/galerias + 1 café + 1 restaurante |
| 🌆 Goiânia Essencial | Primeira vez na cidade | Mix de 6–8 destaques gerais |

## Estrutura de dados

```typescript
interface Itinerary {
  id: string;
  title: string;
  subtitle: string;           // ex: "Para uma noite inesquecível a dois"
  icon: string;                // emoji
  coverImage: string;          // URL da imagem de capa
  duration: string;            // ex: "4–5 horas"
  bestTime: string;            // ex: "Noite"
  places: ItineraryPlace[];    // lista ordenada
  tips: string[];              // dicas do concierge
}

interface ItineraryPlace {
  placeId: string;             // referência ao places.json
  order: number;
  note?: string;               // ex: "Peça o risoto de pato"
  suggestedTime?: string;      // ex: "19h–20h30"
}
```

## Componentes a criar

| Componente | Descrição |
|-----------|-----------|
| `ItineraryCard.tsx` | Card de preview do roteiro (capa, título, duração, ícone) |
| `ItineraryPage.tsx` | Página completa do roteiro com timeline visual dos lugares |
| `ItinerariesSection.tsx` | Seção na home com carousel/grid dos roteiros |

## Dados
- Arquivo: `data/itineraries.json`
- Curadoria inicial: Atlas (analyst) pesquisa + equipe hotel valida
- Lugares referenciados devem existir em `places.json`

## UX (Uma)
- Card com imagem de capa, overlay escuro, título em Cormorant
- Timeline vertical com os lugares na ordem sugerida
- Cada lugar com mini-card + botão "Como chegar" + "Reservar"
- Mobile-first, scroll suave entre pontos

## Critérios de aceite
- [ ] ≥ 5 roteiros publicados com ≥ 4 lugares cada
- [ ] Navegação ida/volta sem perder contexto
- [ ] Responsivo (mobile 375px + desktop)
- [ ] Lighthouse performance ≥ 90
- [ ] Links de direção/reserva funcionando
