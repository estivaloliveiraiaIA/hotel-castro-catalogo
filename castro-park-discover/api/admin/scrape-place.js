import { verifyToken, unauthorized } from "../_lib/auth.js";

// ── Extrai dados brutos da URL do Google Maps ─────────────────────────────
function extractFromUrl(url) {
  const placeMatch = url.match(/\/maps\/place\/([^/@?#]+)/);
  const name = placeMatch
    ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).replace(/_/g, " ")
    : null;

  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
  const lng = coordMatch ? parseFloat(coordMatch[2]) : null;

  return { name, lat, lng };
}

// ── Segue redirects para resolver URLs curtas (maps.app.goo.gl) ──────────
async function resolveUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    return res.url || url;
  } catch {
    return url;
  }
}

// ── Busca dados via Google Places API (opcional, melhor qualidade) ────────
async function fetchFromPlacesApi(name, lat, lng, apiKey) {
  const query = encodeURIComponent(
    `${name}${lat ? ` near ${lat},${lng}` : " Goiânia GO Brasil"}`
  );
  const findRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`,
    { signal: AbortSignal.timeout(4000) }
  );
  const findData = await findRes.json();
  const placeId = findData.candidates?.[0]?.place_id;
  if (!placeId) return null;

  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,opening_hours,photos,price_level&language=pt-BR&key=${apiKey}`,
    { signal: AbortSignal.timeout(4000) }
  );
  const details = (await detailsRes.json()).result;
  if (!details) return null;

  const imageUrl = details.photos?.[0]
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${apiKey}`
    : null;

  return {
    name: details.name,
    address: details.formatted_address || null,
    phone: details.formatted_phone_number || null,
    website: details.website || null,
    rating: details.rating || null,
    hours: details.opening_hours?.weekday_text?.join("\n") || null,
    image: imageUrl,
    price_level: details.price_level || null,
  };
}

// ── Extrai JSON-LD da página do Google Maps (fallback sem API key) ────────
async function fetchFromPage(resolvedUrl) {
  try {
    const res = await fetch(resolvedUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    const html = await res.text();

    // Tenta extrair JSON-LD (structured data do Google)
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        const hours = Array.isArray(ld.openingHours)
          ? ld.openingHours.join("\n")
          : ld.openingHoursSpecification
          ? null
          : null;

        return {
          name: ld.name || null,
          address: ld.address
            ? typeof ld.address === "string"
              ? ld.address
              : [
                  ld.address.streetAddress,
                  ld.address.addressLocality,
                  ld.address.addressRegion,
                ]
                  .filter(Boolean)
                  .join(", ")
            : null,
          phone: ld.telephone || null,
          website: ld.url || null,
          rating: ld.aggregateRating?.ratingValue
            ? parseFloat(ld.aggregateRating.ratingValue)
            : null,
          hours,
          image: Array.isArray(ld.image)
            ? ld.image[0]
            : typeof ld.image === "string"
            ? ld.image
            : null,
          price_level: null,
        };
      } catch {
        // JSON-LD inválido, continua com nome da URL
      }
    }
  } catch {
    // Fetch falhou, retorna null
  }
  return null;
}

// ── Enriquece com Claude Haiku ────────────────────────────────────────────
async function enrichWithHaiku(rawData, llmKey) {
  const prompt = `Você é curador de um guia turístico premium de Goiânia, Brasil, para hóspedes do Castro's Park Hotel.

Com base nos dados abaixo, preencha as informações em português e categorize o lugar.

CATEGORIAS (escolha exatamente uma):
- restaurants: restaurantes em geral
- cafes: cafés, padarias, açaí, sorveterias, confeitarias
- nightlife: bares, baladas, pubs, rooftop, happy hour
- nature: parques, trilhas, lagos, áreas verdes
- attractions: museus, zoológicos, pontos turísticos, passeios
- culture: teatros, cinemas, galerias, shows, exposições
- shopping: shoppings, mercados, lojas, feiras

