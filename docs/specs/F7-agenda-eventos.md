# F7 — Agenda de Eventos de Goiânia
## Spec Técnica

**Owner:** Atlas (aios-analyst)  
**Suporte:** Dex (aios-dev), sop-extractor  
**Fase:** 3 | **Prioridade:** P1

---

## Objetivo
Seção "Esta semana em Goiânia" com eventos relevantes para hóspedes — shows, gastronomia, exposições, feiras.

## Estrutura de dados

```typescript
interface CityEvent {
  id: string;
  title: string;
  description: string;
  category: "show" | "gastro" | "expo" | "feira" | "esporte" | "outro";
  date: string;           // ISO date
  endDate?: string;
  time?: string;          // "20h"
  venue: string;          // nome do local
  address?: string;
  link?: string;          // URL do evento
  image?: string;
  featured: boolean;      // destaque da semana
}
```

## Fontes de dados
1. **Curadoria manual semanal** (MVP) — equipe do hotel ou agente Atlas
2. **Agenda Goiânia** (API/scraping se disponível)
3. **Instagram/redes do hotel** (eventos parceiros)

## SOP de atualização semanal (sop-extractor)
1. Segunda-feira: coletar eventos da semana
2. Preencher `data/events.json`
3. Commit + deploy automático
4. Tempo estimado: 30 min/semana

## Componentes
- `EventsSection.tsx` — seção na home
- `EventCard.tsx` — card individual do evento
- `EventsPage.tsx` — página completa `/events`

## UX
- Na home: carousel com até 5 eventos destacados
- Página completa: lista por dia da semana
- Ícones por categoria de evento
- Filtro: "Hoje", "Amanhã", "Esta semana"

## Critérios de aceite
- [ ] ≥ 5 eventos por semana publicados
- [ ] Dados atualizados semanalmente
- [ ] SOP documentado e funcional
- [ ] Responsivo mobile + desktop
- [ ] Eventos passados ocultados automaticamente
