import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("hotel_knowledge")
      .select("id, topic, content, keywords")
      .order("id");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { topic, content, keywords } = req.body || {};
    if (!topic || !content) return res.status(400).json({ error: "topic e content obrigatórios" });
    const { data, error } = await supabase
      .from("hotel_knowledge")
      .insert({ topic, content, keywords: keywords || [] })
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Erro ao criar chunk" });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id, topic, content, keywords } = req.body || {};
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    if (!topic || !content) return res.status(400).json({ error: "topic e content obrigatórios" });
    const { data, error } = await supabase
      .from("hotel_knowledge")
      .update({ topic, content, keywords })
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Erro ao atualizar chunk" });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("hotel_knowledge").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Erro ao remover chunk" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