SUBCATEGORIAS DISPONÍVEIS:
restaurants: Italiana, Japonesa, Brasileira, Típica Goiana, Alta Gastronomia, Churrascaria, Hambúrguer, Pizza, Contemporânea, Frutos do mar, Vegetariana/Vegana, Árabe, Peruana, Francesa, Fast food, Self service, Rodízio, Buffet
cafes: Café colonial, Café especial, Padaria, Confeitaria, Brunch, Açaí, Sorvetes, Doces e bolos
nightlife: Bar, Pub, Balada, Karaokê, Rooftop, Boteco, Clube, Jazz bar, Happy hour
nature: Parque, Lago, Trilha, Cachoeira, Jardim botânico, Reserva ecológica, Praça, Área verde
attractions: Museu, Zoológico, Aquário, Parque temático, Mirante, Ponto histórico, Memorial, Passeio guiado
culture: Teatro, Cinema, Galeria de arte, Centro cultural, Exposição, Show, Música ao vivo, Dança
shopping: Shopping center, Mercado, Outlet, Mercado municipal, Feira, Loja de roupas, Loja de presentes, Artesanato

DADOS DO LUGAR:
${JSON.stringify(rawData, null, 2)}

Retorne SOMENTE JSON válido sem texto adicional:
{
  "category": "uma das categorias acima",
  "subcategories": ["subcategorias relevantes da lista acima"],
  "description": "Descrição elegante em português (2-3 frases), ideal para hóspede de hotel de alto padrão. Destaque o que torna o lugar especial.",
  "tags": ["3 a 5 tags curtas em português, ex: romântico, família, vista panorâmica"],
  "price_level": 2
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": llmKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Haiku error ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Haiku não retornou JSON válido");
  return JSON.parse(match[0]);
}

// ── Handler principal ─────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);
  if (req.method !== "POST") return res.status(405).end();

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || !url.includes("google")) {
    return res.status(400).json({ error: "URL do Google Maps inválida" });
  }

  const llmKey = process.env.LLM_API_KEY;
  if (!llmKey) {
    return res.status(500).json({ error: "LLM_API_KEY não configurada na Vercel" });
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY || null;

  try {
    // 1. Resolve URL (short links)
    const resolvedUrl = await resolveUrl(url);
    const { name: urlName, lat, lng } = extractFromUrl(resolvedUrl);

    // 2. Busca dados do lugar (Places API > JSON-LD > só o nome da URL)
    let raw = null;
    if (googleKey && urlName) {
      raw = await fetchFromPlacesApi(urlName, lat, lng, googleKey);
    }
    if (!raw) {
      raw = await fetchFromPage(resolvedUrl);
    }
    if (!raw) {
      raw = { name: urlName || "Lugar importado", address: null, phone: null, website: null, rating: null, hours: null, image: null, price_level: null };
    }
    // Garante que o nome da URL prevalece se o scraping não retornou nome
    if (!raw.name && urlName) raw.name = urlName;

    // 3. Haiku enriquece com categoria, descrição e subcategorias
    const enriched = await enrichWithHaiku(raw, llmKey);

    return res.status(200).json({
      name: raw.name || "",
      address: raw.address || "",
      phone: raw.phone || "",
      website: raw.website || "",
      rating: raw.rating || null,
      hours: raw.hours || "",
      image: raw.image || null,
      price_level: enriched.price_level ?? raw.price_level ?? null,
      category: enriched.category || "restaurants",
      subcategories: Array.isArray(enriched.subcategories) ? enriched.subcategories : [],
      description: enriched.description || "",
      tags: Array.isArray(enriched.tags) ? enriched.tags : [],
    });
  } catch (err) {
    console.error("[scrape-place]", err.message);
    return res.status(500).json({ error: `Falha ao importar: ${err.message}` });
  }
}
