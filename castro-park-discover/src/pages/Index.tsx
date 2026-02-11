import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { PlaceSection } from "@/components/PlaceSection";
import { PlaceCard } from "@/components/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";
import { Place } from "@/types/place";

const byBest = (a: Place, b: Place) => {
  const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;

  const reviewDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  if (reviewDiff !== 0) return reviewDiff;

  return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
};

const Index = () => {
  const { data: places = [], isLoading, isError, error } = usePlaces();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [filters, setFilters] = useState<ListFilterState>({
    sortBy: "best",
    openNow: false,
    maxDistanceKm: null,
    maxPriceLevel: null,
    minRating: null,
  });

  const normalizedQuery = query.trim().toLowerCase();

  const totalCategories = useMemo(
    () => new Set(places.map((p) => p.category).filter(Boolean)).size,
    [places]
  );

  // categoryResults is computed after applying filters

  const baseSearchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return places
      .filter((p) => {
        const haystack = [p.name, p.address, p.description, ...(p.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [places, normalizedQuery]);

  const baseCategoryResults = useMemo(() => {
    if (selectedCategory === "all") return [];
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  const applyFilters = (list: Place[]) => {
    let out = list;

    if (filters.openNow) {
      out = out.filter((p) => (p.openStatusText || "").toLowerCase().includes("aberto"));
    }

    if (filters.maxDistanceKm !== null) {
      out = out.filter((p) => Number.isFinite(p.distanceKm) && (p.distanceKm ?? 999) <= filters.maxDistanceKm!);
    }

    if (filters.maxPriceLevel !== null) {
      out = out.filter((p) => Number.isFinite(p.priceLevel) && (p.priceLevel ?? 0) > 0 && (p.priceLevel ?? 0) <= filters.maxPriceLevel!);
    }

    if (filters.minRating !== null) {
      out = out.filter((p) => (p.rating ?? 0) >= filters.minRating!);
    }

    const sorted = [...out];
    if (filters.sortBy === "distance") {
      sorted.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else if (filters.sortBy === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (filters.sortBy === "reviews") {
      sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else {
      sorted.sort(byBest);
    }

    return sorted;
  };

  const searchResults = useMemo(() => applyFilters(baseSearchResults), [baseSearchResults, filters]);
  const categoryResults = useMemo(() => applyFilters(baseCategoryResults), [baseCategoryResults, filters]);

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
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => {
          setSelectedCategory(value);
          // Se o usuário trocar de categoria, limpamos a busca para evitar confusão.
          setQuery("");
        }}
      />

      {/* Filtros só fazem sentido quando o usuário está vendo uma lista */}
      {!isLoading && !isError && (normalizedQuery || selectedCategory !== "all") && (
        <ListFilters value={filters} onChange={setFilters} />
      )}

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
                    onClick={() => {
                      setQuery("");
                      setFilters({
                        sortBy: "best",
                        openNow: false,
                        maxDistanceKm: null,
                        maxPriceLevel: null,
                        minRating: null,
                      });
                    }}
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
          ) : selectedCategory !== "all" ? (
            <section className="py-8">
              <div className="container px-4">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold capitalize md:text-2xl">
                      {selectedCategory === "nightlife"
                        ? "Bares"
                        : selectedCategory === "cafes"
                          ? "Cafés"
                          : selectedCategory === "restaurants"
                            ? "Restaurantes"
                            : selectedCategory === "nature"
                              ? "Parques & Natureza"
                              : selectedCategory === "attractions"
                                ? "Atrações"
                                : selectedCategory === "culture"
                                  ? "Cultura"
                                  : selectedCategory === "shopping"
                                    ? "Compras"
                                    : "Lugares"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {categoryResults.length} lugares encontrados
                    </p>
                  </div>
                  <button
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setSelectedCategory("all");
                      setFilters({
                        sortBy: "best",
                        openNow: false,
                        maxDistanceKm: null,
                        maxPriceLevel: null,
                        minRating: null,
                      });
                    }}
                  >
                    Ver tudo
                  </button>
                </div>

                {categoryResults.length === 0 ? (
                  <div className="rounded-md border border-border p-6 text-center text-muted-foreground">
                    Nenhum resultado para esta categoria no momento.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryResults.slice(0, 60).map((place) => (
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
