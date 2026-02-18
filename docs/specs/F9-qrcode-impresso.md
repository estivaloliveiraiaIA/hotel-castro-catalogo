# F9 — QR Code Impresso
## Spec Técnica

**Owner:** Uma (aios-ux)  
**Suporte:** Gage (aios-devops), copy-chief  
**Fase:** 4 | **Prioridade:** P2

---

## Objetivo
Card físico elegante nos quartos do hotel com QR Code para acesso direto ao guia digital, criando ponte entre experiência física e digital.

## Entregáveis

### 1. Card físico (frente/verso)

**Frente:**
- Logo Castro's Park Hotel
- Texto: "Seu Guia Pessoal de Goiânia"
- QR Code centralizado
- Subtexto: "Aponte a câmera e descubra"

**Verso:**
- 3 ícones: 🍽️ Restaurantes | 🗺️ Roteiros | 💬 Concierge
- URL legível: `guia.castrospark.com.br`
- "Uma curadoria exclusiva para você"

**Especificações de impressão:**
- Tamanho: 85mm x 55mm (padrão cartão de visita)
- Papel: couché fosco 350g (toque premium)
- Acabamento: laminação soft-touch
- Cores: marrom + dourado + branco

### 2. Landing page `/welcome`
- Página otimizada para primeiro acesso via QR
- Mensagem de boas-vindas personalizada
- Atalhos rápidos: Roteiros, Mapa, Concierge
- Prompt para adicionar à tela inicial (Add to Home Screen)
- Carregamento ≤ 1.5s

### 3. Arquivo de design
- PDF print-ready (CMYK, sangria 3mm)
- Versão editável (Figma ou SVG)

## Copy (copy-chief)
- Texto do card (frente e verso)
- Mensagem de boas-vindas da landing page
- Tom: elegante, acolhedor, conciso

## DevOps (Gage)
- Configurar domínio `guia.castrospark.com.br` (ou subdomínio adequado)
- Redirect do QR para a landing page
- Analytics de scans (UTM params no QR)

## Critérios de aceite
- [ ] Card em PDF print-ready aprovado
- [ ] Landing page funcional e rápida (≤ 1.5s)
- [ ] QR Code testado em ≥ 3 dispositivos
- [ ] Analytics de scans configurado
- [ ] Design consistente com identidade visual do hotel
