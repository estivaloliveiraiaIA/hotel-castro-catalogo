# F4 — Reserva em 1 Toque
## Spec Técnica

**Owner:** Dex (aios-dev)  
**Suporte:** Gage (aios-devops)  
**Fase:** 1 | **Prioridade:** P0

---

## Objetivo
Eliminar a fricção entre "quero ir" e "reservei" — hóspede toca um botão e já está falando com o lugar.

## Canais de contato (prioridade)

| Canal | Quando usar | Implementação |
|-------|------------|---------------|
| WhatsApp | Lugar tem WhatsApp Business | `https://wa.me/{número}?text={mensagem}` |
| Telefone | Lugar tem telefone fixo/celular | `tel:{número}` (click-to-call) |
| Google Maps | Fallback se não tiver contato direto | Link para ficha do Google Maps |

## Dados necessários em `places.json`
```typescript
interface PlaceContact {
  whatsapp?: string;    // número com DDI: "5562999999999"
  phone?: string;       // telefone: "6232111111"
  bookingUrl?: string;  // link externo de reserva (iFood, etc)
}
```

## Mensagem padrão WhatsApp
```
Olá! Sou hóspede do Castro's Park Hotel e gostaria de fazer uma reserva. 🏨
```

## Alterações em componentes existentes

| Componente | Alteração |
|-----------|-----------|
| `PlaceCard.tsx` | Adicionar ícone WhatsApp/telefone ao lado de "Como chegar" |
| `PlacePage.tsx` (detalhe) | Seção "Reservar" com botões WhatsApp + Telefone + Maps |

## Enriquecimento de dados
- Script `scripts/enrich-contacts.js` para buscar WhatsApp/telefone via Google Places API (campo `formatted_phone_number`)
- Priorizar os Top 30 curados + todos de roteiros temáticos

## Critérios de aceite
- [ ] ≥ 80% dos Top 30 com pelo menos 1 canal de contato
- [ ] Click-to-WhatsApp abrindo app correto em mobile
- [ ] Click-to-call funcionando em mobile
- [ ] Fallback para Google Maps quando sem contato
- [ ] Mensagem pré-preenchida no WhatsApp
