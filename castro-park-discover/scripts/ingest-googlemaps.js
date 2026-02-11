import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";
import Database from "better-sqlite3";

await loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN_FREE || process.env.APIFY_TOKEN;
const LOCATION = "Goiânia, Goiás, Brasil";
const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);
const MAX_RESULTS_PER_QUERY = 500;

// Categorias e termos de busca para Goiânia
const SEARCH_QUERIES = [
  // Restaurantes
  { query: "restaurantes em Goiânia", category: "restaurants", maxResults: 500 },
  { query: "churrascarias em Goiânia", category: "restaurants", maxResults: 200 },
  { query: "pizzarias em Goiânia", category: "restaurants", maxResults: 150 },
  { query: "comida japonesa Goiânia", category: "restaurants", maxResults: 100 },
  { query: "comida italiana Goiânia", category: "restaurants", maxResults: 100 },

  // Cafés e Padarias
  { query: "cafeterias em Goiânia", category: "cafes", maxResults: 150 },
  { query: "cafés em Goiânia", category: "cafes", maxResults: 150 },
  { query: "padarias em Goiânia", category: "cafes", maxResults: 100 },

  // Bares e Vida Noturna
  { query: "bares em Goiânia", category: "nightlife", maxResults: 200 },
  { query: "pubs em Goiânia", category: "nightlife", maxResults: 100 },
  { query: "baladas em Goiânia", category: "nightlife", maxResults: 100 },
  { query: "cervejarias Goiânia", category: "nightlife", maxResults: 50 },

  // Parques e Natureza
  { query: "parques em Goiânia", category: "nature", maxResults: 100 },
  { query: "praças em Goiânia", category: "nature", maxResults: 100 },
  { query: "áreas verdes Goiânia", category: "nature", maxResults: 50 },

  // Cultura
  { query: "museus em Goiânia", category: "culture", maxResults: 50 },
  { query: "teatros em Goiânia", category: "culture", maxResults: 30 },
  { query: "centros culturais Goiânia", category: "culture", maxResults: 30 },
  { query: "igrejas históricas Goiânia", category: "culture", maxResults: 30 },

  // Shopping
  { query: "shoppings em Goiânia", category: "shopping", maxResults: 50 },
  { query: "lojas em Goiânia", category: "shopping", maxResults: 150 },

  // Atrações
  { query: "pontos turísticos Goiânia", category: "attractions", maxResults: 100 },
  { query: "o que fazer em Goiânia", category: "attractions", maxResults: 200 },
  { query: "passeios em Goiânia", category: "attractions", maxResults: 100 },

  // Bairros específicos
  { query: "restaurantes Setor Bueno Goiânia", category: "restaurants", maxResults: 100 },
  { query: "restaurantes Setor Marista Goiânia", category: "restaurants", maxResults: 100 },
  { query: "restaurantes Setor Oeste Goiânia", category: "restaurants", maxResults: 100 },
  { query: "restaurantes Centro Goiânia", category: "restaurants", maxResults: 80 },
  { query: "restaurantes Jardim Goiás", category: "restaurants", maxResults: 80 },
];

