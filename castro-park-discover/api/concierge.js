import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FALLBACK = {
  message: "Não consegui entender sua busca. Tente: 'restaurante italiano perto do hotel', 'o que fazer com crianças', 'barzinho para noite'.",
  places: [],
};

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
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const kw of keywords) {
    if (text.includes(kw)) score += 1;
    const nameNorm = (place.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nameNorm.includes(kw)) score += 2;
  }

  if (place.hotel_recommended) score += 2;
  if (place.hotel_score) score += place.hotel_score / 10;
  if (place.rating) score += place.rating / 10;

  return score;
}

function extractKeywords(query) {
  const stopWords = new Set(["que", "com", "para", "uma", "um", "por", "como", "tem", "quero", "preciso", "onde", "qual", "quais", "tem", "ter"]);
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((kw) => kw.length > 2 && !stopWords.has(kw));
}

async function callClaude(systemPrompt, messages, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
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

function sanitizeQuery(raw) {
  return raw.trim().replace(/["\\\n\r]/g, " ").slice(0, 300);
}

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
    const { data: places, error } = await supabase
      .from("places")
      .select("id, name, category, subcategories, description, tags, hotel_recommended, hotel_score, rating, address")
      .eq("is_active", true)
      .limit(500);

    if (error) throw error;

    const safeQuery = sanitizeQuery(lastUserMsg);
    const keywords = extractKeywords(safeQuery);
    const allPlaces = places || [];

    const scored = allPlaces
      .map((p) => ({ place: p, score: scorePlace(p, keywords) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const top = scored.filter((s) => s.score > 0);
    const context = (top.length > 0 ? top : scored.slice(0, 5))
      .map(
        ({ place: p }) =>
          `ID: ${p.id}\nNome: ${p.name}\nCategoria: ${p.category}\nDescrição: ${(p.description || "").slice(0, 120)}\nAvaliação: ${p.rating || "N/A"}`
      )
      .join("\n---\n");

    const systemPrompt = `Você é o concierge digital do Castro's Park Hotel em Goiânia, Brasil. Seu tom é elegante, acolhedor e prestativo. Você mantém o contexto da conversa e responde de forma coerente com o histórico.

Lugares disponíveis no guia do hotel (selecionados por relevância à última mensagem):
${context}

Selecione até 3 lugares que melhor atendem ao pedido atual. Responda SOMENTE com JSON válido, sem texto extra:
{
  "places": [
    {
      "id": "ID_exato_do_lugar",
      "name": "Nome do lugar",
      "reason": "Uma frase elegante explicando por que este lugar é ideal",
      "highlight": "Uma dica especial ou detalhe que o hóspede vai adorar"
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
    return res.status(200).json(FALLBACK);
  }
}
