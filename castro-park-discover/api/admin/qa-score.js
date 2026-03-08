import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

// ── Calcula score de qualidade de um lugar (0-100) ─────────────────────────
function calcScore(place) {
  let score = 0;
  const issues = [];

  if (place.image) {
    score += 20;
  } else {
    issues.push("foto de capa");
  }

  const gc = Array.isArray(place.gallery) ? place.gallery.length : 0;
  if (gc >= 3) {
    score += 20;
  } else if (gc >= 1) {
    score += 10;
    issues.push("mais fotos na galeria (mín. 3)");
  } else {
    issues.push("galeria de fotos");
  }

  if (place.description && place.description.length >= 50) {
    score += 20;
  } else {
    issues.push("descrição completa");
  }

  if (place.hours) {
    score += 20;
  } else {
    issues.push("horários de funcionamento");
  }

  if (place.website) {
    score += 10;
  } else {
    issues.push("site oficial");
  }

  if (place.menu_url) {
    score += 10;
  } else {
    issues.push("link do cardápio");
  }

  return { score, issues };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (!verifyToken(req)) return unauthorized(res);

  const { data, error } = await supabase
    .from("places")
    .select("id, name, category, image, gallery, description, hours, website, menu_url")
    .eq("is_active", true);

  if (error) return res.status(500).json({ error: error.message });

  const scored = (data || []).map((p) => {
    const { score, issues } = calcScore(p);
    return { id: p.id, name: p.name, category: p.category, score, issues };
  });

  const total = scored.length;
  if (total === 0) {
    return res.status(200).json({
      total: 0, excellent: 0, good: 0, regular: 0, critical: 0,
      needsAttention: 0, avgScore: 0, topIssues: [], worst: [],
    });
  }

  const excellent = scored.filter((p) => p.score >= 90).length;
  const good      = scored.filter((p) => p.score >= 70 && p.score < 90).length;
  const regular   = scored.filter((p) => p.score >= 50 && p.score < 70).length;
  const critical  = scored.filter((p) => p.score < 50).length;

  // Issues mais frequentes
  const issueCounts = {};
  scored.forEach((p) =>
    p.issues.forEach((issue) => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    })
  );
  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([issue, count]) => ({ issue, count }));

  // Piores lugares para direcionar manutenção
  const worst = [...scored]
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map(({ id, name, score, issues }) => ({ id, name, score, issues }));

  const avgScore = Math.round(
    scored.reduce((sum, p) => sum + p.score, 0) / total
  );

  return res.status(200).json({
    total, excellent, good, regular, critical,
    needsAttention: regular + critical,
    avgScore,
    topIssues,
    worst,
  });
}
