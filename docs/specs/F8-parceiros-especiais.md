# F8 — Parceiros com Condições Especiais
## Spec Técnica

**Owner:** Morgan (aios-pm)  
**Suporte:** Dex (aios-dev), legal-chief  
**Fase:** 4 | **Prioridade:** P1

---

## Objetivo
Destacar lugares que oferecem benefícios exclusivos para hóspedes do Castro's Park Hotel, gerando valor real para o hóspede e receita/parceria para o hotel.

## Modelo de parceria

| Tipo | Exemplo |
|------|---------|
| Desconto fixo | "10% para hóspedes Castro's Park" |
| Cortesia | "Sobremesa grátis ao mencionar o hotel" |
| Prioridade | "Reserva prioritária para hóspedes" |
| Combo | "Jantar + transfer incluso" |

## Dados em `places.json`

```typescript
interface PartnerDeal {
  active: boolean;
  dealText: string;          // "10% de desconto"
  dealType: "discount" | "courtesy" | "priority" | "combo";
  validUntil?: string;       // data de validade
  terms?: string;            // condições
  contactPerson?: string;    // responsável no estabelecimento
}
```

## Componentes

| Componente | Descrição |
|-----------|-----------|
| Badge "Parceiro" | Badge dourado premium no PlaceCard: `✦ Parceiro Castro's Park` |
| `PartnersPage.tsx` | Página `/partners` com todos os parceiros e seus benefícios |
| Deal tooltip | Hover/tap no badge mostra o benefício |

## Gestão (Morgan)
- Template de proposta de parceria
- Planilha de controle: lugar, contato, deal, validade, status
- Revisão trimestral de parcerias ativas

## Legal (legal-chief)
- Template de acordo simplificado (1 página)
- Validação de termos de uso pelo hóspede
- Compliance com CDC/publicidade

## Critérios de aceite
- [ ] ≥ 3 parceiros ativos no lançamento
- [ ] Badge visual diferenciado e elegante
- [ ] Página de parceiros funcional
- [ ] Template de acordo aprovado
- [ ] Deals com validade controlada (não mostrar expirados)
