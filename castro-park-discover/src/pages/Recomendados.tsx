import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/PlaceCard";
import { SkeletonGrid } from "@/components/PlaceCardSkeleton";
import { Button } from "@/components/ui/button";
import { usePlaces } from "@/hooks/usePlaces";
import { usePartners } from "@/hooks/usePartners";

const Recomendados = () => {
  const navigate = useNavigate();
  const { data, isLoading } = usePlaces();
  const { data: partners } = usePartners();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const recomendados = useMemo(
    () =>
      (data?.places ?? [])
        .filter((p) => p.hotelRecommended)
        .sort((a, b) => (b.hotelScore ?? 0) - (a.hotelScore ?? 0)),
    [data]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of recomendados) {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [recomendados]);

  const filtered = useMemo(
    () =>
      selectedCategory === "all"
        ? recomendados
        : recomendados.filter((p) => p.category === selectedCategory),
    [recomendados, selectedCategory]
  );

  const CATEGORY_LABELS: Record<string, string> = {
    restaurants: "Restaurantes",
    cafes: "Cafés",
    nightlife: "Bares",
    attractions: "Atrações",
    nature: "Parques",
    culture: "Cultura",
    shopping: "Compras",
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hotel-charcoal py-16 md:py-24 text-white">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-hotel-gold/60" />
              <span className="text-hotel-gold text-lg">✦</span>
              <div className="h-px w-16 bg-hotel-gold/60" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-hotel-gold/40 bg-hotel-gold/10 px-4 py-1.5 mb-5">
              <span className="text-xs font-medium text-hotel-gold tracking-wider uppercase">
                Seleção do Hotel
              </span>
            </div>
            <h1 className="font-serif text-4xl font-semibold sm:text-5xl mb-4 leading-tight">
              Os favoritos do<br className="hidden sm:block" /> Castro's Park
            </h1>
            <p className="font-serif italic text-white/60 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Uma curadoria criteriosamente selecionada para tornar cada momento da sua estadia em Goiânia inesquecível
            </p>
            {!isLoading && (
              <p className="mt-5 text-xs text-hotel-gold/60 tracking-widest uppercase">
                {recomendados.length} lugares selecionados
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Filtros */}
      {!isLoading && categories.length > 1 && (
        <section className="border-b bg-background sticky top-16 z-40">
          <div className="container px-4 py-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                  selectedCategory === "all"
                    ? "bg-hotel-gold text-hotel-charcoal border-hotel-gold"
                    : "border-hotel-gold/30 text-muted-foreground hover:border-hotel-gold/60 hover:text-foreground"
                }`}
              >
                Todos ({recomendados.length})
              </button>
              {categories.map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
                    selectedCategory === cat
                      ? "bg-hotel-gold text-hotel-charcoal border-hotel-gold"
                      : "border-hotel-gold/30 text-muted-foreground hover:border-hotel-gold/60 hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat] ?? cat} ({count})
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <main className="container px-4 py-8">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="font-serif italic">Nenhum lugar encontrado nesta categoria.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  partner={partners?.find((p) => p.placeId === place.id)}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao guia completo
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Recomendados;
