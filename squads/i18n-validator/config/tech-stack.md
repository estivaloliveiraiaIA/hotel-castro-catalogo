# Tech Stack — i18n-validator

## Projeto
- **App:** castro-park-discover (Guia digital de Goiânia para hóspedes)
- **Deploy:** Vercel — https://hotel-castro-catalogo-seven.vercel.app

## Stack i18n
- **react-i18next** — hook `useTranslation()`, componente `<Trans>`
- **i18next** — core engine
- **i18next-browser-languagedetector** — detecta idioma por localStorage → navigator
- **Locales:** `public/locales/{pt|en|es}/translation.json`
- **Storage key:** `i18n_lang` (localStorage)
- **Fallback:** `pt`

## Arquivos-chave
| Arquivo | Papel |
|---------|-------|
| `src/lib/i18n.ts` | Configuração do i18next, carrega os 3 locales |
| `src/components/LangSwitcher.tsx` | Botão PT\|EN\|ES na Header |
| `src/lib/i18nField.ts` | `resolveI18nField()` para conteúdo dinâmico |
| `src/hooks/usePlaces.ts` | Usa `resolveI18nField` + lang no queryKey |
| `src/hooks/useEvents.ts` | Usa `resolveI18nField` + lang no queryKey |
| `public/locales/pt/translation.json` | 168 linhas, ~14 namespaces |
| `public/locales/en/translation.json` | Espelho PT em inglês |
| `public/locales/es/translation.json` | Espelho PT em espanhol |

## Estrutura de chaves (namespaces)
```
nav, header, home, categories, events, favorites,
recommended, place, itinerary, concierge, footer,
notFound, common, langSwitcher
```

## Padrão de conteúdo dinâmico
Supabase armazena campos traduzidos como JSON string:
```json
{"pt": "Texto em português", "en": "English text", "es": "Texto en español"}
```
`resolveI18nField(field, lang)` resolve tanto string pura (legado PT) quanto JSON.
