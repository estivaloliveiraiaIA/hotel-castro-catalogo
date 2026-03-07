import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Map, Handshake, ArrowRight } from "lucide-react";
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

const sections = [
  { label: "Lugares", key: "places" as const, icon: MapPin, to: "/admin/places", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Eventos", key: "events" as const, icon: Calendar, to: "/admin/events", color: "text-green-600", bg: "bg-green-50" },
  { label: "Roteiros", key: "itineraries" as const, icon: Map, to: "/admin/itineraries", color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Parceiros", key: "partners" as const, icon: Handshake, to: "/admin/partners", color: "text-amber-600", bg: "bg-amber-50" },
];

export default function AdminDashboard() {
  const api = useAdminApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => setError("Falha ao carregar estatísticas"));
  }, []);

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
