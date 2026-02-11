import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.GOOGLE_PLACES_API_KEY;

const ROOT = path.resolve(".");
const PLACES_JSON_PATH = path.join(ROOT, "public", "data", "places.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    limit: Infinity,
    sleepMs: 120,
    onlyMissing: true,
    forceIfEnrichedMissing: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") out.limit = Number(args[++i] || "0") || Infinity;
    if (a === "--sleep") out.sleepMs = Number(args[++i] || "0") || 120;
    if (a === "--all") out.onlyMissing = false;
    if (a === "--force-missing") out.forceIfEnrichedMissing = true;
  }

  return out;
}

function moneyText(priceLevel) {
  if (!Number.isFinite(priceLevel) || priceLevel <= 0) return null;
  return "$".repeat(Math.min(4, Math.max(1, priceLevel)));
}

function normalizeTags(types = []) {
  // Pequena camada de tags úteis para roteiros (PT-BR)
  const tags = new Set();
  const joined = types.join("|");

  if (joined.match(/restaurant|meal_takeaway|meal_delivery|food/)) tags.add("Restaurante");
  if (joined.match(/cafe/)) tags.add("Café");
  if (joined.match(/bar|night_club/)) tags.add("Bar");
  if (joined.match(/park/)) tags.add("Parque");
  if (joined.match(/museum|art_gallery/)) tags.add("Cultura");
  if (joined.match(/shopping_mall|store/)) tags.add("Compras");
  if (joined.match(/tourist_attraction/)) tags.add("Passeio");

  // Sempre manter no máximo 8 para não poluir
  return Array.from(tags).slice(0, 8);
}

async function getPlaceDetails(placeId) {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "formatted_phone_number",
    "website",
    "url",
    "opening_hours",
    "rating",
    "user_ratings_total",
    "price_level",
    "types",
    "editorial_summary",
  ].join(",");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", KEY);

  const resp = await fetch(url.toString());
  const json = await resp.json();
  return json;
}

async function main() {
  if (!KEY) {
    console.error(
      "❌ GOOGLE_PLACES_API_KEY não definido.\n" +
        "Defina no ambiente antes de rodar, ex:\n" +
        "  GOOGLE_PLACES_API_KEY=... npm run enrich:google\n"
    );
    process.exit(1);
  }

  const { limit, sleepMs, onlyMissing, forceIfEnrichedMissing } = parseArgs();

  const raw = await fs.readFile(PLACES_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  let processed = 0;
  let updated = 0;

  console.log(`📦 Places no JSON: ${places.length}`);
  console.log(`⚙️  onlyMissing=${onlyMissing} limit=${limit} sleepMs=${sleepMs} forceMissing=${forceIfEnrichedMissing}`);

  for (const place of places) {
    if (processed >= limit) break;

    const placeId = place.sourceId || place.id;
    if (!placeId || typeof placeId !== "string") continue;

    const missingRichness =
      !place.phone || !place.website || !place.hours || !place.description;

    // Skip fully-enriched items on missing mode, unless forcing a second pass.
    if (onlyMissing && place._enrichedAt && !forceIfEnrichedMissing) continue;
    if (onlyMissing && !missingRichness) continue;

    processed++;

    try {
      const details = await getPlaceDetails(placeId);

      if (details.status !== "OK" || !details.result) {
        console.warn(`⚠️  ${place.name || placeId}: ${details.status}`);
        await sleep(sleepMs);
        continue;
      }

      const r = details.result;
      const lat = r.geometry?.location?.lat;
      const lng = r.geometry?.location?.lng;

      place.name = r.name ?? place.name;
      place.address = r.formatted_address ?? place.address;
      place.latitude = Number.isFinite(lat) ? lat : place.latitude;
      place.longitude = Number.isFinite(lng) ? lng : place.longitude;

      place.phone = r.formatted_phone_number ?? place.phone;
      place.website = r.website ?? place.website;
      place.sourceUrl = r.url ?? place.sourceUrl;

      place.rating = Number(r.rating ?? place.rating ?? 0) || place.rating;
      place.reviewCount = Number(r.user_ratings_total ?? place.reviewCount ?? 0) || place.reviewCount;

      if (Number.isFinite(r.price_level)) {
        place.priceLevel = r.price_level;
        place.priceText = moneyText(r.price_level);
      }

      if (r.opening_hours?.weekday_text) {
        place.hours = r.opening_hours.weekday_text;
      }
      if (typeof r.opening_hours?.open_now === "boolean") {
        place.openStatusText = r.opening_hours.open_now ? "Aberto agora" : "Fechado agora";
      }

      const newTags = normalizeTags(r.types || []);
      if (newTags.length) {
        place.tags = Array.from(new Set([...(place.tags || []), ...newTags])).slice(0, 8);
      }

      const editorial = r.editorial_summary?.overview;
      if (editorial && (!place.description || place.description.trim().length < 20)) {
        place.description = editorial;
      }

      place._enrichedAt = new Date().toISOString();
      updated++;

      console.log(`✅ Enriquecido: ${place.name}`);
    } catch (err) {
      console.warn(`❌ Falhou: ${place.name || placeId}: ${err?.message || err}`);
    }

    await sleep(sleepMs);
  }

  doc.updatedAt = new Date().toISOString();
  doc.places = places;

  await fs.writeFile(PLACES_JSON_PATH, JSON.stringify(doc, null, 2), "utf8");

  console.log(`\n✅ Concluído. Processados=${processed} Atualizados=${updated}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
