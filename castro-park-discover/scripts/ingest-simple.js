import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";
import Database from "better-sqlite3";

await loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN_FREE || process.env.APIFY_TOKEN;
const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);

// Queries simplificadas para teste
const SEARCH_QUERIES = [
  { query: "restaurantes em Goiânia, GO", category: "restaurants", maxResults: 50 },
  { query: "cafés em Goiânia, GO", category: "cafes", maxResults: 30 },
  { query: "bares em Goiânia, GO", category: "nightlife", maxResults: 30 },
  { query: "parques em Goiânia, GO", category: "nature", maxResults: 20 },
  { query: "shoppings em Goiânia, GO", category: "shopping", maxResults: 20 },
];

if (!APIFY_TOKEN) {
  console.error("❌ APIFY_TOKEN_FREE não encontrado no .env");
  process.exit(1);
}

// Actor gratuito e confiável do Google Maps
const ACTOR_ID = "compass/crawler-google-places";
const dbPath = path.resolve("data", "places.db");
const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");

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
      description TEXT,
      image TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      distance_km REAL,
      phone TEXT,
      website TEXT,
      tags TEXT,
      source_url TEXT,
      gallery TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_category ON places(category);
    CREATE INDEX IF NOT EXISTS idx_rating ON places(rating);
  `);
  return db;
}

async function main() {
  console.log("🚀 Iniciando coleta SIMPLIFICADA de Goiânia...\n");
  console.log(`📍 Total de buscas: ${SEARCH_QUERIES.length}\n`);

  const db = initDatabase();
  const client = new ApifyClient({ token: APIFY_TOKEN });

  let totalCollected = 0;
  let totalNew = 0;
  let queryIndex = 0;

  for (const searchQuery of SEARCH_QUERIES) {
    queryIndex++;
    console.log(`\n[${queryIndex}/${SEARCH_QUERIES.length}] 📍 "${searchQuery.query}"`);
    console.log(`   Categoria: ${searchQuery.category} | Máx: ${searchQuery.maxResults}`);

    try {
      const input = {
        searchStringsArray: [searchQuery.query],
        maxCrawledPlacesPerSearch: searchQuery.maxResults,
        language: "pt-BR",
        scrapeReviewsPersonalData: false,
        scrapeDirections: false,
        skipClosedPlaces: false,
      };

      console.log("   ⏳ Aguardando coleta...");

      const run = await client.actor(ACTOR_ID).call(input, {
        waitSecs: 120, // Aguarda até 2 minutos
      });

      const datasetId = run.defaultDatasetId;
      if (!datasetId) {
        console.warn(`  ⚠️  Sem dataset`);
        continue;
      }

      const items = await fetchAllDatasetItems(client, datasetId);
      console.log(`  ✅ ${items.length} lugares encontrados`);

      let queryNew = 0;

      for (const item of items) {
        if (!item.title && !item.name) continue;

        const place = normalizePlace(item, searchQuery.query, searchQuery.category);
        const result = savePlaceToDb(db, place);

        if (result === 'new') {
          queryNew++;
          totalNew++;
        }
        totalCollected++;
      }

      console.log(`  📊 Novos: ${queryNew}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`  ❌ Erro:`, err.message);
    }
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO FINAL`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total: ${totalCollected}`);
  console.log(`   Novos: ${totalNew}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await exportToJson(db);
  db.close();
  console.log("✅ Concluído!\n");
}

function normalizePlace(item, originQuery, category) {
  const placeId = item.placeId || item.url || item.title || `place-${Date.now()}`;
  const safeId = encodeURIComponent(placeId);

  const lat = Number(item.location?.lat || item.latitude);
  const lng = Number(item.location?.lng || item.longitude);
  const distanceKm = Number.isFinite(lat) && Number.isFinite(lng)
    ? computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG)
    : null;

  const rating = Number(item.totalScore || item.rating || 0);
  const reviewCount = Number(item.reviewsCount || item.reviews || 0);

  const gallery = [];
  if (item.imageUrls && Array.isArray(item.imageUrls)) {
    gallery.push(...item.imageUrls.slice(0, 5));
  }

  const tags = [];
  if (item.categoryName) tags.push(item.categoryName);
  if (item.categories && Array.isArray(item.categories)) {
    tags.push(...item.categories);
  }

  return {
    id: safeId,
    sourceId: placeId,
    name: item.title || item.name || "Sem nome",
    category: category || "attractions",
    rating,
    reviewCount,
    priceLevel: 0,
    description: item.description || item.about || "",
    image: item.imageUrl || (gallery.length > 0 ? gallery[0] : null),
    address: item.address || item.street || "",
    latitude: lat || null,
    longitude: lng || null,
    distanceKm,
    phone: item.phone || item.phoneNumber || null,
    website: item.website || item.url || null,
    tags: JSON.stringify(tags.slice(0, 10)),
    sourceUrl: item.url || `https://maps.google.com/?q=place_id:${placeId}`,
    gallery: JSON.stringify(gallery),
  };
}

function savePlaceToDb(db, place) {
  const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(place.id);

  if (!existing) {
    db.prepare(`
      INSERT INTO places (
        id, source_id, name, category, rating, review_count, price_level,
        description, image, address, latitude, longitude, distance_km,
        phone, website, tags, source_url, gallery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      place.id, place.sourceId, place.name, place.category, place.rating,
      place.reviewCount, place.priceLevel, place.description, place.image,
      place.address, place.latitude, place.longitude, place.distanceKm,
      place.phone, place.website, place.tags, place.sourceUrl, place.gallery
    );
    return 'new';
  }
  return 'existing';
}

async function exportToJson(db) {
  console.log("\n📤 Exportando para JSON...");

  const places = db.prepare(`
    SELECT * FROM places
    WHERE latitude IS NOT NULL
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
    description: p.description,
    image: p.image,
    address: p.address,
    latitude: p.latitude,
    longitude: p.longitude,
    distanceKm: p.distance_km,
    phone: p.phone,
    website: p.website,
    tags: p.tags ? JSON.parse(p.tags) : [],
    sourceUrl: p.source_url,
    gallery: p.gallery ? JSON.parse(p.gallery) : [],
  }));

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        location: { query: "Goiânia, GO" },
        totalPlaces: formatted.length,
        source: "Google Maps",
        places: formatted,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`  ✅ ${formatted.length} lugares exportados`);

  const stats = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(rating) as avg_rating
    FROM places
    GROUP BY category
  `).all();

  console.log(`\n📊 Por categoria:`);
  stats.forEach(s => {
    console.log(`   ${s.category}: ${s.count} (⭐ ${s.avg_rating.toFixed(1)})`);
  });
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

async function loadEnv() {
  const envPath = path.resolve(".env");
  try {
    const content = await fs.readFile(envPath, "utf8");
    content.split(/\r?\n/).filter((line) => line && !line.startsWith("#")).forEach((line) => {
        const [key, ...rest] = line.split("=");
        const value = rest.join("=").trim();
        if (!process.env[key]) process.env[key] = value;
      });
  } catch {}
}

main().catch((err) => {
  console.error("\n❌ Falhou:", err);
  process.exit(1);
});
