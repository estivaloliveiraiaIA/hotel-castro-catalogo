import { verifyToken, unauthorized } from "../_lib/auth.js";

// ── Segue redirects para resolver URLs curtas ─────────────────────────────
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

// ── Busca dados via Firecrawl (Sympla, sites de shows, etc.) ──────────────
async function fetchFromFirecrawl(url, apiKey) {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["extract"],
        extract: {
          prompt: "Extract event information from this page. Return null for fields not found. Dates must be in YYYY-MM-DD format.",
          schema: {
            type: "object",
            properties: {
              title:       { type: "string", description: "Event name/title" },
              description: { type: "string", description: "Event description" },
              address:     { type: "string", description: "Venue address or location name" },
              venue:       { type: "string", description: "Venue name" },
              start_date:  { type: "string", description: "Event start date in YYYY-MM-DD format" },
              end_date:    { type: "string", description: "Event end date in YYYY-MM-DD format, or null if single day" },
              image:       { type: "string", description: "Main event image URL" },
              link:        { type: "string", description: "Ticket or event page URL" },
              price:       { type: "string", description: "Ticket price or free" },
            },
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.extract) return null;
    const e = data.extract;
    return {
      title:       e.title       || null,
      description: e.description || null,
      address:     e.address || e.venue || null,
      start_date:  e.start_date  || null,
      end_date:    e.end_date    || null,
      image:       e.image       || null,
      link:        e.link        || null,
      price:       e.price       || null,
    };
  } catch {
    return null;
  }
}

// ── Extrai JSON-LD da página (fallback — funciona bem no Sympla) ──────────
async function fetchFromPage(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    const html = await res.text();

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        const root = Array.isArray(ld) ? ld.find((i) => i["@type"] === "Event") || ld[0] : ld;
        if (!root) return null;

        const startRaw = root.startDate || root.startTime || null;
        const endRaw   = root.endDate   || root.endTime   || null;

        const toDate = (raw) => {
          if (!raw) return null;
          const d = new Date(raw);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().slice(0, 10);
        };

        const location = root.location;
        const address = location
          ? typeof location === "string"
            ? location
            : [location.name, location.address?.streetAddress, location.address?.addressLocality]
                .filter(Boolean).join(", ")
          : null;

        return {
          title:       root.name        || null,
          description: root.description || null,
          address,
          start_date:  toDate(startRaw),
          end_date:    toDate(endRaw),
          image:       Array.isArray(root.image) ? root.image[0] : root.image || null,
          link:        root.url || null,
          price:       root.offers?.price ? `R$ ${root.offers.price}` : root.offers?.description || null,
        };
      } catch {
        // JSON-LD inválido
      }
    }
  } catch {
    // fetch falhou
  }
  return null;
}

// ── Enriquece com Claude Haiku ────────────────────────────────────────────
async function enrichEventWithHaiku(rawData, llmKey, sourceUrl) {
  const prompt = `Você é curador de um guia de eventos de Goiânia para hóspedes do Castro's Park Hotel.

Com base nos dados extraídos da página, complete e refine as informações do evento em português.

CATEGORIAS disponíveis (escolha exatamente uma):
- Música: shows, concertos, festivais, sertanejo, rock, MPB
- Cultura: exposições, teatro, cinema, dança, literatura
- Gastronomia: festivais de comida, jantar especial, degustação, feira gastronômica
- Esporte: competições, maratonas, jogos, torneios
- Negócios: congressos, feiras, workshops, conferências
- Família: parques, circo, eventos infantis, parque de diversões
- Arte: vernissage, galerias, instalações artísticas
- Turismo: passeios, roteiros, guias turísticos

DADOS EXTRAÍDOS:
${JSON.stringify(rawData, null, 2)}

URL de origem: ${sourceUrl}

Retorne SOMENTE JSON válido sem texto adicional:
{
  "title": "Título do evento (em português, limpo e conciso)",
  "description": "Descrição elegante em português (2-4 frases). Ideal para hóspede de hotel de alto padrão. Destaque o que torna o evento especial.",
  "category": "uma das categorias acima",
  "address": "Endereço ou local do evento (em português)",
  "start_date": "YYYY-MM-DD ou null",
  "end_date": "YYYY-MM-DD ou null"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": llmKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
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
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL inválida" });
  }

  const llmKey = process.env.LLM_API_KEY;
  if (!llmKey) {
    return res.status(500).json({ error: "LLM_API_KEY não configurada na Vercel" });
  }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY || null;

  try {
    const resolvedUrl = await resolveUrl(url);

    // Cadeia: Firecrawl → JSON-LD → fallback vazio
    let raw = null;
    if (firecrawlKey) {
      raw = await fetchFromFirecrawl(resolvedUrl, firecrawlKey);
    }
    if (!raw) {
      raw = await fetchFromPage(resolvedUrl);
    }
    if (!raw) {
      raw = { title: null, description: null, address: null, start_date: null, end_date: null, image: null, link: resolvedUrl, price: null };
    }

    // Haiku enriquece título, descrição e categoria
    const enriched = await enrichEventWithHaiku(raw, llmKey, resolvedUrl);

    return res.status(200).json({
      title:       enriched.title       || raw.title       || "",
      description: enriched.description || raw.description || "",
      address:     enriched.address     || raw.address     || "",
      category:    enriched.category    || "",
      start_date:  enriched.start_date  || raw.start_date  || new Date().toISOString().slice(0, 10),
      end_date:    enriched.end_date    || raw.end_date    || null,
      image:       raw.image || null,
      link:        raw.link  || resolvedUrl,
      is_active:   true,
    });
  } catch (err) {
    console.error("[scrape-event]", err.message);
    return res.status(500).json({ error: `Falha ao importar evento: ${err.message}` });
  }
}
