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

    // Cost controls
    photos: 0,
    includeEditorial: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") out.limit = Number(args[++i] || "0") || Infinity;
    if (a === "--sleep") out.sleepMs = Number(args[++i] || "0") || 120;
    if (a === "--all") out.onlyMissing = false;
    if (a === "--force-missing") out.forceIfEnrichedMissing = true;

    if (a === "--photos") out.photos = Math.max(0, Number(args[++i] || "0") || 0);
    if (a === "--editorial") out.includeEditorial = true;
    if (a === "--no-editorial") out.includeEditorial = false;
  }

  // Defaults: full rebuild gets photos + editorial, missing-mode is cheap.
  if (!out.onlyMissing) {
    if (out.photos === 0) out.photos = 6;
    if (!out.includeEditorial) out.includeEditorial = true;
  }

  return out;
}

function moneyText(priceLevel) {
  if (!Number.isFinite(priceLevel) || priceLevel <= 0) return null;
  return "$".repeat(Math.min(4, Math.max(1, priceLevel)));
}

function normalizeTags(types = []) {
  // Tags simples (PT-BR) derivadas de types do Google.
  // A curadoria fina (romântico/família/etc.) vem depois.
  const tags = new Set();
  const joined = types.join("|");

  if (joined.match(/restaurant|meal_takeaway|meal_delivery|food/)) tags.add("Restaurante");
  if (joined.match(/cafe/)) tags.add("Café");
  if (joined.match(/bar|night_club/)) tags.add("Bar");

  if (joined.match(/tourist_attraction/)) tags.add("Passeio");
  if (joined.match(/park/)) tags.add("Parque");
  if (joined.match(/museum/)) tags.add("Museu");
  if (joined.match(/art_gallery/)) tags.add("Galeria");
  if (joined.match(/theater/)) tags.add("Teatro");
  if (joined.match(/stadium/)) tags.add("Estádio");

  if (joined.match(/shopping_mall/)) tags.add("Shopping");
  if (joined.match(/store/)) tags.add("Compras");

  return Array.from(tags).slice(0, 8);
}

function mapCategoryFromTypes(types = []) {
  const joined = types.join("|");

  // Ordem importa
  if (joined.match(/night_club|bar/)) return "nightlife";
  if (joined.match(/cafe/)) return "cafes";
  if (joined.match(/restaurant|meal_takeaway|meal_delivery|food/)) return "restaurants";

  if (joined.match(/shopping_mall/)) return "shopping";

  if (joined.match(/park/)) return "nature";
  if (joined.match(/museum|art_gallery|theater/)) return "culture";

  if (joined.match(/tourist_attraction/)) return "attractions";

  return undefined;
}

async function resolvePhotoUrl(photoReference, maxWidth = 1200) {
  if (!photoReference) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("key", KEY);

  const resp = await fetch(url.toString(), { redirect: "manual" });
  const loc = resp.headers.get("location");
  return loc || null;
}

async function getPlaceDetails(placeId, opts = {}) {
  const includeEditorial = Boolean(opts.includeEditorial);
  const photos = Math.max(0, Number(opts.photos || 0));

  const fieldsArr = [
    // Core
    "place_id",
    "name",
    "formatted_address",
    "geometry",

    // Useful fields
    "formatted_phone_number",
    "website",
    "url",
    "opening_hours",
    "rating",
    "user_ratings_total",
    "price_level",
    "types",
  ];

  if (includeEditorial) fieldsArr.push("editorial_summary");
  if (photos > 0) fieldsArr.push("photos");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fieldsArr.join(","));
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", KEY);

  const resp = await fetch(url.toString());
  const json = await resp.json();
  return json;
}

