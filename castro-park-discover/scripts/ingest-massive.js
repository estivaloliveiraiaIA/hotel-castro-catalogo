import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";
import Database from "better-sqlite3";

await loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_TOKEN_FREE = process.env.APIFY_TOKEN_FREE;
const LOCATION_QUERY = process.env.LOCATION_QUERY || "Goiania, Goias, Brasil";
const MAX_ITEMS = Number(process.env.MAX_RESULTS || 500);
const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);

// Termos de busca específicos para Goiânia
const SEARCH_TERMS = process.env.SEARCH_TERMS
  ? process.env.SEARCH_TERMS.split("|").map((t) => t.trim()).filter(Boolean)
  : [
      "Goiania restaurantes",
      "Goiania atrações turísticas",
      "Goiania cafés",
      "Goiania bares",
      "Goiania vida noturna",
      "Goiania parques",
      "Goiania museus",
      "Goiania shopping",
      "Goiania cultura",
      "Goiania pontos turísticos",
      "Goiania o que fazer",
      "Goiania passeios",
      "Setor Bueno Goiania",
      "Setor Marista Goiania",
      "Centro Goiania",
      "Setor Oeste Goiania",
      "Jardim Goiás",
    ];

if (!APIFY_TOKEN) {
  console.error("❌ APIFY_TOKEN não encontrado no .env");
  console.error("📝 Crie uma conta em https://apify.com/ e obtenha seu token");
  process.exit(1);
}

const ACTOR_ID = "maxcopell/tripadvisor";
const dbPath = path.resolve("data", "places.db");
const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");

