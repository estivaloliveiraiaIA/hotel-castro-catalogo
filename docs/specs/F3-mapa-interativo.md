# F3 — Mapa Interativo
## Spec Técnica

**Owner:** Dex (aios-dev)  
**Suporte:** Uma (aios-ux)  
**Fase:** 2 | **Prioridade:** P1

---

## Objetivo
Dar orientação espacial visual ao hóspede, mostrando os lugares no mapa com referência clara de distância do hotel.

## Funcionalidades

| Feature | Descrição |
|---------|-----------|
| Mapa base | Leaflet + OpenStreetMap (gratuito) ou Mapbox (premium) |
| Marcador hotel | Pin dourado fixo na posição do Castro's Park Hotel |
| Marcadores lugares | Pins por categoria (cor/ícone diferente) |
| Raio de distância | Círculos de 1km, 3km, 5km ao redor do hotel |
| Filtro por categoria | Toggle de categorias no mapa |
| Cluster | Agrupamento automático em zoom baixo |
| Click no pin | Mini-card com nome, nota, distância + link "Ver mais" |

## Componentes
- `MapView.tsx` — componente principal
- `MapMarker.tsx` — marcador customizado por categoria
- `MapPopup.tsx` — popup ao clicar no pin
- `MapFilters.tsx` — filtros de categoria sobre o mapa

## Dependências
- `leaflet` + `react-leaflet`

## UX (Uma)
- Tema escuro ou neutro (não default azul)
- Pins com ícone de categoria (🍽️ 🍸 ☕ 🌳 🎭 🛍️)
- Mobile: mapa 100% viewport com filtros no topo

## Critérios de aceite
- [ ] ≥ 90% dos lugares com coordenadas no mapa
- [ ] Filtros por categoria funcionando
- [ ] Raio de distância visível
- [ ] Carrega em ≤ 2s
- [ ] Responsivo mobile + desktop
