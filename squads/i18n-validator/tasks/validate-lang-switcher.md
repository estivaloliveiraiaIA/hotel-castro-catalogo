# Task: validate-lang-switcher

## Objetivo
Validar que o LangSwitcher funciona corretamente: troca idioma, persiste no
localStorage, atualiza TODOS os textos da UI sem reload de página.

## Arquivos de foco
- `src/components/LangSwitcher.tsx`
- `src/components/Header.tsx`
- `src/lib/i18n.ts`

## Passos de execução

### 1. Verificar LangSwitcher.tsx

Ler o arquivo e confirmar:
- [ ] Usa `useTranslation()` para acessar `i18n`
- [ ] Detecta idioma ativo via `i18n.language`
- [ ] Chama `i18n.changeLanguage(lang)` ao clicar
- [ ] Renderiza exatamente 3 botões: PT, EN, ES
- [ ] Botão ativo tem estilo visual distinto (fundo gold)
- [ ] Não faz reload da página (`window.location.reload` ausente)

### 2. Verificar Header.tsx

Confirmar:
- [ ] `<LangSwitcher />` está incluído no Header
- [ ] Visível tanto no desktop quanto mobile (ou BottomNav tem alternativa)
- [ ] Não há lógica de "hide" que esconda o switcher em certas rotas

### 3. Verificar i18n.ts (configuração de persistência)

Ler `src/lib/i18n.ts` e confirmar:
- [ ] `LanguageDetector` está no array de plugins
- [ ] `detection.lookupLocalStorage` = `"i18n_lang"`
- [ ] `detection.caches` inclui `"localStorage"`
- [ ] `fallbackLng` = `"pt"`
- [ ] `supportedLngs` = `["pt", "en", "es"]`

### 4. Verificar que React Query re-processa ao trocar idioma

Em `usePlaces.ts` e `useEvents.ts`:
- [ ] `lang` faz parte do `queryKey`
- [ ] Trocar idioma dispara re-processamento dos dados em cache (sem nova request)
- [ ] Não há `staleTime: Infinity` que possa bloquear a re-execução

### 5. Verificar cobertura de componentes reativos

Grep por todos os `useTranslation` e confirmar que todos os componentes
que têm texto visível ao usuário estão na lista:

```bash
grep -rn "useTranslation" src/pages/ src/components/ --include="*.tsx" \
  --exclude-dir=admin
```

Componentes que TÊM texto de usuário mas NÃO aparecem no grep são candidatos a falha.

### 6. Verificar BottomNav mobile

Em `src/components/BottomNav.tsx`:
- [ ] Usa `useTranslation` para labels de navegação
- [ ] Labels mudam quando idioma muda

## Critério de aceite
- [ ] `i18n.changeLanguage()` chamado (não `window.location`)
- [ ] Idioma persiste em `localStorage["i18n_lang"]`
- [ ] Todos os componentes com texto usam `useTranslation`
- [ ] React Query inclui `lang` no queryKey para conteúdo dinâmico
- [ ] LangSwitcher visível e acessível no Header

## Output
- Status por item verificado
- Lista de componentes que têm texto mas NÃO usam useTranslation (se houver)
- Status final: ✅ PASS | ❌ FAIL | ⚠️ WARNING
