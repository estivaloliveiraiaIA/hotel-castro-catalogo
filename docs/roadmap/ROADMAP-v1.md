# 🏨 Castro's Park Hotel — Guia Digital de Goiânia
## Roadmap v1 — Evolução para Concierge Digital de Luxo

**Owner:** Orion (aios-master)  
**Início:** 2026-02-18  
**Coordenação:** Board AIOS  
**Repo:** `estivaloliveiraiaIA/hotel-castro-catalogo`

---

## Visão

Transformar o guia de lugares em um **concierge digital premium**, à altura da experiência 5 estrelas do Castro's Park Hotel — personalizado, elegante e útil desde o check-in até o checkout.

---

## Fases de execução

### 🟢 Fase 1 — Experiências Curadas (Semana 1–2)
> Foco: sair de "lista de lugares" para "experiências prontas"

| # | Feature | Descrição | Agente Owner | Suporte | Prioridade |
|---|---------|-----------|-------------|---------|------------|
| F1 | Roteiros temáticos curados | Pacotes de experiência prontos: "Jantar Romântico", "Dia de Negócios", "Família", "Tarde Cultural", "Goiânia Essencial" | aios-dev (Dex) | aios-ux (Uma), aios-analyst (Atlas) | P0 |
| F4 | Reserva em 1 toque | Botão WhatsApp/telefone direto em cada lugar. Click-to-call/chat sem sair do app | aios-dev (Dex) | aios-devops (Gage) | P0 |

**Entregáveis Fase 1:**
- [ ] Componente `ItineraryCard.tsx` + página `/itineraries`
- [ ] Dados: `itineraries.json` com 5 roteiros iniciais curados
- [ ] Botão WhatsApp/telefone em `PlaceCard.tsx` e página de detalhe
- [ ] Deploy em produção

---

### 🟡 Fase 2 — Inteligência e Visualização (Semana 3–4)
> Foco: personalização e orientação espacial

| # | Feature | Descrição | Agente Owner | Suporte | Prioridade |
|---|---------|-----------|-------------|---------|------------|
| F2 | Concierge IA | Campo de busca inteligente: hóspede digita intenção ("quero sushi perto") e recebe top 3 curados com justificativa | aios-architect (Aria) | aios-dev (Dex), aios-data-engineer (Dara) | P0 |
| F3 | Mapa interativo | Mapa visual com lugares agrupados por zona, distância real do hotel, filtros por categoria | aios-dev (Dex) | aios-ux (Uma) | P1 |

**Entregáveis Fase 2:**
- [ ] Componente `ConciergeChat.tsx` com integração LLM (OpenAI/Claude)
- [ ] Endpoint ou client-side RAG sobre `places.json`
- [ ] Componente `MapView.tsx` com Leaflet/Mapbox
- [ ] Marcadores por categoria + raio do hotel
- [ ] Deploy em produção

---

### 🔵 Fase 3 — Internacionalização e Conteúdo Vivo (Semana 5–6)
> Foco: alcance internacional e conteúdo dinâmico

| # | Feature | Descrição | Agente Owner | Suporte | Prioridade |
|---|---------|-----------|-------------|---------|------------|
| F6 | Versão em inglês | Toggle PT/EN em toda a interface. Tradução de categorias, roteiros, UI e descrições dos top 30 | aios-dev (Dex) | copy-chief, aios-ux (Uma) | P1 |
| F7 | Agenda de eventos | Seção "Esta semana em Goiânia" com shows, exposições, gastronomia. Curadoria manual semanal ou API pública | aios-analyst (Atlas) | aios-dev (Dex), sop-extractor | P1 |

**Entregáveis Fase 3:**
- [ ] Sistema i18n (react-intl ou i18next)
- [ ] Arquivos `pt.json` / `en.json`
- [ ] Tradução completa da UI + top 30 lugares
- [ ] Componente `EventsSection.tsx` + dados `events.json`
- [ ] SOP de curadoria semanal de eventos
- [ ] Deploy em produção

---

### 🟣 Fase 4 — Parcerias e Integração Físico-Digital (Semana 7–8)
> Foco: valor comercial e experiência omnichannel

| # | Feature | Descrição | Agente Owner | Suporte | Prioridade |
|---|---------|-----------|-------------|---------|------------|
| F8 | Parceiros com condições especiais | Badge e seção dedicada para lugares com acordo com o hotel. "Mencione Castro's Park e ganhe X" | aios-pm (Morgan) | aios-dev (Dex), legal-chief | P1 |
| F9 | QR Code impresso | Card físico para quartos com QR Code. Landing page otimizada para primeiro acesso mobile | aios-ux (Uma) | aios-devops (Gage), copy-chief | P2 |

**Entregáveis Fase 4:**
- [ ] Campo `partnerDeal` em `places.json` + badge visual
- [ ] Página `/partners` com destaques
- [ ] Template de contrato/acordo simplificado
- [ ] Design do card físico (frente/verso)
- [ ] Landing page `/welcome` otimizada para QR
- [ ] Arquivo PDF print-ready do card
- [ ] Deploy em produção

---

## Matriz de responsabilidade (RACI)

| Agente | Papel | Fases |
|--------|-------|-------|
| **Orion** (aios-master) | Coordenação geral, board, consolidação | Todas |
| **Dex** (aios-dev) | Desenvolvimento frontend/backend | F1, F2, F3, F6, F7, F8 |
| **Aria** (aios-architect) | Arquitetura do Concierge IA e decisões técnicas | F2 |
| **Uma** (aios-ux) | UX/UI, design de componentes, card físico | F1, F3, F6, F9 |
| **Atlas** (aios-analyst) | Pesquisa de mercado, curadoria de eventos | F1, F7 |
| **Dara** (aios-data-engineer) | Modelagem de dados, pipeline de eventos | F2, F7 |
| **Gage** (aios-devops) | Deploy, CI/CD, infraestrutura | F1–F4 |
| **Quinn** (aios-qa) | QA gate por fase antes de produção | F1–F4 |
| **Morgan** (aios-pm) | Gestão de parcerias comerciais | F4 |
| **River** (aios-sm) | Facilitação e desbloqueio entre fases | Todas |
| **copy-chief** | Copywriting (roteiros, traduções, card) | F1, F6, F9 |
| **legal-chief** | Revisão de contratos de parceria | F4 |
| **sop-extractor** | SOP de curadoria semanal | F7 |

---

## Critérios de qualidade por fase

- **QA gate obrigatório** antes de cada deploy
- **Lighthouse ≥ 90** (performance + accessibility)
- **Mobile-first** — toda feature testada em viewport 375px
- **Zero breaking changes** em dados existentes

---

## KPIs de sucesso do roadmap

| KPI | Meta | Medição |
|-----|------|---------|
| Features entregues no prazo | ≥ 75% | Por fase |
| Bugs críticos pós-deploy | 0 | Por fase |
| Cobertura de tradução EN | 100% UI + top 30 | Fase 3 |
| Roteiros curados publicados | ≥ 5 | Fase 1 |
| Parceiros ativos com deal | ≥ 3 | Fase 4 |

---

## Timeline visual

```
Semana:  1    2    3    4    5    6    7    8
         ├────┤────┤────┤────┤────┤────┤────┤
Fase 1:  ██████████
Fase 2:            ██████████
Fase 3:                      ██████████
Fase 4:                                ██████████
```

---

*Documento gerado por Orion (aios-master) em 2026-02-18.*  
*Coordenação via Board AIOS. Fonte da verdade: Room + Board.*
