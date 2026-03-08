# i18n-validator Squad

Squad especializado em validar a implementação de internacionalização (PT/EN/ES)
do app **hotel-castro-catalogo** (castro-park-discover).

## Quando usar

- Antes de qualquer deploy que adicione novos textos ao app
- Ao adicionar um novo componente ou página
- Ao adicionar novas chaves aos arquivos de locale
- Ao importar novos lugares ou eventos no admin
- Como parte do pipeline de CI/CD

## Como executar

### Execução completa (recomendado)

```bash
# A partir da raiz do projeto
cd castro-park-discover

# 1. Valida completude dos locales
node ../squads/i18n-validator/scripts/check-locale-keys.js

# 2. Detecta strings hardcoded
node ../squads/i18n-validator/scripts/find-hardcoded-strings.js
```

Após rodar os scripts, executar os tasks 3 e 4 manualmente via inspeção de código.

### Execução via agente AIOX

Ativar o agente `i18n-qa` e executar os 5 tasks em sequência:
1. `validate-locale-completeness`
2. `validate-hardcoded-strings`
3. `validate-dynamic-i18n`
4. `validate-lang-switcher`
5. `generate-i18n-report`

## Estrutura

```
squads/i18n-validator/
├── squad.yaml                      # Manifest do squad
├── README.md                       # Este arquivo
├── config/
│   └── tech-stack.md               # Contexto técnico do projeto
├── agents/
│   └── i18n-qa.md                  # Definição do agente QA i18n
├── tasks/
│   ├── validate-locale-completeness.md  # Task 1: chaves dos locales
│   ├── validate-hardcoded-strings.md    # Task 2: strings hardcoded
│   ├── validate-dynamic-i18n.md         # Task 3: conteúdo dinâmico
│   ├── validate-lang-switcher.md        # Task 4: LangSwitcher
│   └── generate-i18n-report.md          # Task 5: relatório final
├── checklists/
│   └── i18n-qa-checklist.md        # Checklist de 20 pontos
└── scripts/
    ├── check-locale-keys.js         # Compara chaves PT/EN/ES
    └── find-hardcoded-strings.js    # Detecta strings PT hardcoded
```

## Quality Gates

| Gate | Critério | Severidade |
|------|----------|------------|
| Completude de locales | Chaves PT = EN = ES | BLOCKER |
| Zero strings hardcoded | Nenhuma string PT fora de t() | BLOCKER |
| Conteúdo dinâmico | resolveI18nField em todos os hooks | BLOCKER |
| LangSwitcher funcional | Troca idioma + persiste | BLOCKER |

## Output

O relatório final é gerado em `castro-park-discover/docs/qa/i18n-validation-report.md`.
