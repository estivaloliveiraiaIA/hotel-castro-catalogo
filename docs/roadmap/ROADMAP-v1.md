# Castro's Park Hotel — Guia Digital de Goiânia
## Roadmap v1 — Evolucao para Concierge Digital de Luxo

**Owner:** Orion (aiox-master)
**Inicio:** 2026-02-18
**Ultima revisao:** 2026-03-05 (Epic 2 concluido — pushed para producao)
**Repo:** `estivaloliveiraiaIA/hotel-castro-catalogo`
**Deploy:** https://castro-park-discover.vercel.app

---

## Visao

Transformar o guia de lugares em um **concierge digital premium**, a altura da experiencia 5 estrelas do Castro's Park Hotel — personalizado, elegante e util desde o check-in ate o checkout.

---

## Epics

### Epic 1 — Base Entregue (CONCLUIDO)
> Features fundacionais entregues. Stories retroativas criadas para rastreabilidade.

| Story | Feature | Status |
|-------|---------|--------|
| E1.1 | Roteiros tematicos curados (F1) | Done |
| E1.2 | Reserva em 1 toque — WhatsApp/telefone (F4) | Done |
| E1.3 | Admin Dashboard — CRUD completo (F10) | Done |

Nota: F10 Admin nao constava no roadmap original mas foi entregue e e para ser mantido.
Infraestrutura Supabase criada pelo F10 (tabelas events, partners) acelera E3.

---

### Epic 2 — Qualidade e Inteligencia (CONCLUIDO)
> Sprint encerrado. Todas as stories entregues, QA aplicado, codigo em producao.

| Story | Feature | Agente | Status |
|-------|---------|--------|--------|
| E2.1 | UX/UI Audit & Redesign — app completo + admin | @ux-design-expert | Done |
| E2.2 | Backend Review — APIs + Supabase schema + seguranca | @architect + @data-engineer | Done |
| E2.3 | F2 Concierge IA — Vercel Function + Claude Haiku | @dev | Done |

Deploy: push para main em 2026-03-05 — 14 commits publicados no Vercel.

---

### Epic 3 — Conteudo Vivo (BACKLOG)
> Eventos em tempo real e programa de parceiros.

| Story | Feature | Agente | Status |
|-------|---------|--------|--------|
| E3.1 | F7 Agenda de eventos — pagina publica de eventos | @dev | Backlog |
| E3.2 | F8 Parceiros especiais — badge + secao dedicada | @dev | Backlog |

Nota: Tabelas events e partners ja existem no Supabase. E3 aproveita essa infraestrutura.

---

### Epic 4 — Expansao (BACKLOG)
> Internacionalizacao e integracao fisico-digital.

| Story | Feature | Agente | Status |
|-------|---------|--------|--------|
| E4.2 | F6 Versao em ingles — toggle PT/EN completo | @dev | Backlog |
| E4.3 | F9 QR Code impresso — landing page /welcome | @dev + @ux-design-expert | Backlog |

---

## Workflow obrigatorio a partir do Epic 2

Todo desenvolvimento segue o ciclo AIOX:

  Story (Approved)
      -> @dev implementa
      -> QA gate (@qa)
      -> @devops git push + deploy
      -> Vercel deploy automatico

Regras:
- Nenhum codigo vai para producao sem story aprovada
- Nenhum push sem QA gate
- Stories documentadas em docs/stories/ antes de qualquer implementacao
- @devops e o UNICO agente que faz git push

---

## Stack atual (pos-Epic 1)

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Deploy | Vercel (prod: castro-park-discover.vercel.app) |
| Backend | Vercel Serverless Functions (ES modules, api/) |
| Banco de dados | Supabase PostgreSQL |
| Storage | Supabase Storage (bucket hotel-images) |
| Admin | /admin lazy loaded, bundle isolado |

---

## KPIs de sucesso

| KPI | Meta | Status |
|-----|------|--------|
| Features E1 entregues | 100% | 3/3 Done |
| Features E2 entregues | 100% | 3/3 Done |
| Stories com rastreabilidade | 100% a partir de E2 | 7/7 stories documentadas |
| QA gate por deploy | 100% a partir de E2 | Aplicado — E2.1/E2.2/E2.3 |
| Lighthouse performance | >= 85 | A medir (proximo sprint) |
| Concierge IA latencia p95 | <= 4s | Implementado — a medir em producao |
| Custo por query IA | <= $0.02 | Claude Haiku ~$0.005/query |

---

Documento mantido por Orion (aiox-master).
Ultima atualizacao: 2026-03-05 — Epic 2 concluido e em producao. Proximo: Epic 3 (Conteudo Vivo).
