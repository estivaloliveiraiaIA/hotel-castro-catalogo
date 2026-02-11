import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";

await loadEnv();

const APIFY_TOKEN_TA = process.env.APIFY_TOKEN; // TripAdvisor actor
const APIFY_TOKEN_FREE = process.env.APIFY_TOKEN_FREE; // OpenMap actor
const OPENMAP_ACTOR_ID = process.env.OPENMAP_ACTOR_ID || "ahmed_jasarevic/google-maps-business-data-scraper-free";
const TA_ACTOR_ID = process.env.TA_ACTOR_ID || "maxcopell/tripadvisor";

const SEARCH_TERMS = process.env.SEARCH_TERMS
  ? process.env.SEARCH_TERMS.split("|").map((t) => t.trim()).filter(Boolean)
  : [process.env.LOCATION_QUERY || "Goiania"];
const LOCATION_QUERY = process.env.LOCATION_QUERY || "Goiania";

const MAX_RESULTS_DEFAULT = Number(process.env.LBD_MAX_RESULTS || 150);
const MAX_RESULTS_LIGHT = Number(process.env.LBD_MAX_RESULTS_LIGHT || 20);
const HOTEL_LAT = Number(process.env.HOTEL_LAT);
const HOTEL_LNG = Number(process.env.HOTEL_LNG);
const OPENMAP_GEOCODE_LIMIT = Number(process.env.OPENMAP_GEOCODE_LIMIT || 200);
const OPENMAP_CONCURRENCY = Number(process.env.OPENMAP_CONCURRENCY || 3);

if (!APIFY_TOKEN_FREE) {
  console.error("APIFY_TOKEN_FREE não definido no .env");
  process.exit(1);
}
if (!APIFY_TOKEN_TA) {
  console.error("APIFY_TOKEN (TripAdvisor) não definido no .env");
  process.exit(1);
}
if (!Number.isFinite(HOTEL_LAT) || !Number.isFinite(HOTEL_LNG)) {
  console.error("HOTEL_LAT / HOTEL_LNG não definidos ou inválidos no .env");
  process.exit(1);
}

const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");

async function main() {
  // 1) Coleta TripAdvisor (dados ricos)
  const tripPlaces = await collectTripAdvisor();

  // 2) Geocodifica cada lugar do Trip via OpenMap (coord/distância)
  const openMapByName = await enrichCoordsFromOpenMap(tripPlaces);

  // 3) Merge: manter todos do TripAdvisor e enriquecer com coords/distância por nome
  const merged = mergePlaces(tripPlaces, openMapByName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        source: "merged_tripadvisor_openmap",
        places: merged,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`> ${merged.length} lugares salvos em ${outputFile}`);
}

async function collectTripAdvisor() {
  const client = new ApifyClient({ token: APIFY_TOKEN_TA });
  let allItems = [];
  for (const term of SEARCH_TERMS) {
    const limit = pickLimit(term);
    console.log(`> [TripAdvisor] Buscando "${term}" (limite ${limit})...`);
    const run = await client.actor(TA_ACTOR_ID).call({
      query: term,
      maxItemsPerQuery: limit,
      includeTags: true,
      includeNearbyResults: false,
      includeAttractions: true,
      includeRestaurants: true,
      includeHotels: false,
      includeVacationRentals: false,
      includePriceOffers: false,
      includeAiReviewsSummary: false,
      language: "pt",
      currency: "BRL",
    });
    const datasetId = run.defaultDatasetId;
    if (!datasetId) continue;
    const items = await fetchAllDatasetItems(client, datasetId);
    items.forEach((it) => (it.__originQuery = term));
    console.log(`  -> ${items.length} itens`);
    allItems = allItems.concat(items);
  }
  return normalizeTrip(allItems);
}