// Inicializar banco de dados SQLite
function initDatabase() {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      name TEXT NOT NULL,
      category TEXT,
      rating REAL,
      review_count INTEGER,
      price_level INTEGER,
      price_text TEXT,
      description TEXT,
      image TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      distance_km REAL,
      phone TEXT,
      website TEXT,
      email TEXT,
      tags TEXT,
      source_url TEXT,
      open_status TEXT,
      menu_url TEXT,
      gallery TEXT,
      highlights TEXT,
      origin_queries TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_category ON places(category);
    CREATE INDEX IF NOT EXISTS idx_rating ON places(rating);
    CREATE INDEX IF NOT EXISTS idx_name ON places(name);
    CREATE INDEX IF NOT EXISTS idx_distance ON places(distance_km);
  `);

  return db;
}

async function main() {
  console.log("🚀 Iniciando coleta massiva de lugares de Goiânia...\n");

  const db = initDatabase();
  const client = new ApifyClient({ token: APIFY_TOKEN });

  let totalCollected = 0;
  let totalNew = 0;
  let totalUpdated = 0;

  for (const term of SEARCH_TERMS) {
    console.log(`\n📍 Buscando: "${term}" (máximo ${MAX_ITEMS} resultados)...`);

    try {
      const input = {
        query: term,
        maxItemsPerQuery: MAX_ITEMS,
        includeTags: true,
        includeNearbyResults: true, // IMPORTANTE: pega resultados próximos
        includeAttractions: true,
        includeRestaurants: true,
        includeHotels: false,
        includeVacationRentals: false,
        includePriceOffers: false,
        includeAiReviewsSummary: false,
        language: "pt",
        currency: "BRL",
      };

      const run = await client.actor(ACTOR_ID).call(input);
      const datasetId = run.defaultDatasetId;

      if (!datasetId) {
        console.warn(`  ⚠️  Dataset não retornado para "${term}"`);
        continue;
      }

      const items = await fetchAllDatasetItems(client, datasetId);
      console.log(`  ✅ ${items.length} lugares encontrados`);

      // Processar e salvar no banco
      for (const item of items) {
        const place = normalizePlace(item, term);
        const result = savePlaceToDb(db, place);

        if (result === 'new') totalNew++;
        if (result === 'updated') totalUpdated++;
        totalCollected++;
      }

    } catch (err) {
      console.error(`  ❌ Erro ao processar "${term}":`, err.message);
    }
  }

  console.log(`\n\n📊 RESUMO DA COLETA:`);
  console.log(`   Total processado: ${totalCollected}`);
  console.log(`   Novos lugares: ${totalNew}`);
  console.log(`   Atualizados: ${totalUpdated}`);

  // Exportar do banco para JSON
  await exportToJson(db);

  db.close();
  console.log("\n✅ Coleta concluída!\n");
}

function normalizePlace(item, originQuery) {
  const sourceUrl = item.webUrl || item.url;
  const rawId = item.id || item.locationId || sourceUrl || item.name || `unknown-${Date.now()}`;
  const safeId = encodeId(rawId);

  const image = item.image || (Array.isArray(item.photos) && item.photos.length > 0 ? item.photos[0]?.url : null);
  const priceLevel = parsePriceLevel(item.priceLevel);
  const description = item.description || item.rankingString || "Descrição não disponível";
  const category = mapCategory(item, originQuery);
  const tags = buildTags(item, originQuery);
  const gallery = Array.isArray(item.photos) ? item.photos.map((p) => p?.url).filter(Boolean).slice(0, 8) : [];
  const highlights = item.reviewTags ? item.reviewTags.map((t) => t.text).slice(0, 5) : [];

  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  const distanceKm = Number.isFinite(lat) && Number.isFinite(lng)
    ? computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG)
    : null;

  return {
    id: safeId,
    sourceId: safeId,
    name: item.name || "Lugar sem nome",
    category,
    rating: Number(item.rating ?? 0) || 0,
    reviewCount: Number(item.numberOfReviews ?? 0) || 0,
    priceLevel,
    priceText: item.priceLevel || item.priceRange,
    description,
    image,
    address: item.address || item.locationString || "Endereço não informado",
    latitude: lat || null,
    longitude: lng || null,
    distanceKm,
    phone: item.phone || null,
    website: item.website || null,
    email: item.email || null,
    tags: JSON.stringify(tags),
    sourceUrl,
    openStatus: item.openNowText || null,
    menuUrl: item.menuWebUrl || null,
    gallery: JSON.stringify(gallery),
    highlights: JSON.stringify(highlights),
    originQueries: JSON.stringify([originQuery]),
  };
}

function savePlaceToDb(db, place) {
  const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(place.id);

  if (existing) {
    // Atualizar se o novo tem rating maior ou mais informações
    if (place.rating > (existing.rating || 0) || !existing.description || !existing.image) {
      db.prepare(`
        UPDATE places SET
          name = ?,
          category = ?,
          rating = ?,
          review_count = ?,
          price_level = ?,
          price_text = ?,
          description = ?,
          image = ?,
          address = ?,
          latitude = ?,
          longitude = ?,
          distance_km = ?,
          phone = ?,
          website = ?,
          email = ?,
          tags = ?,
          source_url = ?,
          open_status = ?,
          menu_url = ?,
          gallery = ?,
          highlights = ?,
          origin_queries = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        place.name, place.category, place.rating, place.reviewCount,
        place.priceLevel, place.priceText, place.description, place.image,
        place.address, place.latitude, place.longitude, place.distanceKm,
        place.phone, place.website, place.email, place.tags,
        place.sourceUrl, place.openStatus, place.menuUrl,
        place.gallery, place.highlights, place.originQueries,
        place.id
      );
      return 'updated';
    }
    return 'existing';
  } else {
    // Inserir novo
    db.prepare(`
      INSERT INTO places (
        id, source_id, name, category, rating, review_count,
        price_level, price_text, description, image, address,
        latitude, longitude, distance_km, phone, website, email,
        tags, source_url, open_status, menu_url, gallery, highlights, origin_queries
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      place.id, place.sourceId, place.name, place.category, place.rating, place.reviewCount,
      place.priceLevel, place.priceText, place.description, place.image, place.address,
      place.latitude, place.longitude, place.distanceKm, place.phone, place.website, place.email,
      place.tags, place.sourceUrl, place.openStatus, place.menuUrl, place.gallery,
      place.highlights, place.originQueries
    );
    return 'new';
  }
}

async function exportToJson(db) {
  console.log("\n📤 Exportando dados para JSON...");

  const places = db.prepare(`
    SELECT * FROM places
    ORDER BY rating DESC, review_count DESC
  `).all();

  const formatted = places.map(p => ({
    id: p.id,
    sourceId: p.source_id,
    name: p.name,
    category: p.category,
    rating: p.rating,
    reviewCount: p.review_count,
    priceLevel: p.price_level,
    priceText: p.price_text,
    description: p.description,
    image: p.image,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    distanceKm: p.distance_km,
    phone: p.phone,
    website: p.website,
    email: p.email,
    tags: p.tags ? JSON.parse(p.tags) : [],
    sourceUrl: p.source_url,
    openStatusText: p.open_status,
    menuUrl: p.menu_url,
    gallery: p.gallery ? JSON.parse(p.gallery) : [],
    highlights: p.highlights ? JSON.parse(p.highlights) : [],
    originQueries: p.origin_queries ? JSON.parse(p.origin_queries) : [],
  }));

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        location: { query: LOCATION_QUERY },
        totalPlaces: formatted.length,
        places: formatted,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`  ✅ ${formatted.length} lugares exportados para ${outputFile}`);
}

function mapCategory(item, originQuery) {
  const name = (item.name || "").toLowerCase();
  const type = (item.type || item.category || "").toLowerCase();
  const query = (originQuery || "").toLowerCase();

  // Priorizar query de origem
  if (query.includes("restaurante") || query.includes("restaurant")) return "restaurants";
  if (query.includes("café") || query.includes("cafes")) return "cafes";
  if (query.includes("bar") || query.includes("noturna") || query.includes("nightlife")) return "nightlife";
  if (query.includes("parque") || query.includes("nature")) return "nature";
  if (query.includes("museu") || query.includes("cultura") || query.includes("culture")) return "culture";
  if (query.includes("shopping") || query.includes("compras")) return "shopping";

  // Análise do tipo/nome
  if (type.includes("restaurant") || name.includes("restaurante")) return "restaurants";
  if (type.includes("hotel")) return "hotels";

  if (name.match(/shopping|mall|mercado|feira/)) return "shopping";
  if (name.match(/parque|bosque|praça|pátio|jardim/)) return "nature";
  if (name.match(/museu|teatro|catedral|igreja|centro cultural|monumento/)) return "culture";
  if (name.match(/bar|pub|brew|balada/)) return "nightlife";
  if (name.match(/café|cafeteria|padaria/)) return "cafes";

  return "attractions";
}

function buildTags(item, originQuery) {
  const tags = new Set();
  if (Array.isArray(item.subcategories)) item.subcategories.forEach((t) => t && tags.add(t));
  if (Array.isArray(item.cuisines)) item.cuisines.forEach((t) => t && tags.add(t));
  if (Array.isArray(item.features)) item.features.forEach((t) => t && tags.add(t));
  if (item.type) tags.add(item.type);
  if (originQuery) tags.add(originQuery);
  return Array.from(tags).slice(0, 10);
}

function parsePriceLevel(level) {
  if (!level) return 0;
  const dollars = String(level).match(/\$/g);
  if (dollars) return dollars.length;
  const numeric = Number(level);
  return Number.isFinite(numeric) ? numeric : 0;
}

function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
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

function encodeId(raw) {
  if (!raw) return `unknown-${Date.now()}`;
  return encodeURIComponent(String(raw));
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
    // .env opcional
  }
}

main().catch((err) => {
  console.error("\n❌ Ingestão falhou:", err);
  process.exit(1);
});
