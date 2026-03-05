import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      localStorage.setItem("admin_token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Ornamento de topo */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-hotel-gold/40" />
          <span className="text-hotel-gold text-base">✦</span>
          <div className="h-px w-12 bg-hotel-gold/40" />
        </div>

        <Card className="shadow-lg border-hotel-gold/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-serif font-semibold tracking-wider">CP</span>
            </div>
            <CardTitle className="font-serif text-xl">Castro's Park Hotel</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">Painel Administrativo</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="password">Senha de acesso</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  className="focus-visible:border-hotel-gold/40 focus-visible:ring-hotel-gold/20"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
