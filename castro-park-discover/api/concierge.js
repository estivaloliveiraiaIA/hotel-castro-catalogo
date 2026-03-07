import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FALLBACK = {
  message: "Não consegui entender sua busca. Tente: 'restaurante italiano perto do hotel', 'o que fazer com crianças', 'barzinho para noite'.",
  places: [],
};

// ────────────────────────────────────────────────────────
// Mapeamento de intenção → categoria do banco
// ────────────────────────────────────────────────────────
const CATEGORY_INTENT_MAP = {
  restaurants: ["comer", "jantar", "almoco", "restaurante", "comida", "gastronomia", "prato", "refeicao", "lanche", "pizza", "sushi", "churrasco", "italiano", "japones", "hamburguer", "culinaria", "alimento", "gourmet"],
  cafes: ["cafeteria", "brunch", "cappuccino", "bolo", "torta", "padaria", "cafezinho", "sobremesa", "doce"],
  nightlife: ["beber", "bar", "balada", "noite", "cerveja", "drink", "cocktail", "pub", "festa", "boteco", "happy hour", "agito"],
  nature: ["natureza", "parque", "caminhada", "trilha", "jardim", "lago", "verde", "ar livre", "ao ar livre"],
  attractions: ["passeio", "turismo", "visita", "ponto turistico", "zoologico", "aquario", "atracoes", "conhecer", "tour"],
  culture: ["cultura", "arte", "museu", "teatro", "show", "exposicao", "galeria", "cinema"],
  shopping: ["compras", "loja", "presente", "roupa", "moda", "mercado", "shopping"],
};

// Palavras-chave que indicam pergunta sobre o hotel (ativa RAG)
const HOTEL_TRIGGER_KEYWORDS = [
  "hotel", "quarto", "hospedagem", "wifi", "wi-fi", "internet", "estacionamento",
  "spa", "academia", "piscina", "cafe da manha", "checkout", "check-out", "checkin",
  "check-in", "room service", "ipe", "feijoada", "recepcao", "suite", "diaria",
  "valet", "sauna", "brinquedoteca", "convencao", "salao", "musica ao vivo",
  "animais", "pet", "cachorro", "preco", "tarifa", "reserva", "transferencia",
];

// ────────────────────────────────────────────────────────
// Utilitários de texto
// ────────────────────────────────────────────────────────
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");
}

