import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.GOOGLE_PLACES_API_KEY;

const ROOT = path.resolve(".");
const PLACES_JSON_PATH = path.join(ROOT, "public", "data", "places.json");

const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    target: 500,
    sleepMs: 250,
    maxPerQuery: 60,
    photoMaxWidth: 1000,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--target") out.target = Number(args[++i] || "0") || 500;
    if (a === "--sleep") out.sleepMs = Number(args[++i] || "0") || 250;
    if (a === "--max-per-query") out.maxPerQuery = Number(args[++i] || "0") || 60;
    if (a === "--photo-width") out.photoMaxWidth = Number(args[++i] || "0") || 1000;
  }
  return out;
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

function moneyText(priceLevel) {
  if (!Number.isFinite(priceLevel) || priceLevel <= 0) return null;
  return "$".repeat(Math.min(4, Math.max(1, priceLevel)));
}

function normalizeTags(types = []) {
  const tags = new Set();
  const joined = types.join("|");

  if (joined.match(/restaurant|meal_takeaway|meal_delivery|food/)) tags.add("Restaurante");
  if (joined.match(/cafe/)) tags.add("Café");
  if (joined.match(/bar|night_club/)) tags.add("Bar");
  if (joined.match(/tourist_attraction/)) tags.add("Passeio");
  if (joined.match(/park/)) tags.add("Parque");
  if (joined.match(/museum/)) tags.add("Museu");
  if (joined.match(/shopping_mall/)) tags.add("Shopping");

  return Array.from(tags).slice(0, 8);
}

function mapCategoryFromTypes(types = []) {
  const joined = types.join("|");

  if (joined.match(/night_club|bar/)) return "nightlife";
  if (joined.match(/cafe/)) return "cafes";
  if (joined.match(/restaurant|meal_takeaway|meal_delivery|food/)) return "restaurants";

  if (joined.match(/shopping_mall/)) return "shopping";

  if (joined.match(/park/)) return "nature";
  if (joined.match(/museum|art_gallery|theater/)) return "culture";

  if (joined.match(/tourist_attraction/)) return "attractions";

  return undefined;
}

async function resolvePhotoUrl(photoReference, maxWidth = 1000) {
  if (!photoReference) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("key", KEY);

  const resp = await fetch(url.toString(), { redirect: "manual" });
  return resp.headers.get("location") || null;
}

async function textSearch(query, pagetoken) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("key", KEY);
  if (pagetoken) url.searchParams.set("pagetoken", pagetoken);

  const resp = await fetch(url.toString());
  return resp.json();
}

async function textSearchWithRetry(query, pagetoken) {
  let attempt = 0;
  let backoff = 1500;

  while (true) {
    attempt++;
    const json = await textSearch(query, pagetoken);
    const status = json?.status;

    // next_page_token pode precisar de tempo pra "ativar"
    if (status === "INVALID_REQUEST" && pagetoken) {
      if (attempt >= 5) return json;
      await sleep(backoff);
      backoff = Math.min(backoff + 800, 6000);
      continue;
    }

    if (status === "OVER_QUERY_LIMIT" || status === "UNKNOWN_ERROR") {
      if (attempt >= 6) return json;
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 15000);
      continue;
    }

    return json;
  }
}

const SEARCH_QUERIES = [
  // Restaurantes
  { query: "restaurantes Goiânia", hintCategory: "restaurants" },
  { query: "churrascaria Goiânia", hintCategory: "restaurants" },
  { query: "pizzaria Goiânia", hintCategory: "restaurants" },
  { query: "sushi Goiânia", hintCategory: "restaurants" },
  { query: "comida típica goiana Goiânia", hintCategory: "restaurants" },

  // Cafés
  { query: "cafeteria Goiânia", hintCategory: "cafes" },
  { query: "café especial Goiânia", hintCategory: "cafes" },
  { query: "padaria artesanal Goiânia", hintCategory: "cafes" },

  // Bares / noite
  { query: "bares Goiânia", hintCategory: "nightlife" },
  { query: "pub Goiânia", hintCategory: "nightlife" },
  { query: "cervejaria Goiânia", hintCategory: "nightlife" },

  // Natureza
  { query: "parque Goiânia", hintCategory: "nature" },
  { query: "praça Goiânia", hintCategory: "nature" },

  // Cultura
  { query: "museu Goiânia", hintCategory: "culture" },
  { query: "teatro Goiânia", hintCategory: "culture" },

  // Compras
  { query: "shopping Goiânia", hintCategory: "shopping" },

  // Atrações
  { query: "pontos turísticos Goiânia", hintCategory: "attractions" },
  { query: "o que fazer em Goiânia", hintCategory: "attractions" },
];

