# F2 — Concierge IA
## Spec Técnica

**Owner:** Aria (aios-architect)  
**Suporte:** Dex (aios-dev), Dara (aios-data-engineer)  
**Fase:** 2 | **Prioridade:** P0

---

## Objetivo
Permitir que o hóspede descreva sua intenção em linguagem natural e receba recomendações personalizadas instantâneas, como faria com um concierge real.

## Exemplos de interação

| Input do hóspede | Output esperado |
|-------------------|-----------------|
| "Quero jantar bem, comida italiana, perto do hotel" | Top 3 italianos próximos, com nota e link de reserva |
| "Lugar pra tomar café da manhã amanhã" | Cafés abertos cedo + classificação |
| "O que fazer com crianças hoje?" | Parques + atrações family-friendly |
| "Restaurante bom e barato" | Filtro por priceLevel ≤ 2, rating ≥ 4.0 |

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Chat Input  │────▶│  LLM + RAG   │────▶│  Response UI │
│  (frontend)  │     │  (API/edge)  │     │  (cards)     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │ places.json  │
                     │ (embeddings) │
                     └──────────────┘
```

### Opção A — Client-side (recomendada para MVP)
- Embeddings pré-computados dos lugares (nome + descrição + tags + categoria)
- Busca semântica via `transformers.js` ou embedding local
- LLM call (OpenAI/Claude) com contexto dos top 10 matches para gerar resposta personalizada
- **Vantagem:** sem backend adicional, deploy estático mantido

### Opção B — API Backend
- Endpoint `/api/concierge` com RAG completo
- Supabase pgvector ou Pinecone para embeddings
- **Vantagem:** mais robusto, permite histórico de conversa

### Decisão arquitetural (Aria)
- MVP: Opção A (manter deploy estático, custo zero de infra)
- V2: migrar para Opção B se volume justificar

## Componentes

| Componente | Descrição |
|-----------|-----------|
| `ConciergeChat.tsx` | Campo de input + área de resposta |
| `ConciergeResponse.tsx` | Cards de recomendação com justificativa |
| `useConcierge.ts` | Hook com lógica de busca semântica + LLM |

## Dados (Dara)
- Script `scripts/generate-embeddings.js` para pré-computar embeddings
- Output: `data/place-embeddings.json`
- Atualizar embeddings quando `places.json` mudar (CI/CD)

## Prompt base do Concierge
```
Você é o concierge digital do Castro's Park Hotel em Goiânia.
Recomende lugares com base na intenção do hóspede.
Use SOMENTE os lugares fornecidos no contexto.
Responda em português, curto e elegante.
Inclua: nome, por que recomenda, distância do hotel e nota.
Máximo 3 recomendações.
```

## Critérios de aceite
- [ ] Resposta em ≤ 3 segundos
- [ ] Recomendações relevantes para ≥ 80% das queries de teste
- [ ] Fallback gracioso se LLM falhar ("Não consegui entender, tente algo como...")
- [ ] UI elegante e consistente com design luxo
- [ ] Custo por query ≤ $0.01
