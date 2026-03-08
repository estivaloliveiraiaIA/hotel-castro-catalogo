# Task: generate-i18n-report

## Objetivo
Compilar os resultados de todos os 4 tasks anteriores em um relatório único,
legível, com veredicto final e recomendações de correção.

## Pré-condições
- Tasks 1 a 4 executados e resultados documentados

## Passos de execução

### 1. Criar diretório do relatório
```bash
mkdir -p castro-park-discover/docs/qa
```

### 2. Gerar o arquivo de relatório

Criar `castro-park-discover/docs/qa/i18n-validation-report.md` com a estrutura:

```markdown
# Relatório de Validação i18n
**Data:** {data atual}
**App:** hotel-castro-catalogo (castro-park-discover)
**Idiomas:** PT / EN / ES

## Sumário Executivo
| Check | Status | Detalhes |
|-------|--------|----------|
| 1. Completude dos locales | ✅/❌/⚠️ | {resumo} |
| 2. Strings hardcoded | ✅/❌/⚠️ | {resumo} |
| 3. Conteúdo dinâmico i18n | ✅/❌/⚠️ | {resumo} |
| 4. LangSwitcher | ✅/❌/⚠️ | {resumo} |

## Veredicto Final
**{APPROVED / NEEDS WORK}**

## Detalhes por Check

### Check 1 — Completude dos locales
{resultados do task validate-locale-completeness}

### Check 2 — Strings hardcoded
{resultados do task validate-hardcoded-strings}

### Check 3 — Conteúdo dinâmico
{resultados do task validate-dynamic-i18n}

### Check 4 — LangSwitcher
{resultados do task validate-lang-switcher}

## Issues Encontrados
{lista numerada de issues com severidade BLOCKER/WARNING/INFO}

## Recomendações
{ações específicas para cada issue encontrado}
```

### 3. Regras de veredicto

**APPROVED** — todos os 4 checks em PASS ou WARNING sem BLOCKER
**NEEDS WORK** — qualquer check com FAIL ou WARNING de severidade BLOCKER

### 4. Severidades

| Severidade | Critério |
|------------|----------|
| BLOCKER | Chave faltando em EN ou ES; JSON bruto exibido ao usuário; LangSwitcher não funciona |
| WARNING | Valor possivelmente não traduzido; componente sem useTranslation com texto estático |
| INFO | Sugestão de melhoria sem impacto funcional |

## Output
- Arquivo `docs/qa/i18n-validation-report.md` salvo no projeto
- Sumário exibido no terminal
- Exit code: 0 (APPROVED) ou 1 (NEEDS WORK) para uso em CI