if (!APIFY_TOKEN) {
  console.error("❌ APIFY_TOKEN_FREE não encontrado no .env");
  process.exit(1);
}

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
  console.log("🚀 Iniciando coleta de lugares de Goiânia via Google Maps...\n");
  console.log(`📍 Total de buscas: ${SEARCH_QUERIES.length}\n`);

  const db = initDatabase();
  const client = new ApifyClient({ token: APIFY_TOKEN });

  let totalCollected = 0;
  let totalNew = 0;
  let totalUpdated = 0;
  let queryIndex = 0;

  for (const searchQuery of SEARCH_QUERIES) {
    queryIndex++;
    console.log(`\n[${queryIndex}/${SEARCH_QUERIES.length}] 📍 Buscando: "${searchQuery.query}"`);
    console.log(`   Categoria: ${searchQuery.category} | Máx: ${searchQuery.maxResults} resultados`);

    try {
      const input = {
        searchStringsArray: [searchQuery.query],
        locationQuery: LOCATION,
        maxCrawledPlacesPerSearch: searchQuery.maxResults,
        language: "pt-BR",
        skipClosedPlaces: false,
        includeWebResults: true,
        deeperCityScrape: false,
        scrapeReviewerInsights: false,
        scrapeDirections: false,
        reviewsSort: "newest",
        allPlacesNoSearchAction: false,
      };

      const run = await client.actor(ACTOR_ID).call(input, {
        waitSecs: 300,
        memory: 2048
      });

      const datasetId = run.defaultDatasetId;

      if (!datasetId) {
        console.warn(`  ⚠️  Dataset não retornado`);
        continue;
      }

      const items = await fetchAllDatasetItems(client, datasetId);
      console.log(`  ✅ ${items.length} lugares encontrados`);

      let queryNew = 0;
      let queryUpdated = 0;

      for (const item of items) {
        if (!item.title) continue;

        const place = normalizePlace(item, searchQuery.query, searchQuery.category);
        const result = savePlaceToDb(db, place);

        if (result === 'new') {
          queryNew++;
          totalNew++;
        }
        if (result === 'updated') {
          queryUpdated++;
          totalUpdated++;
        }
        totalCollected++;
      }

      console.log(`  📊 Novos: ${queryNew} | Atualizados: ${queryUpdated}`);

      // Aguardar um pouco entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      console.error(`  ❌ Erro:`, err.message);
    }
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO FINAL DA COLETA`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total processado: ${totalCollected}`);
  console.log(`   Novos lugares: ${totalNew}`);
  console.log(`   Atualizados: ${totalUpdated}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await exportToJson(db);

  db.close();
  console.log("✅ Coleta concluída com sucesso!\n");
}

function normalizePlace(item, originQuery, category) {
  const placeId = item.placeId || item.url || item.title || `place-${Date.now()}`;
  const safeId = encodeURIComponent(placeId);

  const lat = Number(item.location?.lat || item.latitude);
  const lng = Number(item.location?.lng || item.longitude);
  const distanceKm = Number.isFinite(lat) && Number.isFinite(lng)
    ? computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG)
    : null;

  const priceLevel = parsePriceLevel(item.priceLevel);
  const rating = Number(item.totalScore || item.rating || 0);
  const reviewCount = Number(item.reviewsCount || item.reviews || 0);

  const gallery = [];
  if (item.imageUrls && Array.isArray(item.imageUrls)) {
    gallery.push(...item.imageUrls.slice(0, 5));
  }
  if (item.images && Array.isArray(item.images)) {
    gallery.push(...item.images.map(img => img.url || img).slice(0, 5));
  }

  const tags = [];
  if (item.categoryName) tags.push(item.categoryName);
  if (item.categories && Array.isArray(item.categories)) {
    tags.push(...item.categories);
  }
  if (item.type) tags.push(item.type);

  return {
    id: safeId,
    sourceId: placeId,
    name: item.title || item.name || "Lugar sem nome",
    category: category || "attractions",
    rating,
    reviewCount,
    priceLevel,
    priceText: item.priceLevel || null,
    description: item.description || item.about || "Descrição não disponível",
    image: item.imageUrl || (gallery.length > 0 ? gallery[0] : null),
    address: item.address || item.street || "Endereço não informado",
    latitude: lat || null,
    longitude: lng || null,
    distanceKm,
    phone: item.phone || item.phoneNumber || null,
    website: item.website || item.url || null,
    email: null,
    tags: JSON.stringify(tags.slice(0, 10)),
    sourceUrl: item.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    openStatus: item.openingHours || item.isOpen || null,
    menuUrl: item.menu || null,
    gallery: JSON.stringify(gallery),
    highlights: JSON.stringify([]),
    originQueries: JSON.stringify([originQuery]),
  };
}

function savePlaceToDb(db, place) {
  const existing = db.prepare('SELECT * FROM places WHERE id = ? OR source_id = ?').get(place.id, place.sourceId);

  if (existing) {
    if (place.rating >= (existing.rating || 0) || place.reviewCount > (existing.review_count || 0)) {
      db.prepare(`
        UPDATE places SET
          name = ?, category = ?, rating = ?, review_count = ?,
          price_level = ?, price_text = ?, description = ?, image = ?,
          address = ?, latitude = ?, longitude = ?, distance_km = ?,
          phone = ?, website = ?, email = ?, tags = ?, source_url = ?,
          open_status = ?, menu_url = ?, gallery = ?, highlights = ?,
          origin_queries = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        place.name, place.category, place.rating, place.reviewCount,
        place.priceLevel, place.priceText, place.description, place.image,
        place.address, place.latitude, place.longitude, place.distanceKm,
        place.phone, place.website, place.email, place.tags, place.sourceUrl,
        place.openStatus, place.menuUrl, place.gallery, place.highlights,
        place.originQueries, place.id
      );
      return 'updated';
    }
    return 'existing';
  } else {
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
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
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
        location: { query: LOCATION },
        totalPlaces: formatted.length,
        source: "Google Maps via Apify",
        places: formatted,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`  ✅ ${formatted.length} lugares exportados para ${outputFile}`);

  // Estatísticas por categoria
  const stats = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(rating) as avg_rating
    FROM places
    GROUP BY category
    ORDER BY count DESC
  `).all();

  console.log(`\n📊 Estatísticas por categoria:`);
  stats.forEach(s => {
    console.log(`   ${s.category}: ${s.count} lugares (⭐ ${s.avg_rating.toFixed(1)})`);
  });
}

function parsePriceLevel(level) {
  if (!level) return 0;
  const str = String(level).toUpperCase();
  if (str.includes('EXPENSIVE')) return 4;
  if (str.includes('MODERATE')) return 2;
  if (str.includes('INEXPENSIVE')) return 1;
  if (str.includes('FREE')) return 0;
  const dollars = str.match(/\$/g);
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