async function main() {
  if (!KEY) {
    console.error("❌ GOOGLE_PLACES_API_KEY não definido.");
    process.exit(1);
  }

  const { target, sleepMs, maxPerQuery, photoMaxWidth } = parseArgs();

  const raw = await fs.readFile(PLACES_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  const existing = new Set(places.map((p) => p.sourceId || p.id).filter(Boolean));

  console.log(`📦 Base atual: ${places.length} lugares`);
  console.log(`🎯 Meta: ${target} lugares (adicionar ~${Math.max(0, target - places.length)})`);

  const added = [];

  for (const q of SEARCH_QUERIES) {
    if (places.length + added.length >= target) break;

    let collectedForQuery = 0;
    let pageToken;

    for (let page = 0; page < 3; page++) {
      if (places.length + added.length >= target) break;
      if (collectedForQuery >= maxPerQuery) break;

      const json = await textSearchWithRetry(q.query, pageToken);
      const status = json?.status;

      if (status !== "OK" && status !== "ZERO_RESULTS") {
        console.warn(`⚠️  Query "${q.query}": ${status}${json?.error_message ? ` — ${json.error_message}` : ""}`);
        break;
      }

      const results = Array.isArray(json.results) ? json.results : [];
      for (const r of results) {
        if (places.length + added.length >= target) break;
        if (collectedForQuery >= maxPerQuery) break;

        const placeId = r.place_id;
        if (!placeId || existing.has(placeId)) continue;

        const types = Array.isArray(r.types) ? r.types : [];
        const mappedCategory = mapCategoryFromTypes(types) || q.hintCategory;

        const lat = r.geometry?.location?.lat;
        const lng = r.geometry?.location?.lng;
        const distanceKm = computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG);

        const photoRef = r.photos?.[0]?.photo_reference;
        const image = photoRef ? await resolvePhotoUrl(photoRef, photoMaxWidth) : null;

        const place = {
          id: placeId,
          sourceId: placeId,
          name: r.name || "Lugar sem nome",
          category: mappedCategory || "attractions",
          rating: Number(r.rating ?? 0) || 0,
          reviewCount: Number(r.user_ratings_total ?? 0) || 0,
          priceLevel: Number(r.price_level ?? 0) || 0,
          priceText: moneyText(Number(r.price_level ?? 0)) || null,
          description: "",
          image,
          address: r.formatted_address || r.vicinity || "Endereço não informado",
          latitude: Number.isFinite(lat) ? lat : undefined,
          longitude: Number.isFinite(lng) ? lng : undefined,
          distanceKm,
          phone: null,
          website: null,
          hours: [],
          tags: normalizeTags(types),
          sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name || "Goiânia")}&query_place_id=${placeId}`,
          gallery: image ? [image] : [],
          openStatusText: null,
          menuUrl: null,
          _discoveredAt: new Date().toISOString(),
        };

        added.push(place);
        existing.add(placeId);
        collectedForQuery++;

        // pacing (photo endpoint)
        await sleep(sleepMs);
      }

      pageToken = json.next_page_token;
      if (!pageToken) break;

      // required wait for next_page_token
      await sleep(2200);
    }

    console.log(`🔎 "${q.query}": +${collectedForQuery}`);
  }

  doc.updatedAt = new Date().toISOString();
  doc.source = doc.source || "Google Places";
  doc.places = [...places, ...added];

  await fs.writeFile(PLACES_JSON_PATH, JSON.stringify(doc, null, 2), "utf8");

  console.log(`\n✅ Concluído. Adicionados=${added.length} Total=${doc.places.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