async function getPlaceDetailsWithRetry(placeId, opts = {}) {
  const maxAttempts = Number(opts.maxAttempts ?? 5);
  let attempt = 0;
  let backoffMs = Number(opts.initialBackoffMs ?? 1200);

  while (true) {
    attempt++;
    const json = await getPlaceDetails(placeId, opts);

    const status = json?.status;

    // OVER_QUERY_LIMIT é comum quando dispara muitas requisições; fazemos backoff e tentamos novamente.
    if (status === "OVER_QUERY_LIMIT" || status === "UNKNOWN_ERROR") {
      if (attempt >= maxAttempts) return json;
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, 15000);
      continue;
    }

    return json;
  }
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

  const { limit, sleepMs, onlyMissing, forceIfEnrichedMissing, photos, includeEditorial } = parseArgs();

  const raw = await fs.readFile(PLACES_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  let processed = 0;
  let updated = 0;
  const failures = [];

  console.log(`📦 Places no JSON: ${places.length}`);
  console.log(
    `⚙️  onlyMissing=${onlyMissing} limit=${limit} sleepMs=${sleepMs} forceMissing=${forceIfEnrichedMissing} photos=${photos} editorial=${includeEditorial}`
  );

  for (const place of places) {
    if (processed >= limit) break;

    const placeId = place.sourceId || place.id;
    if (!placeId || typeof placeId !== "string") continue;

    const missingRichness =
      !place.phone ||
      !place.website ||
      !place.description ||
      !place.hours ||
      (Array.isArray(place.hours) && place.hours.length === 0);

    // Skip fully-enriched items on missing mode, unless forcing a second pass.
    if (onlyMissing && place._enrichedAt && !forceIfEnrichedMissing) continue;
    if (onlyMissing && !missingRichness) continue;

    processed++;

    try {
      const details = await getPlaceDetailsWithRetry(placeId, { photos, includeEditorial });

      if (details.status !== "OK" || !details.result) {
        const status = details?.status || "UNKNOWN";
        const msg = details?.error_message;
        failures.push({
          placeId,
          name: place.name,
          status,
          error_message: msg,
        });
        console.warn(`⚠️  ${place.name || placeId}: ${status}${msg ? ` — ${msg}` : ""}`);
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

      // Categoria e tags (corrige inconsistências)
      const mappedCategory = mapCategoryFromTypes(r.types || []);
      if (mappedCategory) {
        place.category = mappedCategory;
      }

      const newTags = normalizeTags(r.types || []);
      if (newTags.length) {
        place.tags = newTags;
      }

      // Fotos (caro). Por padrão, o modo missing NÃO baixa fotos.
      // Só baixa quando `--photos N` (ou modo --all, que define photos=6 por padrão).
      if (photos > 0 && Array.isArray(r.photos) && r.photos.length) {
        const refs = r.photos
          .map((p) => p?.photo_reference)
          .filter(Boolean)
          .slice(0, photos);

        const urls = [];
        for (const ref of refs) {
          const u = await resolvePhotoUrl(ref);
          if (u) urls.push(u);
          await sleep(150);
        }

        if (urls.length) {
          // Só substitui se não existir (pra evitar ficar trocando e gastando sem necessidade).
          if (!place.image) place.image = urls[0];
          if (!Array.isArray(place.gallery) || place.gallery.length === 0) place.gallery = urls;
        }
      }

      // Descrição editorial (pode ser caro e nem sempre vem). Default: só quando --editorial (ou --all).
      if (includeEditorial) {
        const editorial = r.editorial_summary?.overview;
        if (editorial && (!place.description || place.description.trim().length < 20)) {
          place.description = editorial;
        }
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

  // Relatório de falhas (para debug sem precisar acessar logs do Actions)
  const reportPath = path.join(ROOT, "public", "data", "enrich-report.json");
  const summary = {
    updatedAt: new Date().toISOString(),
    processed,
    updated,
    failures: failures.length,
    statuses: failures.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {}),
  };

  await fs.writeFile(reportPath, JSON.stringify({ summary, failures: failures.slice(0, 200) }, null, 2), "utf8");

  console.log(`\n✅ Concluído. Processados=${processed} Atualizados=${updated} Falhas=${failures.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
