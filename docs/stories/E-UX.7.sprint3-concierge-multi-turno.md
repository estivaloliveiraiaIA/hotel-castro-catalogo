# E-UX.7 — Concierge Multi-turno (Floating Chat)

**Epic:** UX Sprint 3 — Diferenciação de Mercado
**Status:** Ready for Review
**Executor:** @dev (Dex)
**Prioridade:** Alta

---

## Story

Como hóspede, quero conversar com o Concierge IA de forma natural e contínua — com o histórico visível — sem precisar voltar à home, para que ele entenda o contexto da conversa e me dê respostas cada vez mais precisas durante toda a minha navegação no app.

## Acceptance Criteria

- [ ] AC1: Botão flutuante `✦` fixo no canto inferior direito, acima do BottomNav em mobile
- [ ] AC2: Ao clicar, abre um Sheet (painel lateral) com a interface de chat
- [ ] AC3: Histórico de mensagens visível em bolhas (hóspede à direita, IA à esquerda)
- [ ] AC4: A IA recebe o histórico completo da conversa em cada nova mensagem (multi-turno)
- [ ] AC5: Fechar o painel não apaga o histórico — ao reabrir, a conversa continua
- [ ] AC6: Input fixo no rodapé do painel com botão de envio
- [ ] AC7: A seção ConciergeChat na home é simplificada para um CTA que abre o floating chat
- [ ] AC8: Botão flutuante visível em todas as páginas do app
- [ ] AC9: Sugestões rápidas exibidas quando o histórico está vazio (estado inicial)
- [ ] AC10: Loading state elegante enquanto IA processa ("Concierge digitando...")

## Dev Notes

### Arquitetura geral

```
src/hooks/useConciergeChat.ts        # novo hook multi-turno (substitui useConcierge)
src/components/ConciergeFloat.tsx    # botão flutuante + Sheet container
src/components/ConciergeChatPanel.tsx # UI interna do chat (bolhas + input)
api/concierge.js                     # atualizar para aceitar messages[]
```

### useConciergeChat.ts — novo hook

```ts
interface Message {
  role: "user" | "assistant";
  content: string;
  places?: ConciergePlace[]; // lugares sugeridos (apenas mensagens da IA)
  timestamp: number;
}

// Estado:
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isOpen, setIsOpen] = useState(false);

// sendMessage(text):
//   1. Adiciona mensagem do usuário ao histórico
//   2. POST /api/concierge com { messages: [...histórico] }
//   3. Adiciona resposta da IA ao histórico

// clearConversation(): reseta messages[]
// open/close: setIsOpen(true/false)
```

### api/concierge.js — mudanças

```js
// Antes: req.body = { query: string }
// Depois: req.body = { messages: [{role, content}][] }

// Extrair última mensagem do usuário para keyword scoring
const lastUserMsg = messages.filter(m => m.role === "user").at(-1)?.content ?? "";

// Passar histórico completo para Claude:
body: JSON.stringify({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 700,
  system: `Você é o concierge digital do Castro's Park Hotel em Goiânia...
           Lugares disponíveis: ${context}`,
  messages: messages.map(m => ({ role: m.role, content: m.content })),
})
// Remover campo "messages" do prompt do usuário — usar system prompt + messages array
```

### ConciergeFloat.tsx — botão flutuante

```tsx
// Posição: fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50
// Botão: rounded-full h-14 w-14 bg-hotel-gold shadow-lg
// Ícone: Sparkles do lucide-react
// Badge de notificação: ponto vermelho quando há mensagens não lidas (opcional)
// Abre shadcn <Sheet side="right"> com largura 380px (md:w-96)
```

### ConciergeChatPanel.tsx — UI interna

```tsx
// Header: "✦ Concierge Digital" + botão fechar
// Área de mensagens: scroll automático para última mensagem
// Bolha usuário: bg-hotel-gold/15 text-right ml-auto max-w-[80%] rounded-2xl rounded-br-sm
// Bolha IA: bg-card border text-left mr-auto max-w-[80%] rounded-2xl rounded-bl-sm
// Places sugeridos: cards compactos abaixo da bolha da IA (nome + link para /place/:id)
// Loading: "..." animado na bolha da IA
// Input: fixo no rodapé, mesmo estilo do atual (rounded-full, hotel-gold border)
// Sugestões rápidas: chips horizontais quando messages.length === 0
```

### ConciergeChat.tsx — simplificar home

- Remover toda a lógica de chat do componente home
- Manter apenas: título da seção + subtítulo + botão "Falar com o Concierge" que chama `openChat()`
- O `useConciergeChat` precisa ser acessível globalmente — usar Context ou prop drilling via App.tsx

### App.tsx

```tsx
// Adicionar <ConciergeFloat /> antes de <BottomNav />
// ConciergeFloat encapsula todo o estado (Sheet + histórico)
// useConciergeChat vive dentro de ConciergeFloat (estado local — sem context necessário)
// Para ConciergeChat na home abrir o float: passar `onOpen` prop via Index.tsx
```

### shadcn Sheet

O projeto usa shadcn-ui. Sheet já deve estar disponível em `@/components/ui/sheet`.
Se não existir: `npx shadcn@latest add sheet` dentro de `castro-park-discover/`.

## Tasks

- [x] T1: Verificar/instalar shadcn Sheet (`src/components/ui/sheet.tsx`)
- [x] T2: Criar `src/hooks/useConciergeChat.ts` — multi-turno com messages[]
- [x] T3: Criar `src/components/ConciergeChatPanel.tsx` — UI de chat (bolhas + input + sugestões)
- [x] T4: Criar `src/components/ConciergeFloat.tsx` — botão flutuante + Sheet container
- [x] T5: Atualizar `api/concierge.js` — aceitar messages[] e passar histórico ao Claude
- [x] T6: Atualizar `src/components/ConciergeChat.tsx` — simplificar para CTA apenas
- [x] T7: Atualizar `src/App.tsx` — adicionar `<ConciergeFloat />` no layout global
- [x] T8: Atualizar `src/pages/Index.tsx` — conectar CTA do home ao float (custom DOM event)

## Dev Agent Record

### Checklist
- [x] TypeScript sem erros (`tsc --noEmit`)
- [x] Build sem erros (`vite build`)
- [x] Histórico persiste ao fechar/abrir o painel
- [x] IA responde com contexto da conversa anterior
- [x] Botão visível em todas as páginas
- [x] Sugestões visíveis no estado inicial

### File List
- `src/hooks/useConciergeChat.ts` — CRIADO
- `src/components/ConciergeChatPanel.tsx` — CRIADO
- `src/components/ConciergeFloat.tsx` — CRIADO
- `src/components/ConciergeChat.tsx` — MODIFICADO (simplificado para CTA)
- `src/App.tsx` — MODIFICADO (adicionado ConciergeFloat)
- `src/pages/Index.tsx` — MODIFICADO (CTA conectado ao float via custom event)
- `api/concierge.js` — MODIFICADO (aceita messages[], histórico ao Claude)
- `src/pages/Place.tsx` — CORRIGIDO (aspas tipográficas → aspas retas)

### Change Log
- feat: E-UX.7 — Concierge multi-turno com botão flutuante + Sheet
- fix: Place.tsx — corrige aspas tipográficas que quebravam o build
