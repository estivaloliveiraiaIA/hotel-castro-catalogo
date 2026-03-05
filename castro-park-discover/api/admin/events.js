import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const ALLOWED = ["title", "description", "location", "image", "start_date", "end_date", "link", "is_active"];
    const payload = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => ALLOWED.includes(k)));
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Erro ao criar evento" });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const ALLOWED = ["title", "description", "location", "image", "start_date", "end_date", "link", "is_active"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.includes(k)));
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Erro ao atualizar evento" });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Erro ao remover evento" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
