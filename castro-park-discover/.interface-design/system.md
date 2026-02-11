# Design System — Castro's Park Hotel (Guia de Goiânia)

> Este arquivo é uma referência de consistência (inspirado no método do repo `interface-design`).
> Objetivo: manter identidade visual estável entre sessões/commits.

## Direção
- Personalidade: **Sofisticação & acolhimento** (hotel tradicional, premium)
- Base: **warm neutral** (creme/bege)
- Acentos: **dourado** e **âmbar**
- Primário: **marrom elegante**

## Tokens (CSS Variables)
(Definidos em `src/index.css` — HSL)
- `--background`: 34 45% 97%
- `--foreground`: 28 22% 16%
- `--primary`: 26 28% 26%
- `--secondary`: 41 40% 58%
- `--accent`: 33 55% 46%
- `--radius`: 0.75rem

## Tipografia
- Body: **Inter**
- Headings/Brand: **Cormorant Garamond**

## Layout / Spacing
- Mobile-first
- Grid desktop: `md: 2 cols`, `lg: 3`, `xl: 4`
- Seções na home:
  - Mobile: carrossel horizontal (cards com `min-w-[260px]`)
  - Desktop: grid

## Component patterns
- Card: borda suave + imagem 4:3
- Botões: primário = marrom, secundário = neutro
- Links: underline discreto

## Nunca
- Não usar cores fora do sistema sem necessidade
- Evitar sombras pesadas (preferir borda + hover sutil)
