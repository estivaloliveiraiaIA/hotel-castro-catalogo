# Task: validate-dynamic-i18n

## Objetivo
Validar que o conteúdo dinâmico carregado do Supabase (places e events)
resolve corretamente pelo idioma ativo — nunca exibe JSON bruto nem sempre PT.

## Arquivos de foco
- `src/lib/i18nField.ts` — função resolveI18nField
- `src/hooks/usePlaces.ts` — resolução de places por idioma
- `src/hooks/useEvents.ts` — resolução de events por idioma

## Passos de execução

### 1. Verificar i18nField.ts

Ler o arquivo e confirmar:
- [ ] `resolveI18nField(field, lang)` aceita `string | object | null | undefined`
- [ ] Detecta JSON string (`field.startsWith("{")`) e faz `JSON.parse`
- [ ] Fallback chain: `lang → pt → en → es → fallback`
- [ ] Não lança exceção em JSON malformado (try/catch presente)
- [ ] Aceita lang como `"pt"`, `"en"`, `"es"` e também `"pt-BR"`, `"en-US"` (slice 0,2)

### 2. Verificar usePlaces.ts

Ler o arquivo e confirmar:
- [ ] Importa `useTranslation` e extrai `lang` de `i18n.language`
- [ ] `lang` está presente no `queryKey`: `["places", __BUILD_ID__, lang]`
- [ ] `rowToPlace` recebe `lang` e chama `resolveI18nField(row.name, lang)`
- [ ] `rowToPlace` chama `resolveI18nField(row.description, lang)`
- [ ] Fallback: `|| (row.name as string)` para evitar nome vazio

### 3. Verificar useEvents.ts

Ler o arquivo e confirmar:
- [ ] Importa `useTranslation` e extrai `lang`
- [ ] `lang` no `queryKey`: `["events", lang]`
- [ ] `resolveI18nField` aplicado em `title` e `description`
- [ ] Fallback para string original em `title` (não pode ser null)

### 4. Verificar que nenhum outro hook carrega texto sem resolução

```bash
grep -rn "\.from(\"places\"\|\.from(\"events\"" src/hooks/ --include="*.ts"
```
Confirmar que qualquer hook que busca places/events aplica resolveI18nField.

### 5. Verificar que o JSON bruto nunca chega ao DOM

Grep em pages e components por `place\.name\|place\.description\|event\.title` —
confirmar que todos os usos já recebem a string resolvida (não o objeto/JSON).

```bash
grep -rn "place\.description\|place\.name\|event\.title\|event\.description" \
  src/pages/ src/components/ --include="*.tsx" --exclude-dir=admin
```

### 6. Testar o formato de armazenamento

Confirmar que o endpoint de tradução (`POST /api/admin/places action=translate`)
retorna JSON string e não objeto, exemplo esperado:
```
'{"pt":"Restaurante italiano...","en":"Italian restaurant...","es":"Restaurante italiano..."}'
```

## Critério de aceite
- [ ] `resolveI18nField` tem cobertura total de tipos de entrada
- [ ] `usePlaces` e `useEvents` incluem `lang` no queryKey
- [ ] Todos os campos de texto dinâmico passam por `resolveI18nField`
- [ ] Nenhum componente público renderiza JSON bruto ou objeto `[object Object]`
- [ ] Mudança de idioma re-processa os dados sem nova request ao Supabase

## Output
- Status por item verificado
- Status final: ✅ PASS | ❌ FAIL | ⚠️ WARNING
