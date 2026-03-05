import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Map, Handshake, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminApi } from "@/hooks/useAdminApi";

interface Stats {
  places: number;
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do guia digital do hotel</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sections.map(({ label, key, icon: Icon, to, color, bg }) => (
          <Link key={key} to={to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-gray-800">
                  {stats ? stats[key].toLocaleString("pt-BR") : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
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
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Icon className="w-4 h-4 text-gray-400" />
                Gerenciar {label}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
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