function sanitizeQuery(raw) {
  return raw.trim().replace(/["\\\n\r]/g, " ").slice(0, 300);
}

// ────────────────────────────────────────────────────────
// Extração de keywords com stopwords PT-BR expandidas
// ────────────────────────────────────────────────────────
function extractKeywords(query) {
  const stopWords = new Set([
    "que", "com", "para", "uma", "um", "por", "como", "tem", "quero", "preciso",
    "onde", "qual", "quais", "ter", "vai", "vou", "pode", "tem", "meu", "minha",
    "nos", "nossa", "nosso", "seu", "sua", "mais", "muito", "pouco", "bem", "mal",
    "aqui", "ali", "la", "ja", "nao", "sim", "mas", "porem", "ate", "apos",
    "sobre", "entre", "desde", "durante", "antes", "depois", "quando", "porque",
  ]);
  return normalize(query)
    .split(/\s+/)
    .filter((kw) => kw.length > 2 && !stopWords.has(kw));
}

// ────────────────────────────────────────────────────────
// Detecta categoria pretendida na query
// ────────────────────────────────────────────────────────
function detectCategoryIntent(keywords) {
  const scores = {};
  for (const [cat, catKeywords] of Object.entries(CATEGORY_INTENT_MAP)) {
    scores[cat] = keywords.filter((kw) => catKeywords.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

// ────────────────────────────────────────────────────────
// Detecta se a query é sobre o hotel (ativa RAG)
// ────────────────────────────────────────────────────────
function isHotelQuery(keywords) {
  return keywords.some((kw) =>
    HOTEL_TRIGGER_KEYWORDS.some((trigger) => kw.includes(trigger) || trigger.includes(kw))
  );
}

// ────────────────────────────────────────────────────────
// Busca chunks relevantes do hotel no Supabase
// ────────────────────────────────────────────────────────
async function fetchHotelKnowledge(keywords) {
  try {
    const { data, error } = await supabase
      .from("hotel_knowledge")
      .select("topic, content, keywords");

    if (error || !data) return [];

    // Pontua chunks por overlap de keywords
    const scored = data
      .map((chunk) => {
        const overlap = (chunk.keywords || []).filter((k) =>
          keywords.some((kw) => k.includes(kw) || kw.includes(k))
        ).length;
        return { chunk, overlap };
      })
      .filter((s) => s.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 4);

    return scored.map((s) => s.chunk.content);
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────
// Score de relevância de um lugar
// ────────────────────────────────────────────────────────
function scorePlace(place, keywords) {
  let score = 0;
  const text = [
    place.name,
    place.category,
    place.description,
    ...(place.subcategories || []),
    ...(place.tags || []),
  ]
    .filter(Boolean)
    .join(" ");

  const textNorm = normalize(text);

  for (const kw of keywords) {
    if (textNorm.includes(kw)) score += 1;
    const nameNorm = normalize(place.name);
    if (nameNorm.includes(kw)) score += 2;
  }

  if (place.hotel_recommended) score += 2;
  if (place.hotel_score) score += place.hotel_score / 10;
  if (place.rating) score += place.rating / 10;

  return score;
}

// ────────────────────────────────────────────────────────
// Formata nível de preço para o Claude
// ────────────────────────────────────────────────────────
function formatPriceLevel(level) {
  if (!level) return "";
  const labels = { 1: "econômico", 2: "moderado", 3: "sofisticado", 4: "luxo" };
  return labels[level] || "";
}

// ────────────────────────────────────────────────────────
// Chama Claude (Haiku)
// ────────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      temperature: 0.3,
      system: systemPrompt,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Claude");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Claude response");
  return JSON.parse(match[0]);
}

// ────────────────────────────────────────────────────────
// Handler principal
// ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages inválido" });
  }

  const lastUserMsg = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  if (!lastUserMsg || lastUserMsg.trim().length < 2) {
    return res.status(400).json({ error: "mensagem muito curta" });
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return res.status(200).json(FALLBACK);
  }

  try {
    const safeQuery = sanitizeQuery(lastUserMsg);
    const keywords = extractKeywords(safeQuery);

    // Detecta intenção de categoria e query sobre hotel em paralelo
    const categoryIntent = detectCategoryIntent(keywords);
    const hotelQuery = isHotelQuery(keywords);

    // Busca de lugares e hotel knowledge em paralelo
    const [placesResult, hotelChunks] = await Promise.all([
      supabase
        .from("places")
        .select("id, name, category, subcategories, description, tags, hotel_recommended, hotel_score, rating, address, distance_km, price_level")
        .eq("is_active", true)
        .limit(500),
      hotelQuery ? fetchHotelKnowledge(keywords) : Promise.resolve([]),
    ]);

    if (placesResult.error) throw placesResult.error;

    let allPlaces = placesResult.data || [];

    // Pré-filtra por categoria se intenção foi detectada
    if (categoryIntent) {
      const filtered = allPlaces.filter((p) => p.category === categoryIntent);
      // Só aplica filtro se houver resultados suficientes
      if (filtered.length >= 3) allPlaces = filtered;
    }

    // Pontua e seleciona top lugares
    const scored = allPlaces
      .map((p) => ({ place: p, score: scorePlace(p, keywords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const top = scored.filter((s) => s.score > 0);
    const placesToShow = top.length > 0 ? top : scored.slice(0, 5);

    // Constrói contexto dos lugares com distância e preço
    const placesContext = placesToShow
      .map(({ place: p }) => {
        const parts = [
          `ID: ${p.id}`,
          `Nome: ${p.name}`,
          `Categoria: ${p.category}`,
          `Descrição: ${(p.description || "").slice(0, 120)}`,
          `Avaliação: ${p.rating || "N/A"}`,
        ];
        if (p.distance_km) parts.push(`Distância do hotel: ${p.distance_km}km`);
        if (p.price_level) parts.push(`Faixa de preço: ${formatPriceLevel(p.price_level)}`);
        return parts.join("\n");
      })
      .join("\n---\n");

    // Constrói bloco de contexto do hotel (RAG)
    const hotelContext = hotelChunks.length > 0
      ? `\n\nINFORMAÇÕES DO HOTEL (use apenas quando relevante à pergunta do hóspede):\n${hotelChunks.join("\n\n")}`
      : "";

    const systemPrompt = `Você é o concierge digital do Castro's Park Hotel em Goiânia, Brasil. Seu tom é elegante, acolhedor e prestativo. Você mantém o contexto da conversa e responde de forma coerente com o histórico. Para informações sensíveis (valores, dados pessoais, reservas), sempre oriente o hóspede a falar com a recepção pelo (62) 3096-2000.${hotelContext}

Lugares disponíveis no guia do hotel (selecionados por relevância à última mensagem):
${placesContext}

Se a pergunta for sobre o hotel e não sobre lugares externos, use as informações do hotel acima e retorne "places": [].
Selecione até 3 lugares que melhor atendem ao pedido atual. Responda SOMENTE com JSON válido, sem texto extra:
{
  "places": [
    {
      "id": "ID_exato_do_lugar",
      "name": "Nome do lugar",
      "reason": "Uma frase elegante explicando por que este lugar é ideal",
      "highlight": "Uma dica especial ou detalhe único que o hóspede vai adorar"
    }
  ],
  "message": "Resposta elegante ao hóspede (1-3 frases, considerando o contexto da conversa)"
}`;

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: sanitizeQuery(m.content),
    }));

    const result = await callClaude(systemPrompt, claudeMessages, apiKey);

    if (!result.places || !Array.isArray(result.places)) {
      return res.status(200).json(FALLBACK);
    }

    return res.status(200).json({
      message: result.message || "",
      places: result.places.slice(0, 3),
    });
  } catch (err) {
    console.error("[concierge] error:", err.message);

    if (err.name === "AbortError" || err.message?.includes("timeout")) {
      return res.status(200).json({
        message: "Demorei um pouco mais que o esperado. Pode tentar novamente?",
        places: [],
      });
    }

    return res.status(200).json(FALLBACK);
  }
}
