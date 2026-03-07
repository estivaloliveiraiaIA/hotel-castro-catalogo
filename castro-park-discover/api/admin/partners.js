import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

const ALLOWED = ["place_id", "badge_label", "deal_description", "is_active"];

function pickAllowed(body) {
  return Object.fromEntries(Object.entries(body || {}).filter(([k]) => ALLOWED.includes(k)));
}

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("partners")
      .select("id, place_id, badge_label, deal_description, is_active, places(id, name, category)")
      .order("id");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const payload = pickAllowed(req.body);
    if (!payload.place_id) return res.status(400).json({ error: "place_id obrigatório" });
    const { data, error } = await supabase
      .from("partners")
      .insert(payload)
      .select("id, place_id, badge_label, deal_description, is_active, places(id, name, category)")
      .single();
    if (error) return res.status(500).json({ error: "Erro ao criar parceiro" });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const updates = pickAllowed(req.body);
    const { data, error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id)
      .select("id, place_id, badge_label, deal_description, is_active, places(id, name, category)")
      .single();
    if (error) return res.status(500).json({ error: "Erro ao atualizar parceiro" });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Erro ao remover parceiro" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
