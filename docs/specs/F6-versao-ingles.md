# F6 — Versão em Inglês
## Spec Técnica

**Owner:** Dex (aios-dev)  
**Suporte:** copy-chief, Uma (aios-ux)  
**Fase:** 3 | **Prioridade:** P1

---

## Objetivo
Oferecer experiência completa em inglês para hóspedes internacionais, com toggle simples PT/EN.

## Escopo de tradução

| Camada | Itens | Responsável |
|--------|-------|-------------|
| UI (menus, botões, labels) | ~50 strings | aios-dev |
| Categorias e filtros | ~15 strings | aios-dev |
| Top 30 curados (descrições) | 30 textos | copy-chief |
| Roteiros temáticos | 5 roteiros completos | copy-chief |
| Dicas do concierge | ~15 textos | copy-chief |
| Nomes de lugares | Manter em português (são nomes próprios) | — |

## Implementação técnica

### Biblioteca: `react-i18next`
```bash
npm install react-i18next i18next
```

### Estrutura de arquivos
```
src/
  i18n/
    index.ts          # configuração
    locales/
      pt.json         # português (default)
      en.json         # inglês
```

### Detecção de idioma
1. URL param: `?lang=en`
2. localStorage (persistência da escolha)
3. Fallback: português

### Toggle UI
- Componente `LanguageSwitch.tsx` no Header
- Bandeira 🇧🇷/🇺🇸 ou texto "PT | EN"
- Estilo discreto, alinhado com design luxo

## Critérios de aceite
- [ ] 100% da UI traduzida
- [ ] Top 30 com descrição em inglês
- [ ] Roteiros traduzidos
- [ ] Toggle funcional e persistente
- [ ] SEO: meta tags em inglês quando lang=en
- [ ] Sem quebra de layout por diferença de tamanho de texto
