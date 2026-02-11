import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";

await loadEnv();

const APIFY_TOKEN_FREE = process.env.APIFY_TOKEN_FREE;
const OPENMAP_ACTOR_ID = process.env.OPENMAP_ACTOR_ID || "ahmed_jasarevic/google-maps-business-data-scraper-free";
const SEARCH_TERMS = process.env.SEARCH_TERMS
  ? process.env.SEARCH_TERMS.split("|").map((t) => t.trim()).filter(Boolean)
  : [process.env.LOCATION_QUERY || "Goiania"];
const MAX_RESULTS_DEFAULT = Number(process.env.LBD_MAX_RESULTS || 150);
const MAX_RESULTS_LIGHT = Number(process.env.LBD_MAX_RESULTS_LIGHT || 20);
const HOTEL_LAT = Number(process.env.HOTEL_LAT);
const HOTEL_LNG = Number(process.env.HOTEL_LNG);

if (!APIFY_TOKEN_FREE) {
  console.error("APIFY_TOKEN_FREE não definido no .env");
  process.exit(1);
}
if (!Number.isFinite(HOTEL_LAT) || !Number.isFinite(HOTEL_LNG)) {
  console.error("HOTEL_LAT / HOTEL_LNG não definidos ou inválidos no .env");
  process.exit(1);
}

const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");

async function main() {
  const client = new ApifyClient({ token: APIFY_TOKEN_FREE });
  let allItems = [];

  for (const term of SEARCH_TERMS) {
    const limit = pickLimit(term);
    console.log(`> Buscando "${term}" no ator ${OPENMAP_ACTOR_ID} (limite ${limit})...`);
    const run = await client.actor(OPENMAP_ACTOR_ID).call({
      queries: [term],
      limit,
    });
    const datasetId = run.defaultDatasetId;
    if (!datasetId) {
      console.warn("  ! Nenhum dataset retornado");
      continue;
    }
    const items = await fetchAllDatasetItems(client, datasetId);
    items.forEach((it) => (it.__originQuery = term));
    console.log(`  -> ${items.length} itens`);
    allItems = allItems.concat(items);
  }

  const places = normalizeItems(allItems);
  console.log(`> ${places.length} lugares normalizados (deduplicados)`);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        source: OPENMAP_ACTOR_ID,
        places,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`> Dados salvos em ${outputFile}`);
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

function normalizeItems(items) {
  const map = new Map();

  for (const item of items) {
    const id =
      item.id ||
      item.place_id ||
      item.url ||
      item.name ||
      `${item.latitude || item.lat}-${item.longitude || item.lng}`;
    if (!id) continue;
    const key = id;

    const lat = numberOrUndefined(item.latitude || item.lat);
    const lng = numberOrUndefined(item.longitude || item.lng);
    const distanceKm = computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG);

    const categories = [];
    if (Array.isArray(item.categories)) categories.push(...item.categories);
    if (item.category) categories.push(item.category);
    if (item.type) categories.push(item.type);
    if (item.__originQuery) categories.push(item.__originQuery);

    const normalized = {
      id,
      sourceId: id,
      name: item.name || "Lugar sem nome",
      category: mapCategory(categories),
      rating: Number(item.rating ?? 0) || 0,
      reviewCount: Number(item.user_ratings_total ?? item.reviews_count ?? 0) || 0,
      priceLevel: parsePriceLevel(item.price_level),
      priceText: item.price_level || undefined,
      description: item.description || item.vicinity || "Descrição não disponível",
      image: item.thumbnail || null,
      address: item.address || item.vicinity || "Endereço não informado",
      latitude: lat,
      longitude: lng,
      phone: item.phone_number || item.phone || null,
      website: item.website || null,
      email: item.email || null,
      tags: Array.from(new Set(categories)).slice(0, 8),
      sourceUrl: item.url || undefined,
      openStatusCategory: item.opening_status || null,
      openStatusText: item.opening_status || null,
      menuUrl: null,
      reviews: undefined,
      categories: Array.from(new Set(categories)),
      gallery: undefined,
      highlights: undefined,
      notes: undefined,
      originQueries: item.__originQuery ? [item.__originQuery] : [],
      distanceKm: distanceKm ?? undefined,
    };

    const existing = map.get(key);
    if (!existing || normalized.rating > existing.rating) {
      map.set(key, normalized);
    }
  }

  return Array.from(map.values());
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
  console.error("Ingestão openmap falhou:", err);
  process.exit(1);
});
