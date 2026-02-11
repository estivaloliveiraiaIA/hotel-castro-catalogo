import fs from "node:fs/promises";
import path from "path";
import { ApifyClient } from "apify-client";
import Database from "better-sqlite3";

await loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN_FREE || process.env.APIFY_TOKEN;
const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);

const SEARCH_QUERIES = [
  { query: "restaurantes em Goiânia, GO", category: "restaurants", maxResults: 60 },
  { query: "cafés em Goiânia, GO", category: "cafes", maxResults: 40 },
  { query: "bares em Goiânia, GO", category: "nightlife", maxResults: 40 },
  { query: "parques em Goiânia, GO", category: "nature", maxResults: 25 },
  { query: "shoppings em Goiânia, GO", category: "shopping", maxResults: 25 },
  { query: "museus em Goiânia, GO", category: "culture", maxResults: 20 },
];

if (!APIFY_TOKEN) {
  console.error("❌ APIFY_TOKEN não encontrado");
  process.exit(1);
}

// Actor PREMIUM com TODOS os dados
const ACTOR_ID = "compass/crawler-google-places";
const dbPath = path.resolve("data", "places.db");
const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");

function initDatabase() {
  const db = new Database(dbPath);

  // Criar tabela se não existir
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
      tags TEXT,
      source_url TEXT,
      gallery TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_category ON places(category);
    CREATE INDEX IF NOT EXISTS idx_rating ON places(rating);
  `);

  // Adicionar novas colunas se não existirem
  try {
    db.exec(`ALTER TABLE places ADD COLUMN hours TEXT;`);
  } catch (e) {
    // Coluna já existe
  }

  try {
    db.exec(`ALTER TABLE places ADD COLUMN open_status TEXT;`);
  } catch (e) {
    // Coluna já existe
  }

  try {
    db.exec(`ALTER TABLE places ADD COLUMN menu_url TEXT;`);
  } catch (e) {
    // Coluna já existe
  }

  return db;
}

async function main() {
  console.log("🚀 Coleta COMPLETA de Goiânia com TODOS os dados\n");
  console.log(`📍 Total: ${SEARCH_QUERIES.length} buscas\n`);

  const db = initDatabase();
  const client = new ApifyClient({ token: APIFY_TOKEN });

  let totalCollected = 0;
  let totalNew = 0;
  let queryIndex = 0;

  for (const searchQuery of SEARCH_QUERIES) {
    queryIndex++;
    console.log(`\n[${queryIndex}/${SEARCH_QUERIES.length}] 📍 "${searchQuery.query}"`);

    try {
      const input = {
        searchStringsArray: [searchQuery.query],
        maxCrawledPlacesPerSearch: searchQuery.maxResults,
        language: "pt-BR",
        scrapeReviewsPersonalData: false,
        scrapeDirections: false,
        scrapeImages: true, // ✅ FOTOS
        maxImages: 5, // ✅ ATÉ 5 FOTOS
        scrapeOpeningHours: true, // ✅ HORÁRIOS
        scrapePeopleAlsoSearch: false,
        exportPlaceUrls: false,
        skipClosedPlaces: false,
      };

      console.log("   ⏳ Coletando dados completos...");

      const run = await client.actor(ACTOR_ID).call(input, {
        waitSecs: 180, // Aguarda até 3min
      });

      const datasetId = run.defaultDatasetId;
      if (!datasetId) {
        console.warn(`  ⚠️  Sem dataset`);
        continue;
      }

      const items = await fetchAllDatasetItems(client, datasetId);
      console.log(`  ✅ ${items.length} lugares`);

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

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO FINAL`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total: ${totalCollected}`);
  console.log(`   Novos: ${totalNew}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

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
  const reviewCount = Number(item.reviewsCount || item.reviews || item.totalScore || 0);

  // ✅ GALERIA DE FOTOS (até 5)
  const gallery = [];

  // Adicionar imageUrls se existir
  if (item.imageUrls && Array.isArray(item.imageUrls)) {
    gallery.push(...item.imageUrls.slice(0, 5));
  }

  // Adicionar images array se existir
  if (item.images && Array.isArray(item.images)) {
    item.images.slice(0, 5).forEach(img => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !gallery.includes(url)) gallery.push(url);
    });
  }

  // Se a galeria ainda está vazia mas temos imageUrl, adicionar como primeira foto
  if (gallery.length === 0 && item.imageUrl) {
    gallery.push(item.imageUrl);
  }

  // ✅ TAGS SEM DUPLICATAS
  const tagsSet = new Set();
  if (item.categoryName) tagsSet.add(item.categoryName);
  if (item.categories && Array.isArray(item.categories)) {
    item.categories.forEach(cat => {
      const catName = typeof cat === 'string' ? cat : cat?.name;
      if (catName) tagsSet.add(catName);
    });
  }
  if (item.type) tagsSet.add(item.type);
  const tags = Array.from(tagsSet).slice(0, 5);

  // ✅ NÍVEL DE PREÇO
  let priceLevel = 0;
  if (item.priceLevel) {
    const priceStr = String(item.priceLevel);
    if (priceStr.includes('EXPENSIVE')) priceLevel = 4;
    else if (priceStr.includes('MODERATE')) priceLevel = 2;
    else if (priceStr.includes('INEXPENSIVE')) priceLevel = 1;
    else priceLevel = (priceStr.match(/\$/g) || []).length;
  }

  // ✅ DESCRIÇÃO (usa categories como fallback)
  let description = item.description || item.about || "";
  if (!description && tags.length > 0) {
    description = `${tags.slice(0, 2).join(", ")} em Goiânia`;
  }

  // ✅ HORÁRIO DE FUNCIONAMENTO
  const hours = item.openingHours || item.hours || [];

  // ✅ STATUS ABERTO/FECHADO
  const openStatus = item.openNow !== undefined
    ? (item.openNow ? "Aberto agora" : "Fechado agora")
    : (item.openingHours ? "Ver horários" : null);

  return {
    id: safeId,
    sourceId: placeId,
    name: item.title || item.name || "Sem nome",
    category: category || "attractions",
    rating,
    reviewCount,
    priceLevel,
    priceText: item.priceLevel || null,
    description,
    image: item.imageUrl || gallery[0] || null,
    address: item.address || item.street || "",
    latitude: lat || null,
    longitude: lng || null,
    distanceKm,
    phone: item.phone || item.phoneNumber || null,
    website: item.website || item.url || null,
    tags: JSON.stringify(tags),
    sourceUrl: item.url || `https://maps.google.com/?q=place_id:${placeId}`,
    gallery: JSON.stringify(gallery),
    hours: JSON.stringify(hours),
    openStatus,
    menuUrl: item.menu || null,
  };
}

