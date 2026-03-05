import { createToken } from "../_lib/auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!password || password !== expected) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  return res.status(200).json({ token: createToken() });
}
