import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PlaceSection } from "@/components/PlaceSection";
import { PlaceCard } from "@/components/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";
import { Place } from "@/types/place";

const byBest = (a: Place, b: Place) => {
  const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;
  return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
};

const Index = () => {
  const { data: places = [], isLoading, isError, error } = usePlaces();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const totalCategories = useMemo(
    () => new Set(places.map((p) => p.category).filter(Boolean)).size,
    [places]
  );

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return places
      .filter((p) => {
        const haystack = [
          p.name,
          p.address,
          p.description,
          ...(p.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort(byBest);
  }, [places, normalizedQuery]);

  const nearHotel = useMemo(
    () =>
      places
        .filter((p) => Number.isFinite(p.distanceKm))
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        .slice(0, 12),
    [places]
  );

  const topRestaurants = useMemo(
    () => places.filter((p) => p.category === "restaurants").sort(byBest).slice(0, 12),
    [places]
  );

  const topBars = useMemo(
    () => places.filter((p) => p.category === "nightlife").sort(byBest).slice(0, 12),
    [places]
  );

  const topCafes = useMemo(
    () => places.filter((p) => p.category === "cafes").sort(byBest).slice(0, 12),
    [places]
  );

  const topAttractionsAndParks = useMemo(
    () =>
      places
        .filter((p) => p.category === "attractions" || p.category === "nature")
        .sort(byBest)
        .slice(0, 12),
    [places]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header query={query} onQueryChange={setQuery} />
      <Hero totalPlaces={places.length} totalCategories={totalCategories} />

      {isLoading && (
        <main className="container px-4 py-10">
          <div className="text-muted-foreground">Carregando lugares...</div>
        </main>
      )}

      {isError && (
        <main className="container px-4 py-10">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Não foi possível carregar os lugares agora. {error instanceof Error ? error.message : "Tente novamente em instantes."}
          </div>
        </main>
      )}

      {!isLoading && !isError && (
        <main>
          {normalizedQuery ? (
            <section className="py-8">
              <div className="container px-4">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold md:text-2xl">Resultados</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Buscando por: <span className="font-medium">{query}</span>
                    </p>
                  </div>
                  <button
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setQuery("")}
                  >
                    Limpar busca
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="rounded-md border border-border p-6 text-center text-muted-foreground">
                    Nenhum resultado encontrado.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {searchResults.slice(0, 48).map((place) => (
                      <PlaceCard key={place.id} place={place} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              <PlaceSection
                title="Perto do hotel"
                subtitle="Sugestões a poucos minutos do Castro's Park Hotel"
                places={nearHotel}
              />
              <PlaceSection
                title="Restaurantes"
                subtitle="Os mais bem avaliados para almoço e jantar"
                places={topRestaurants}
              />
              <PlaceSection
                title="Bares"
                subtitle="Vida noturna e bons drinks"
                places={topBars}
              />
              <PlaceSection
                title="Cafés"
                subtitle="Cafeterias e lugares para um café especial"
                places={topCafes}
              />
              <PlaceSection
                title="Atrações & Parques"
                subtitle="Passeios, cultura e natureza"
                places={topAttractionsAndParks}
              />

              <footer className="border-t bg-muted/30 py-8">
                <div className="container px-4 text-center text-sm text-muted-foreground">
                  <p className="mb-2">
                    © {new Date().getFullYear()} Castro&apos;s Park Hotel - Todos os direitos reservados
                  </p>
                  <p>
                    Recomendações para tornar sua experiência em Goiânia inesquecível
                  </p>
                </div>
              </footer>
            </>
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
