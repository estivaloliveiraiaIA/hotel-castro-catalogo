const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export function createToken() {
  return Buffer.from("admin:" + ADMIN_PASSWORD).toString("base64");
}

export function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace(/^Bearer\s+/, "");
  return token.length > 0 && token === createToken();
}

export function unauthorized(res) {
  return res.status(401).json({ error: "Não autorizado" });
}
