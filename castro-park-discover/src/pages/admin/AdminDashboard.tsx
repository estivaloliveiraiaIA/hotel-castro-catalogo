import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Map, Handshake, ArrowRight, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminApi } from "@/hooks/useAdminApi";

interface Stats {
  places: number;
  places_active: number;
  places_recommended: number;
  events: number;
  itineraries: number;
  partners: number;
}

interface QaStats {
  total: number;
  excellent: number;
  good: number;
  regular: number;
  critical: number;
  needsAttention: number;
  avgScore: number;
  topIssues: { issue: string; count: number }[];
  worst: { id: string; name: string; score: number; issues: string[] }[];
}

const sections = [
  { label: "Lugares", key: "places" as const, icon: MapPin, to: "/admin/places", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Eventos", key: "events" as const, icon: Calendar, to: "/admin/events", color: "text-green-600", bg: "bg-green-50" },
  { label: "Roteiros", key: "itineraries" as const, icon: Map, to: "/admin/itineraries", color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Parceiros", key: "partners" as const, icon: Handshake, to: "/admin/partners", color: "text-amber-600", bg: "bg-amber-50" },
];

function QaScoreBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-medium text-foreground">{count}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const api = useAdminApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [qa, setQa] = useState<QaStats | null>(null);
  const [qaLoading, setQaLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => setError("Falha ao carregar estatísticas"));

    api.get<QaStats>("/api/admin/qa-score")
      .then(setQa)
      .catch(() => {})
      .finally(() => setQaLoading(false));
  }, []);

  const qaColor = qa
    ? qa.avgScore >= 90 ? "text-green-600"
    : qa.avgScore >= 70 ? "text-blue-600"
    : qa.avgScore >= 50 ? "text-amber-600"
    : "text-red-600"
    : "text-muted-foreground";

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do guia digital do hotel</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {sections.map(({ label, key, icon: Icon, to, color, bg }) => (
          <Link key={key} to={to}>
            <Card className="hover:shadow-md hover:border-hotel-gold/30 transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-foreground">
                  {stats ? stats[key].toLocaleString("pt-BR") : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {key === "places" && stats && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 space-x-2">
                    <span className="text-green-600">{stats.places_active} ativos</span>
                    <span>·</span>
                    <span className="text-amber-600">{stats.places_recommended} recomendados</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Card de Qualidade (QA) ──────────────────────────────────── */}
      <Card className="mb-6 border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50">
                <ShieldCheck className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">Qualidade dos Lugares</CardTitle>
                <p className="text-xs text-muted-foreground">Foto, descrição, horários, site e cardápio</p>
              </div>
            </div>
            {qa && !qaLoading && (
              <div className="text-right">
                <p className={cn("text-3xl font-bold", qaColor)}>{qa.avgScore}</p>
                <p className="text-[11px] text-muted-foreground">score médio</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {qaLoading ? (
            <p className="text-xs text-muted-foreground/60 text-center py-4">Analisando {stats?.places_active ?? "..."} lugares...</p>
          ) : qa ? (
            <>
              {/* Distribuição de scores */}
              <div className="space-y-2">
                <QaScoreBar label="Excelente" count={qa.excellent} total={qa.total} color="bg-green-500" />
                <QaScoreBar label="Bom" count={qa.good} total={qa.total} color="bg-blue-500" />
                <QaScoreBar label="Regular" count={qa.regular} total={qa.total} color="bg-amber-400" />
                <QaScoreBar label="Crítico" count={qa.critical} total={qa.total} color="bg-red-500" />
              </div>

              {/* Alerta de lugares que precisam de atenção */}
              {qa.needsAttention > 0 && (
                <Link
                  to="/admin/places?qa=low"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 hover:border-red-400 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-700">
                      {qa.needsAttention} lugar{qa.needsAttention !== 1 ? "es" : ""} precisam de atenção
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                </Link>
              )}

              {/* Top issues */}
              {qa.topIssues.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Campos mais ausentes
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {qa.topIssues.map(({ issue, count }) => (
                      <div key={issue} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/60 text-xs">
                        <span className="text-muted-foreground capitalize truncate">{issue}</span>
                        <span className="font-semibold text-foreground ml-2 shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {qa.needsAttention === 0 && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                  Todos os lugares estão com qualidade boa ou excelente ✓
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground/60 text-center py-4">Não foi possível carregar dados de qualidade</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sections.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between px-4 py-3 rounded-lg border hover:border-hotel-gold/40 hover:bg-hotel-gold/5 transition-colors group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="w-4 h-4 text-muted-foreground" />
                Gerenciar {label}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-hotel-gold transition-colors" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
