# Task: validate-locale-completeness

## Objetivo
Garantir que os 3 arquivos de locale (PT/EN/ES) são estruturalmente idênticos —
mesmas chaves, sem valores vazios, sem namespace extra em nenhum idioma.

## Pré-condições
- `public/locales/pt/translation.json` existe e é JSON válido
- `public/locales/en/translation.json` existe e é JSON válido
- `public/locales/es/translation.json` existe e é JSON válido
- Node.js disponível

## Passos de execução

### 1. Rodar o script automatizado
```bash
cd castro-park-discover
node ../squads/i18n-validator/scripts/check-locale-keys.js
```

O script produz um relatório com:
- Total de chaves em cada locale
- Chaves em PT mas ausentes em EN
- Chaves em PT mas ausentes em ES
- Chaves com valor vazio string `""` em qualquer locale
- Chaves onde EN ou ES ainda têm o mesmo valor do PT (não traduzidas)

### 2. Verificação manual adicional
Abrir cada arquivo e confirmar visualmente:
- [ ] Estrutura de namespaces idêntica nos 3 arquivos
- [ ] Interpolações (`{{count}}`, `{{time}}`, etc.) presentes nas 3 versões
- [ ] Não há chaves obsoletas (presentes em EN/ES mas não em PT)

### 3. Verificar chaves com interpolação
Grep por `{{` nos 3 arquivos e confirmar que a mesma variável aparece nas 3 versões:
```bash
grep -n "{{" public/locales/pt/translation.json
grep -n "{{" public/locales/en/translation.json
grep -n "{{" public/locales/es/translation.json
```

## Critério de aceite
- [ ] Contagem de chaves PT = EN = ES
- [ ] Zero chaves ausentes em EN
- [ ] Zero chaves ausentes em ES
- [ ] Zero valores vazios `""` em qualquer locale
- [ ] Todas as interpolações `{{var}}` presentes nas 3 versões

## Output
Registrar resultados no relatório final com status:
- ✅ PASS — todos os critérios atendidos
- ❌ FAIL — chaves faltando ou valores ausentes (bloqueia deploy)
- ⚠️ WARNING — valores suspeitos (não traduzidos)
