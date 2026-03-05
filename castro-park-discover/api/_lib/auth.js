import { timingSafeEqual } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD env var não configurada");

export function createToken() {
  return Buffer.from("admin:" + ADMIN_PASSWORD).toString("base64");
}

export function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace(/^Bearer\s+/, "");
  if (!token) return false;
  try {
    const expected = createToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unauthorized(res) {
  return res.status(401).json({ error: "Não autorizado" });
}
