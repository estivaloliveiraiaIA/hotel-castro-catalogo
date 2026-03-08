# i18n Validation Report — Castro's Park Discover

**Data:** 2026-03-08
**Squad:** i18n-validator
**Executor:** @qa (Quinn i18n)
**Status final:** ✅ PASS

---

## 1. Completude dos Locales

| Locale | Chaves | Status |
|--------|--------|--------|
| PT (pt) | 160 | ✅ Referência |
| EN (en) | 160 | ✅ Completo |
| ES (es) | 160 | ✅ Completo |

**Namespaces cobertos (14):** nav, header, home, categories, events, favorites, recommended, place, itinerary, concierge, footer, notFound, common, langSwitcher, filters, carousel, gallery

**Warnings (não-bloqueantes):**
- `footer.address` tem valor idêntico em PT e EN — esperado, é endereço físico (nome próprio)

---

## 2. Strings Hardcoded

**Script:** `squads/i18n-validator/scripts/find-hardcoded-strings.js`
**Arquivos varridos:** 59 TSX/TS (exceto admin/ e ui/)

**Issues encontradas (pré-correção):** 14 em 3 arquivos
**Issues após correção:** 0

### Correções aplicadas

| Arquivo | Correção |
|---------|---------|
| `src/components/ListFilters.tsx` | 12 strings → chaves `filters.*` com `useTranslation` |
| `src/components/HomeCarousel.tsx` | 2 aria-labels + 1 template literal → `carousel.*` |
| `src/components/PlaceGallery.tsx` | 2 aria-labels + 1 template literal → `gallery.*` |

**Novos namespaces adicionados aos 3 locales:**
- `filters` (19 chaves) — sort, distance, price, minRating, openNow
- `carousel` (3 chaves) — prevSlide, nextSlide, goToSlide
- `gallery` (3 chaves) — prevPhoto, nextPhoto, goToPhoto

---

## 3. Conteúdo Dinâmico (resolveI18nField)

**Hook:** `useEvents.ts` aplica `resolveI18nField` em `title` e `description`
**Hook:** `usePlaces` aplica `resolveI18nField` nos campos textuais
**Query keys** incluem `lang` → reprocessamento automático na troca de idioma
**Status:** ✅ Verificado

---

## 4. LangSwitcher

- Componente altera `i18n.changeLanguage(lang)` e persiste em `localStorage`
- React Query invalida queries com lang no queryKey
- Textos da UI (t()) re-renderizam imediatamente via react-i18next context
- Conteúdo dinâmico (places/events) re-processa via `resolveI18nField`
- **Status:** ✅ Verificado

---

## 5. Checklist i18n-qa (20 pontos)

| Categoria | Pontos | Status |
|-----------|--------|--------|
| L1-L6 Locales | 6/6 | ✅ PASS |
| C1-C5 Componentes | 5/5 | ✅ PASS |
| D1-D4 Dinâmico | 4/4 | ✅ PASS |
| S1-S3 LangSwitcher | 3/3 | ✅ PASS |
| I1-I2 Interpolações | 2/2 | ✅ PASS |

**Total: 20/20** ✅

---

## 6. Conclusão

A cobertura i18n do app está **completa e consistente** nos 3 idiomas (PT/EN/ES).
Todos os textos visíveis ao usuário — botões, cabeçalhos, aria-labels, placeholders — utilizam `t()` do react-i18next.
O conteúdo dinâmico do Supabase (places, events) resolve corretamente o idioma ativo via `resolveI18nField`.

**Nenhum blocker identificado.**
