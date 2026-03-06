# E-UX.4 — "Hoje no Hotel"

**Epic:** UX Sprint 2 — Features Alto Impacto
**Status:** Ready for Dev
**Executor:** @dev (Dex)
**Prioridade:** Alta

---

## Story

Como hóspede, quero ver na home uma seção "Hoje no Hotel" com dicas e destaques do dia, tornando o app útil e relevante a cada visita durante a estadia.

## Acceptance Criteria

- [ ] AC1: Seção "Hoje no Hotel" exibida na home, abaixo do Hero e acima das categorias
- [ ] AC2: Exibe data atual formatada em português ("Quinta-feira, 6 de março")
- [ ] AC3: Mostra até 3 cards de dica do dia — dados vindos de `public/data/hotel-tips.json`
- [ ] AC4: Cada card tem: ícone/emoji, título, descrição curta (máx 80 chars)
- [ ] AC5: Dicas rotativas por dia da semana (7 conjuntos, um por dia) — sem backend
- [ ] AC6: Design premium: borda hotel-gold/20, fundo hotel-gold/5, fonte serif no título
- [ ] AC7: Seção colapsável em mobile (accordion) para não pesar o scroll
- [ ] AC8: Se `hotel-tips.json` não existir ou estiver vazio, seção não é renderizada (fail silent)

## Dev Notes

### Estrutura
```
public/data/hotel-tips.json       # dados estáticos das dicas
src/hooks/useHotelTips.ts         # hook que lê o JSON e retorna dicas do dia
src/components/HotelTipsSection.tsx # componente da seção
```

### hotel-tips.json — formato
```json
{
  "tips": [
    {
      "id": "tip-1",
      "weekdays": [1, 3, 5],
      "icon": "☕",
      "title": "Café da manhã especial",
      "description": "Hoje servimos brunch estendido até 11h no restaurante do hotel."
    },
    {
      "id": "tip-2",
      "weekdays": [0, 2, 4, 6],
      "icon": "🌙",
      "title": "Happy hour na cobertura",
      "description": "Das 18h às 20h, drinks com 30% de desconto para hóspedes."
    }
  ]
}
```
`weekdays`: 0=Domingo, 1=Segunda, ..., 6=Sábado. Ausente = exibir todos os dias.

### useHotelTips
```ts
// Filtra tips pelo dia da semana atual (new Date().getDay())
// Retorna até 3 dicas
// Retorna [] em caso de erro (fail silent)
```

### HotelTipsSection
- Wrapper: `section` com `id="hoje-no-hotel"`
- Usa Accordion do shadcn-ui para collapsible em mobile
- Em desktop (md+): sempre expandido (sem accordion)
- Data: `new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })`
- Capitalizar primeiro char da data

### Index.tsx — integração
Adicionar `<HotelTipsSection />` entre `<Hero />` e as QuickActions.

### Conteúdo inicial — hotel-tips.json
Criar 7 dicas cobrindo todos os dias da semana, com temas: café da manhã, spa, restaurante, atividades locais, happy hour, tours, dicas de Goiânia. Tom: sofisticado e hospitaleiro.

## Tasks

- [ ] T1: Criar `public/data/hotel-tips.json` com 7+ dicas cobrindo toda a semana
- [ ] T2: Criar `src/hooks/useHotelTips.ts`
- [ ] T3: Criar `src/components/HotelTipsSection.tsx`
- [ ] T4: Atualizar `src/pages/Index.tsx` — inserir `<HotelTipsSection />` após Hero

## Dev Agent Record

### Checklist
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Build sem erros (`vite build`)
- [ ] Dicas rotativas corretas por dia da semana
- [ ] Fail silent quando JSON ausente
- [ ] Collapsível funcional em mobile

### File List
<!-- Preencher durante implementação -->

### Change Log
<!-- Preencher durante implementação -->
