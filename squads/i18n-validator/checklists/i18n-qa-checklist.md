# i18n QA Checklist — hotel-castro-catalogo

Checklist de 20 pontos para validação completa da implementação i18n.
Executar antes de qualquer deploy que altere traduções ou componentes com texto.

---

## Bloco 1 — Locales (6 pontos)

- [ ] **L1** — `public/locales/pt/translation.json` é JSON válido e parseável
- [ ] **L2** — `public/locales/en/translation.json` é JSON válido e parseável
- [ ] **L3** — `public/locales/es/translation.json` é JSON válido e parseável
- [ ] **L4** — Número de chaves é idêntico nos 3 arquivos (script: check-locale-keys.js)
- [ ] **L5** — Nenhuma chave tem valor vazio `""` em EN ou ES
- [ ] **L6** — Todas as interpolações `{{var}}` presentes nas 3 versões de cada chave

## Bloco 2 — Componentes e Páginas (5 pontos)

- [ ] **C1** — Todos os arquivos em `src/pages/` (exceto admin/) usam `useTranslation`
- [ ] **C2** — Todos os componentes com texto visível em `src/components/` usam `useTranslation`
- [ ] **C3** — Zero strings PT com acentos hardcoded fora de `t()` (script: find-hardcoded-strings.js)
- [ ] **C4** — Zero `placeholder` em PT sem `t()`
- [ ] **C5** — Zero `aria-label` em PT sem `t()`

## Bloco 3 — Conteúdo Dinâmico (4 pontos)

- [ ] **D1** — `src/lib/i18nField.ts` tem fallback chain completo (lang → pt → en → es)
- [ ] **D2** — `usePlaces.ts` inclui `lang` no `queryKey`
- [ ] **D3** — `useEvents.ts` inclui `lang` no `queryKey`
- [ ] **D4** — Nenhum componente renderiza objeto JSON bruto `[object Object]` ou string `{"pt":...}`

## Bloco 4 — LangSwitcher (3 pontos)

- [ ] **S1** — `<LangSwitcher />` presente e visível no Header
- [ ] **S2** — Troca de idioma não faz reload de página (`window.location.reload` ausente no switcher)
- [ ] **S3** — Idioma selecionado persiste após recarregar a página (localStorage `i18n_lang`)

## Bloco 5 — Configuração i18n (2 pontos)

- [ ] **I1** — `src/lib/i18n.ts` carrega os 3 locales e tem `fallbackLng: "pt"`
- [ ] **I2** — `LanguageDetector` configurado com `lookupLocalStorage: "i18n_lang"`

---

## Resultado

| Pontos | Status |
|--------|--------|
| 20/20 | ✅ APPROVED |
| 18-19/20 | ⚠️ APPROVED com ressalvas |
| < 18/20 | ❌ NEEDS WORK |

**Data de execução:** _______________
**Executado por:** _______________
**Veredicto:** _______________
