import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.APIFY_TOKEN;

const ROOT = path.resolve(".");
const PLACES_JSON_PATH = path.join(ROOT, "public", "data", "places.json");

const ACTOR_ID = "compass~google-maps-extractor";

const HOTEL_LAT = Number(process.env.HOTEL_LAT || -16.6799);
const HOTEL_LNG = Number(process.env.HOTEL_LNG || -49.2540);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    locationQuery: process.env.APIFY_LOCATION_QUERY || "Goiânia, GO, Brasil",
    language: process.env.APIFY_LANGUAGE || "pt-BR",
    maxPerSearch: Number(process.env.APIFY_MAX_PER_SEARCH || 120),
    minStars: process.env.APIFY_MIN_STARS || "",
    categories: (process.env.APIFY_CATEGORIES || "restaurant,bar,cafe,park,museum,shopping mall")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),

    addNew: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--location") out.locationQuery = String(args[++i] || out.locationQuery);
    if (a === "--language") out.language = String(args[++i] || out.language);
    if (a === "--max") out.maxPerSearch = Number(args[++i] || "0") || out.maxPerSearch;
    if (a === "--min-stars") out.minStars = String(args[++i] ?? out.minStars);
    if (a === "--categories") {
      out.categories = String(args[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (a === "--add-new") out.addNew = true;
  }

  return out;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
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

const DAY_PT = {
  Monday: "Segunda",
  Tuesday: "Terça",
  Wednesday: "Quarta",
  Thursday: "Quinta",
  Friday: "Sexta",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

function normalizeHours(openingHours) {
  if (!Array.isArray(openingHours)) return [];
  // Apify returns [{day:"Thursday", hours:"Open 24 hours"}, ...]
  const out = [];
  for (const row of openingHours) {
    const day = String(row?.day || "");
    const hours = String(row?.hours || "");
    if (!day || !hours) continue;
    const dayPt = DAY_PT[day] || day;
    out.push(`${dayPt}: ${hours}`);
  }
  return out;
}

function mapCategory(categoryName, categories) {
  const joined = [categoryName || "", ...(categories || [])].join("|").toLowerCase();

  if (joined.match(/bar|pub|night/)) return "nightlife";
  if (joined.match(/cafe|caf[eé]|coffee|padaria/)) return "cafes";
  if (joined.match(/restaurant|restaurante|churrasc|pizz|sushi|food/)) return "restaurants";
  if (joined.match(/shopping|mall|store|loja/)) return "shopping";
  if (joined.match(/park|parque|pra[çc]a|nature/)) return "nature";
  if (joined.match(/museum|museu|theater|teatro|art|galeria|cultura/)) return "culture";

  return "attractions";
}

function normalizeTags(categoryName, categories) {
  const tags = new Set();
  const src = [categoryName || "", ...(categories || [])].join("|").toLowerCase();

  if (src.match(/restaurant|restaurante|food/)) tags.add("Restaurante");
  if (src.match(/cafe|caf[eé]|coffee/)) tags.add("Café");
  if (src.match(/bar|pub|night/)) tags.add("Bar");
  if (src.match(/park|parque|pra[çc]a|nature/)) tags.add("Parque");
  if (src.match(/museum|museu/)) tags.add("Museu");
  if (src.match(/shopping|mall/)) tags.add("Shopping");

  return Array.from(tags).slice(0, 8);
}

async function runApifyExtractor(input) {
  if (!TOKEN) {
    console.error("❌ APIFY_TOKEN não definido.");
    process.exit(1);
  }

  const url = new URL(`https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`);
  url.searchParams.set("token", TOKEN);
  url.searchParams.set("clean", "true");

  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Apify run failed: ${resp.status} ${resp.statusText} ${txt}`);
  }

  const json = await resp.json();
  if (!Array.isArray(json)) {
    throw new Error(`Unexpected Apify response (expected array). Got: ${typeof json}`);
  }

  return json;
}

async function main() {
  const { locationQuery, language, maxPerSearch, minStars, categories, addNew } = parseArgs();

  const raw = await fs.readFile(PLACES_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  const byId = new Map();
  for (const p of places) {
    const pid = p.sourceId || p.id;
    if (pid) byId.set(String(pid), p);
  }

  console.log(`📦 places.json: ${places.length} lugares`);
  console.log(`🔎 Apify Extractor: location="${locationQuery}" language=${language} maxPerSearch=${maxPerSearch} minStars="${minStars}"`);
  console.log(`🏷️  categories: ${categories.join(", ")}`);

  const input = {
    categoryFilterWords: categories,
    deeperCityScrape: false,
    language,
    locationQuery,
    maxCrawledPlacesPerSearch: maxPerSearch,
    skipClosedPlaces: true,
    searchMatching: "all",
    placeMinimumStars: minStars,
  };

  const items = await runApifyExtractor(input);

  let updated = 0;
  let added = 0;
  let matched = 0;

  for (const it of items) {
    const placeId = String(it?.placeId || "");
    if (!placeId) continue;

    const existing = byId.get(placeId);
    if (existing) matched++;

    const lat = Number(it?.location?.lat);
    const lng = Number(it?.location?.lng);

    const patch = {
      id: placeId,
      sourceId: placeId,
      name: it?.title || existing?.name || "Lugar sem nome",
      address: it?.address || existing?.address || "Endereço não informado",
      latitude: Number.isFinite(lat) ? lat : existing?.latitude,
      longitude: Number.isFinite(lng) ? lng : existing?.longitude,
      distanceKm:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? computeDistanceKm(lat, lng, HOTEL_LAT, HOTEL_LNG)
          : existing?.distanceKm,

      rating: Number(it?.totalScore ?? existing?.rating ?? 0) || existing?.rating || 0,
      reviewCount: Number(it?.reviewsCount ?? existing?.reviewCount ?? 0) || existing?.reviewCount || 0,

      phone: it?.phoneUnformatted || it?.phone || existing?.phone || null,
      website: it?.website || existing?.website || null,
      sourceUrl: it?.url || existing?.sourceUrl || null,

      hours: normalizeHours(it?.openingHours) || existing?.hours || [],

      category: existing?.category || mapCategory(it?.categoryName, it?.categories),
      tags: Array.isArray(existing?.tags) && existing.tags.length ? existing.tags : normalizeTags(it?.categoryName, it?.categories),

      _apifyEnrichedAt: new Date().toISOString(),
    };

    if (existing) {
      const before = JSON.stringify({
        phone: existing.phone,
        website: existing.website,
        hours: existing.hours,
        rating: existing.rating,
        reviewCount: existing.reviewCount,
      });

      // Merge conservatively: fill missing, update rating/reviews, coords/address if missing.
      existing.name = patch.name;
      if (!existing.address) existing.address = patch.address;
      if (!existing.latitude) existing.latitude = patch.latitude;
      if (!existing.longitude) existing.longitude = patch.longitude;
      if (!existing.distanceKm) existing.distanceKm = patch.distanceKm;

      if (!existing.phone) existing.phone = patch.phone;
      if (!existing.website) existing.website = patch.website;
      if (!existing.sourceUrl) existing.sourceUrl = patch.sourceUrl;

      existing.rating = patch.rating;
      existing.reviewCount = patch.reviewCount;

      if (!Array.isArray(existing.hours) || existing.hours.length === 0) existing.hours = patch.hours;

      if (!existing.category) existing.category = patch.category;
      if (!Array.isArray(existing.tags) || existing.tags.length === 0) existing.tags = patch.tags;

      existing._apifyEnrichedAt = patch._apifyEnrichedAt;

      const after = JSON.stringify({
        phone: existing.phone,
        website: existing.website,
        hours: existing.hours,
        rating: existing.rating,
        reviewCount: existing.reviewCount,
      });

      if (before !== after) updated++;
    } else if (addNew) {
      // Keep images empty here (Extractor doesn't provide images).
      const p = {
        id: patch.id,
        sourceId: patch.sourceId,
        name: patch.name,
        category: patch.category,
        rating: patch.rating,
        reviewCount: patch.reviewCount,
        priceLevel: 0,
        priceText: null,
        description: "",
        image: null,
        address: patch.address,
        latitude: patch.latitude,
        longitude: patch.longitude,
        phone: patch.phone,
        website: patch.website,
        hours: patch.hours,
        tags: patch.tags,
        sourceUrl: patch.sourceUrl,
        gallery: [],
        openStatusText: null,
        menuUrl: it?.menu || null,
        distanceKm: patch.distanceKm,
        _apifyEnrichedAt: patch._apifyEnrichedAt,
      };
      places.push(p);
      byId.set(placeId, p);
      added++;
    }
  }

  doc.updatedAt = new Date().toISOString();
  doc.source = doc.source || "Google Maps";
  doc.places = places;

  const report = {
    updatedAt: new Date().toISOString(),
    apifyActor: ACTOR_ID,
    input,
    items: items.length,
    matched,
    updated,
    added,
    totalPlaces: places.length,
  };

  await fs.writeFile(PLACES_JSON_PATH, JSON.stringify(doc, null, 2), "utf8");
  await fs.writeFile(path.join(ROOT, "public", "data", "apify-report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log(`\n✅ Apify done. items=${items.length} matched=${matched} updated=${updated} added=${added} total=${places.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
