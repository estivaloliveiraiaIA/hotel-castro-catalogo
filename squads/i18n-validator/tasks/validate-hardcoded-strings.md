# Task: validate-hardcoded-strings

## Objetivo
Detectar strings em português hardcoded no código-fonte das páginas e componentes
públicos (não-admin) que deveriam estar usando `t("chave")` do react-i18next.

## Escopo
- `castro-park-discover/src/pages/` — exceto `src/pages/admin/`
- `castro-park-discover/src/components/` — exceto componentes ui/ (shadcn)

## Pré-condições
- Node.js disponível
- Acesso de leitura aos arquivos TSX

## Passos de execução

### 1. Rodar o script automatizado
```bash
cd castro-park-discover
node ../squads/i18n-validator/scripts/find-hardcoded-strings.js
```

O script reporta:
- Arquivo e linha onde strings PT foram encontradas em JSX
- Contexto da linha para avaliar se é string de usuário ou código interno

### 2. Grep manual por padrões comuns
Palavras PT frequentes em UI que podem ter escapado:

```bash
# Textos de botão e ação
grep -rn "Carregar\|Salvar\|Voltar\|Fechar\|Abrir\|Ver mais\|Ver todos" \
  src/pages/ src/components/ --include="*.tsx" \
  --exclude-dir=admin --exclude-dir=ui

# Textos de estado
grep -rn "Carregando\|Erro\|Não encontrado\|Nenhum\|Vazio" \
  src/pages/ src/components/ --include="*.tsx" \
  --exclude-dir=admin --exclude-dir=ui

# Textos de navegação
grep -rn "Início\|Guia\|Eventos\|Favoritos\|Roteiros\|Recomendados" \
  src/pages/ src/components/ --include="*.tsx" \
  --exclude-dir=admin --exclude-dir=ui
```

### 3. Verificar placeholders e aria-labels
```bash
grep -rn 'placeholder="\|aria-label="' \
  src/pages/ src/components/ --include="*.tsx" \
  --exclude-dir=admin --exclude-dir=ui
```

### 4. Falsos positivos conhecidos
Os seguintes NÃO são strings de usuário e podem ser ignorados:
- Class names (`className="font-serif"`)
- IDs de categoria (`"restaurants"`, `"nightlife"`)
- Nomes de variáveis e keys
- Strings em comentários `//` e `/* */`
- Strings dentro de `import` e `export`
- Texto em componentes `admin/`

## Critério de aceite
- [ ] Zero strings PT visíveis ao usuário fora de `t()`
- [ ] Zero `placeholder` em PT sem tradução
- [ ] Zero `aria-label` em PT hardcoded sem tradução
- [ ] Zero `title` de botão em PT hardcoded

## Output
- Lista de ocorrências encontradas (arquivo:linha:conteúdo)
- Classificação: STRING_USUÁRIO | FALSO_POSITIVO | REVISAR
- Status: ✅ PASS | ❌ FAIL | ⚠️ WARNING