async function enrichCoordsFromOpenMap(tripPlaces) {
  const client = new ApifyClient({ token: APIFY_TOKEN_FREE });
  const result = new Map();
  const subset = tripPlaces.slice(0, OPENMAP_GEOCODE_LIMIT);
  let index = 0;

  async function worker() {
    while (index < subset.length) {
      const current = subset[index++];
      const query = `${current.name} ${LOCATION_QUERY}`.trim();
      try {
        const run = await client.actor(OPENMAP_ACTOR_ID).call({ queries: [query], limit: 1 });
        const datasetId = run.defaultDatasetId;
        if (!datasetId) continue;
        const items = await fetchAllDatasetItems(client, datasetId);
        if (items.length === 0) continue;
        const item = items[0];
        const lat = numberOrUndefined(item.latitude || item.lat);
        const lng = numberOrUndefined(item.longitude || item.lng);
        const distanceKm = computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG);
        result.set(normalizeName(current.name), {
          lat,
          lng,
          address: item.address || item.vicinity,
          distanceKm,
          originQueries: [query],
          tags: item.categories || [],
        });
      } catch (err) {
        console.warn(`  ! Falha ao geocodificar "${current.name}": ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const workers = Array.from({ length: OPENMAP_CONCURRENCY }, () => worker());
  await Promise.all(workers);
  return result;
}

function normalizeTrip(items) {
  const map = new Map();
  for (const item of items) {
    const sourceUrl = item.webUrl || item.url;
    const rawId = item.id || item.locationId || item.webUrl || item.name || `${item.type || "unknown"}-${item.rankingPosition || ""}`;
    const safeId = encodeId(rawId);
    const key = sourceUrl || safeId;
    const originQuery = item.__originQuery;

    const image =
      item.image ||
      (Array.isArray(item.photos) && item.photos.length > 0 ? item.photos[0]?.url : null);

    const priceLevel = parsePriceLevel(item.price_level || item.priceLevel);
    const description = item.description || item.snippet || "Descrição não disponível";
    const category = mapCategory([item.category, item.type, originQuery]);
    const tags = buildTagsTrip(item);
    const normalized = {
      id: safeId,
      sourceId: safeId,
      name: item.name || "Lugar sem nome",
      category,
      rating: Number(item.rating ?? item.averageRating ?? 0) || 0,
      reviewCount: Number(item.numberOfReviews ?? item.num_reviews ?? item.userReviewCount ?? 0) || 0,
      priceLevel,
      priceText: item.price_level || item.priceRange || item.price,
      description,
      image,
      address: item.address || item.address_obj?.address_string || item.parentGeoName || "Endereço não informado",
      latitude: undefined,
      longitude: undefined,
      phone: item.phone || item.phone_number || null,
      website: item.website || null,
      email: null,
      tags,
      sourceUrl,
      openStatusCategory: item.currentOpenStatusCategory ?? null,
      openStatusText: item.currentOpenStatusText ?? null,
      menuUrl: item.menuUrl || item.menu_link || null,
      reviews: undefined,
      categories: [category],
      gallery: undefined,
      highlights: item.reviewSnippets?.reviewSnippetsList?.map((r) => r.reviewText).slice(0, 5),
      notes: undefined,
      originQueries: originQuery ? [originQuery] : [],
      distanceKm: undefined,
    };

    const existing = map.get(key);
    if (!existing || normalized.rating > existing.rating) {
      map.set(key, normalized);
    }
  }
  return Array.from(map.values());
}

function mergePlaces(tripPlaces, openByName) {
  const mergedMap = new Map();

  // TripAdvisor com coords/distância do OpenMap quando casar
  for (const t of tripPlaces) {
    const match = openByName.get(normalizeName(t.name));
    if (match) {
      t.latitude = t.latitude ?? match.lat;
      t.longitude = t.longitude ?? match.lng;
      t.address = t.address || match.address;
      if (Number.isFinite(t.latitude) && Number.isFinite(t.longitude)) {
        t.distanceKm = computeDistanceKm(t.latitude, t.longitude, HOTEL_LAT, HOTEL_LNG);
      } else {
        t.distanceKm = match.distanceKm;
      }
      t.originQueries = Array.from(new Set([...(t.originQueries || []), ...(match.originQueries || [])]));
      t.tags = Array.from(new Set([...(t.tags || []), ...(match.tags || [])])).slice(0, 8);
    }
    mergedMap.set(t.id, t);
  }

  return Array.from(mergedMap.values());
}

function buildTagsTrip(item) {
  const tags = new Set();
  if (Array.isArray(item.subcategories)) item.subcategories.forEach((t) => t && tags.add(t.name || t));
  if (Array.isArray(item.cuisine)) item.cuisine.forEach((c) => c?.name && tags.add(c.name));
  if (Array.isArray(item.establishmentTypeAndCuisineTags)) item.establishmentTypeAndCuisineTags.forEach((t) => t && tags.add(t));
  if (item.category) tags.add(item.category);
  if (item.type) tags.add(item.type);
  if (item.__originQuery) tags.add(item.__originQuery);
  return Array.from(tags).slice(0, 8);
}

function pickLimit(term) {
  const lower = term.toLowerCase();
  if (lower.includes("parque") || lower.includes("park") || lower.includes("museu") || lower.includes("museo") || lower.includes("shopping")) {
    return MAX_RESULTS_LIGHT;
  }
  return MAX_RESULTS_DEFAULT;
}

function computeDistanceKm(lat1, lon1, lat2, lon2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) return undefined;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function mapCategory(categories) {
  const joined = categories.map((c) => (c || "").toLowerCase()).join(" | ");
  if (joined.match(/caf|coffee|confeitaria|doces|bakery|bolo|padaria/)) return "cafes";
  if (joined.match(/bar|pub|brew|chopp|balada|night/)) return "nightlife";
  if (joined.match(/restaurant|restaurante|food|churrascaria|pizza|sushi|steak/)) return "restaurants";
  if (joined.match(/park|parque|praça|square/)) return "nature";
  if (joined.match(/museum|museu|teatro|catedral|igreja|monumento|cultura|art/)) return "culture";
  if (joined.match(/shopping|mall|loja|store/)) return "shopping";
  return "attractions";
}

function parsePriceLevel(level) {
  if (!level) return 0;
  const dollarMatches = String(level).match(/\$/g);
  if (dollarMatches) return dollarMatches.length;
  const numeric = Number(level);
  return Number.isFinite(numeric) ? numeric : 0;
}

function numberOrUndefined(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function encodeId(raw) {
  if (!raw) return "unknown";
  return encodeURIComponent(String(raw));
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

async function fetchAllDatasetItems(client, datasetId) {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const { items, total } = await client.dataset(datasetId).listItems({ offset, limit });
    all.push(...items);
    if (offset + limit >= total) break;
    offset += limit;
  }
  return all;
}

async function loadEnv() {
  const envPath = path.resolve(".env");
  try {
    const content = await fs.readFile(envPath, "utf8");
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const [key, ...rest] = line.split("=");
        const value = rest.join("=").trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
  } catch {
    // opcional
  }
}

main().catch((err) => {
  console.error("Ingestão merged falhou:", err);
  process.exit(1);
});
