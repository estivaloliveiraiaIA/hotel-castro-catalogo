# 🗺️ Guia de Coleta Massiva de Dados - Castro Park Hotel

## 📋 Pré-requisitos

### 1. Criar conta no Apify (Gratuita)

1. Acesse: https://apify.com/
2. Clique em "Sign up for free"
3. Crie sua conta (pode usar Google/GitHub)
4. Após login, vá em **Settings** → **Integrations** → **Personal API tokens**
5. Clique em **"Create new token"**
6. Copie o token gerado

### 2. Configurar o arquivo .env

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
APIFY_TOKEN=seu_token_aqui
APIFY_TOKEN_FREE=seu_token_aqui
```

Por:

```env
APIFY_TOKEN=apify_api_SEU_TOKEN_COPIADO
APIFY_TOKEN_FREE=apify_api_SEU_TOKEN_COPIADO
```

> ⚠️ **IMPORTANTE**: O Apify oferece:
> - **Plano gratuito**: $5 em créditos grátis por mês
> - Cada busca consome créditos (TripAdvisor cobra mais que Google Maps)
> - Monitore seu uso em: https://console.apify.com/billing

## 🚀 Como Executar a Coleta

### Opção 1: Coleta Massiva (RECOMENDADO)

Este script coleta o **MÁXIMO de lugares possíveis** de Goiânia:

```bash
npm run ingest:massive
```

**O que ele faz:**
- ✅ Busca em 17+ termos diferentes (restaurantes, cafés, bares, parques, museus, etc.)
- ✅ Coleta até **500 resultados por termo** = ~8.500+ lugares potenciais
- ✅ Salva tudo em banco de dados SQLite (`data/places.db`)
- ✅ Remove duplicatas automaticamente
- ✅ Calcula distância do hotel automaticamente
- ✅ Exporta para JSON no final

**Tempo estimado:** 20-40 minutos (depende do Apify)

### Opção 2: Coleta Simples do TripAdvisor

```bash
npm run ingest
```

Coleta apenas 100 lugares (limite padrão).

### Opção 3: Coleta Mesclada (TripAdvisor + Google Maps)

```bash
npm run ingest:merged
```

Combina dados de múltiplas fontes.

## ⚙️ Configurações Avançadas

### Aumentar Quantidade de Lugares

Edite o arquivo `.env`:

```env
# Para coletar MUITOS lugares (cuidado com créditos)
MAX_RESULTS=1000
APIFY_MAX_ITEMS=1000

# Para coleta menor (economiza créditos)
MAX_RESULTS=200
APIFY_MAX_ITEMS=200
```

### Adicionar Mais Termos de Busca

No `.env`, adicione mais termos separados por `|`:

```env
SEARCH_TERMS=Goiania restaurantes|Goiania atrações turísticas|Goiania cafés|Goiania bares|Goiania vida noturna|Goiania parques|Goiania museus|Goiania shopping|Setor Sul Goiania|Alto da Glória Goiania|Jardim América Goiania
```

### Ajustar Localização do Hotel

Se as coordenadas do Castro's Park Hotel estiverem erradas, atualize:

```env
HOTEL_LAT=-16.6799
HOTEL_LNG=-49.2540
```

Para descobrir coordenadas:
1. Abra Google Maps
2. Clique com botão direito no hotel
3. Copie as coordenadas (primeiro número é LAT, segundo é LNG)

## 📊 Estrutura de Dados

### Banco de Dados SQLite

Localização: `data/places.db`

**Tabela `places`:**
- `id` - Identificador único
- `name` - Nome do lugar
- `category` - Categoria (restaurants, cafes, nightlife, etc.)
- `rating` - Avaliação (0-5)
- `review_count` - Número de avaliações
- `price_level` - Nível de preço (1-4)
- `description` - Descrição completa
- `image` - URL da imagem principal
- `address` - Endereço completo
- `latitude` / `longitude` - Coordenadas GPS
- `distance_km` - Distância do hotel em KM
- `phone` / `website` / `email` - Contatos
- `tags` - Tags/categorias (JSON)
- `gallery` - Galeria de fotos (JSON)
- `highlights` - Destaques (JSON)
- `source_url` - Link do TripAdvisor

### Arquivo JSON Exportado

Localização: `public/data/places.json`

Este arquivo é usado pelo site React automaticamente.

## 🔍 Consultar Dados Coletados

### Ver quantos lugares foram coletados:

```bash
# No terminal do projeto
sqlite3 data/places.db "SELECT COUNT(*) FROM places"
```

### Ver lugares por categoria:

```bash
sqlite3 data/places.db "SELECT category, COUNT(*) FROM places GROUP BY category"
```

### Ver top 10 lugares por avaliação:

```bash
sqlite3 data/places.db "SELECT name, rating, review_count FROM places ORDER BY rating DESC, review_count DESC LIMIT 10"
```

### Ver lugares próximos ao hotel (até 5km):

```bash
sqlite3 data/places.db "SELECT name, distance_km FROM places WHERE distance_km <= 5 ORDER BY distance_km"
```

## 🎯 Categorias Disponíveis

O sistema classifica automaticamente em:

- **restaurants** - Restaurantes e churrascarias
- **cafes** - Cafés, confeitarias e padarias
- **nightlife** - Bares, pubs e baladas
- **nature** - Parques, praças e áreas verdes
- **culture** - Museus, teatros, igrejas
- **shopping** - Shoppings e lojas
- **attractions** - Outras atrações turísticas

## ⚠️ Solução de Problemas

### Erro: "APIFY_TOKEN não encontrado"

- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme que você colocou o token corretamente (sem aspas)

### Erro: "Actor run failed"

- Verifique se você tem créditos no Apify
- O ator do TripAdvisor pode estar temporariamente indisponível

### Poucos resultados coletados

- Aumente `MAX_RESULTS` no `.env`
- Adicione mais `SEARCH_TERMS`
- Ative `includeNearbyResults: true` (já ativado no massive)

### Banco de dados corrompido

Delete e recrie:
```bash
rm data/places.db
npm run ingest:massive
```

## 💰 Gerenciamento de Créditos Apify

### Plano Gratuito:
- $5 grátis por mês
- TripAdvisor: ~$0.10 por 100 resultados
- Google Maps: ~$0.01 por 100 resultados

### Dicas para economizar:
1. Use `MAX_RESULTS=100` para testes
2. Reduza `SEARCH_TERMS` (mantenha só os essenciais)
3. Execute só quando necessário (dados duram semanas)
4. Use cache do banco de dados (rodadas subsequentes são mais rápidas)

## 🔄 Atualização Periódica

Recomendamos rodar a coleta:
- **Semanal**: Para manter dados atualizados
- **Mensal**: Se o banco tem muitos dados já

Comando:
```bash
npm run ingest:massive
```

Os dados existentes serão atualizados automaticamente (não duplica).

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do terminal
2. Consulte documentação Apify: https://docs.apify.com/
3. Verifique créditos em: https://console.apify.com/billing

---

**Criado por:** Sistema de Coleta Massiva Castro Park Hotel
**Última atualização:** 2026-01-12