function savePlaceToDb(db, place) {
  const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(place.id);

  if (!existing) {
    db.prepare(`
      INSERT INTO places (
        id, source_id, name, category, rating, review_count, price_level, price_text,
        description, image, address, latitude, longitude, distance_km,
        phone, website, tags, source_url, gallery, hours, open_status, menu_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      place.id, place.sourceId, place.name, place.category, place.rating,
      place.reviewCount, place.priceLevel, place.priceText, place.description, place.image,
      place.address, place.latitude, place.longitude, place.distanceKm,
      place.phone, place.website, place.tags, place.sourceUrl, place.gallery,
      place.hours, place.openStatus, place.menuUrl
    );
    return 'new';
  }
  return 'existing';
}

async function exportToJson(db) {
  console.log("\n📤 Exportando...");

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
    priceText: p.price_text,
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
    hours: p.hours ? JSON.parse(p.hours) : [],
    openStatusText: p.open_status,
    menuUrl: p.menu_url,
  }));

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        location: { query: "Goiânia, GO" },
        totalPlaces: formatted.length,
        source: "Google Maps Completo",
        places: formatted,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`  ✅ ${formatted.length} lugares exportados`);

  const stats = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(rating) as avg_rating,
           AVG(CASE WHEN gallery != '[]' THEN 1 ELSE 0 END) * 100 as pct_with_gallery
    FROM places
    GROUP BY category
  `).all();

  console.log(`\n📊 Estatísticas:`);
  stats.forEach(s => {
    console.log(`   ${s.category}: ${s.count} lugares | ⭐ ${s.avg_rating.toFixed(1)} | 📸 ${s.pct_with_gallery.toFixed(0)}% com galeria`);
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
