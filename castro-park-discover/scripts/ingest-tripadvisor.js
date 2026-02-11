import fs from "node:fs/promises";
import path from "node:path";
import { ApifyClient } from "apify-client";
import * as cheerio from "cheerio";

await loadEnv();

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const LOCATION_QUERY = process.env.LOCATION_QUERY || "Goiania";
const MAX_ITEMS = Number(process.env.MAX_RESULTS || process.env.APIFY_MAX_ITEMS || 100);
const ENRICH_IMAGES_PER_PLACE = 6;
const MAX_CONCURRENCY = 3;
const ENABLE_ENRICH = String(process.env.ENRICH_IMAGES || "false").toLowerCase() === "true";
const SEARCH_TERMS = process.env.SEARCH_TERMS
  ? process.env.SEARCH_TERMS.split("|").map((t) => t.trim()).filter(Boolean)
  : [LOCATION_QUERY];

if (!APIFY_TOKEN) {
  console.error("APIFY_TOKEN não encontrado. Defina no .env antes de rodar o script.");
  process.exit(1);
}

const ACTOR_ID = "maxcopell/tripadvisor";
const outputDir = path.resolve("public", "data");
const outputFile = path.join(outputDir, "places.json");
const overridesFile = path.resolve("data", "overrides.json");

async function main() {
  const client = new ApifyClient({ token: APIFY_TOKEN });

  let allItems = [];

  for (const term of SEARCH_TERMS) {
    console.log(`> Iniciando coleta via Apify para "${term}"...`);
    const input = {
      query: term,
      maxItemsPerQuery: MAX_ITEMS,
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
    };

    const run = await client.actor(ACTOR_ID).call(input);
    const datasetId = run.defaultDatasetId;
    if (!datasetId) {
      throw new Error("Dataset ID não retornado pelo actor.");
    }
    const items = await fetchAllDatasetItems(client, datasetId);
    console.log(`  -> ${items.length} registros crus retornados para "${term}"`);
    items.forEach((it) => (it.__originQuery = term));
    allItems = allItems.concat(items);
  }

  let places = normalizeItems(allItems);
  console.log(`> ${places.length} lugares normalizados (deduplicados)`);

  const overrides = await loadOverrides();
  places = applyOverrides(places, overrides);

  if (ENABLE_ENRICH) {
    places = await enrichPlaces(places);
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        location: { query: LOCATION_QUERY },
        places,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`> Dados salvos em ${outputFile}`);
}

function normalizeItems(items) {
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

    const priceLevel = parsePriceLevel(item.priceLevel);
    const description = item.description || item.rankingString || "Descrição não disponível";
    const category = mapCategory(item);
    const tags = buildTags(item);

  const gallery = Array.isArray(item.photos) ? item.photos.map((p) => p?.url).filter(Boolean).slice(0, 8) : undefined;

  const normalized = {
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
      latitude: item.latitude,
      longitude: item.longitude,
      phone: item.phone || null,
      website: item.website || null,
      email: item.email || null,
      tags,
      sourceUrl,
    openStatusCategory: item.openNowText || null,
    openStatusText: item.openNowText || null,
    menuUrl: item.menuWebUrl || null,
    reviews: undefined,
    categories: [category],
    gallery,
    highlights: item.reviewTags ? item.reviewTags.map((t) => t.text).slice(0, 5) : undefined,
    originQueries: originQuery ? [originQuery] : [],
  };

  const existing = map.get(key);
  if (!existing || normalized.rating > existing.rating) {
    map.set(key, normalized);
  }
  }

  return Array.from(map.values());
}

function mapCategory(item) {
  const name = (item.name || "").toLowerCase();
  const type = (item.type || item.category || "").toLowerCase();

  if (type.includes("restaurant")) return "restaurants";
  if (type.includes("hotel")) return "hotels";
  if (type.includes("vacation")) return "vacation";

  // Atrações e subtipos
  if (name.match(/shopping|mall|mercado|feira/)) return "shopping";
  if (name.match(/parque|bosque|praça|p[aã]tio|jardim/)) return "nature";
  if (name.match(/museu|teatro|catedral|igreja|centro cultural|monumento|art deco|cultura/)) return "culture";

  if (type.includes("attraction")) return "attractions";
  return "attractions";
}

function buildTags(item) {
  const tags = new Set();
  if (Array.isArray(item.subcategories)) item.subcategories.forEach((t) => t && tags.add(t));
  if (Array.isArray(item.cuisines)) item.cuisines.forEach((t) => t && tags.add(t));
  if (Array.isArray(item.features)) item.features.forEach((t) => t && tags.add(t));
  if (item.type) tags.add(item.type);
  if (item.__originQuery) tags.add(item.__originQuery);
  return Array.from(tags).slice(0, 8);
}

function parsePriceLevel(level) {
  if (!level) return 0;
  const dollars = String(level).match(/\$/g);
  if (dollars) return dollars.length;
  const numeric = Number(level);
  return Number.isFinite(numeric) ? numeric : 0;
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
  if (!raw) return "unknown";
  // Remove espaços e caracteres que quebram rota; usa encodeURIComponent
  return encodeURIComponent(String(raw));
}

async function enrichPlaces(places) {
  console.log("> Enriquecendo lugares com fotos extras e descrição...");
  const needEnrich = places.filter((p) => (!p.gallery || p.gallery.length < 2) && p.sourceUrl);
  const concurrency = MAX_CONCURRENCY;
  let index = 0;

  async function worker() {
    while (index < needEnrich.length) {
      const current = needEnrich[index++];
      try {
        const enriched = await fetchPlaceDetails(current.sourceUrl, current.gallery || []);
        if (enriched.gallery.length > (current.gallery?.length || 0)) {
          current.gallery = enriched.gallery.slice(0, ENRICH_IMAGES_PER_PLACE);
        }
        if (!current.description && enriched.description) {
          current.description = enriched.description;
        }
        if (enriched.highlights.length) {
          current.highlights = Array.from(new Set([...(current.highlights || []), ...enriched.highlights])).slice(0, 6);
        }
      } catch (err) {
        console.warn(`  ! Falha ao enriquecer ${current.name}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return places;
}

async function fetchPlaceDetails(url, existingGallery) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const html = await resp.text();
  const $ = cheerio.load(html);

  const images = new Set(existingGallery || []);

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) images.add(absoluteUrl(ogImage, url));

  $('link[rel="image_src"]').each((_, el) => {
    const src = $(el).attr("href");
    if (src) images.add(absoluteUrl(src, url));
  });

  $('img').each((_, el) => {
    const src = $(el).attr("data-lazy") || $(el).attr("data-src") || $(el).attr("src");
    if (src && src.startsWith("http")) {
      images.add(absoluteUrl(src, url));
    }
  });

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $("p[itemprop='description']").first().text().trim() ||
    "";

  const highlights = [];
  $(".review-snippets-card, .popular-dishes, .popular-drinks, .top-dishes").find("li, span").each((_, el) => {
    const text = $(el).text().trim();
    if (text) highlights.push(text);
  });

  return {
    gallery: Array.from(images).slice(0, ENRICH_IMAGES_PER_PLACE),
    description: description || undefined,
    highlights,
  };
}

function absoluteUrl(src, base) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

async function loadOverrides() {
  try {
    const content = await fs.readFile(overridesFile, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function applyOverrides(places, overrides) {
  if (!overrides || typeof overrides !== "object") return places;
  return places.map((p) => {
    const ov = overrides[p.sourceId] || overrides[p.id];
    if (!ov) return p;
    return { ...p, ...ov };
  });
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
  console.error("Ingestão falhou:", err);
  process.exit(1);
});
