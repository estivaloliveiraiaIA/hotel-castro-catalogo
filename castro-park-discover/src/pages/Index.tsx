import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { PlaceSection } from "@/components/PlaceSection";
import { PlaceCard } from "@/components/PlaceCard";
import { ItineraryCard } from "@/components/ItineraryCard";
import { EventCard } from "@/components/EventCard";
import { ConciergeChat } from "@/components/ConciergeChat";
import { PartnerBadge } from "@/components/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { usePlaces } from "@/hooks/usePlaces";
import { useItineraries } from "@/hooks/useItineraries";
import { useEvents } from "@/hooks/useEvents";
import { usePartners } from "@/hooks/usePartners";
import { Place } from "@/types/place";
import { useNavigate } from "react-router-dom";

const byBest = (a: Place, b: Place) => {
  const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;

  const reviewDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  if (reviewDiff !== 0) return reviewDiff;

  return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
};

const Index = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = usePlaces();
  const { data: itineraries } = useItineraries();
  const { data: events } = useEvents();
  const { data: partners } = usePartners();
  const places = data?.places ?? [];
  const updatedAt = data?.updatedAt;
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const [filters, setFilters] = useState<ListFilterState>({
    sortBy: "best",
    openNow: false,
    maxDistanceKm: null,
    maxPriceLevel: null,
    minRating: null,
  });

  const normalizedQuery = query.trim().toLowerCase();

  const quickActions = [
    { label: "🍽️ Comer bem", category: "restaurants" },
    { label: "☕ Café", category: "cafes" },
    { label: "🍸 Noite", category: "nightlife" },
    { label: "🌳 Passeio", category: "nature" },
    { label: "📍 Perto do hotel", category: "all" },
  ] as const;

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

  const subcategoryOptions = useMemo(() => {
    const list = normalizedQuery
      ? baseSearchResults
      : selectedCategory !== "all"
        ? baseCategoryResults
        : [];

    const counts = new Map<string, number>();
    for (const p of list) {
      for (const sub of p.subcategories || []) {
        if (!sub) continue;
        counts.set(sub, (counts.get(sub) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
      .slice(0, 12);
  }, [normalizedQuery, selectedCategory, baseSearchResults, baseCategoryResults]);

  const applyFilters = (list: Place[]) => {
    let out = list;

    if (selectedSubcategory) {
      out = out.filter((p) => (p.subcategories || []).includes(selectedSubcategory));
    }

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

  const searchResults = useMemo(() => applyFilters(baseSearchResults), [baseSearchResults, filters, selectedSubcategory]);
  const categoryResults = useMemo(() => applyFilters(baseCategoryResults), [baseCategoryResults, filters, selectedSubcategory]);

  const curatedTop = useMemo(
    () =>
      places
        .filter((p) => p.hotelRecommended)
        .sort((a, b) => (b.hotelScore ?? 0) - (a.hotelScore ?? 0))
        .slice(0, 12),
    [places]
  );

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
      <Header
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          setSelectedSubcategory(null);
        }}
      />
      <Hero totalPlaces={places.length} totalCategories={totalCategories} updatedAt={updatedAt} />
      <ConciergeChat places={places} />
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => {
          setSelectedCategory(value);
          setSelectedSubcategory(null);
          // Se o usuário trocar de categoria, limpamos a busca para evitar confusão.
          setQuery("");
        }}
      />

      <section className="border-b bg-muted/10">
        <div className="container px-4 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-hotel-gold/80">Explorar Goiânia</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {quickActions.map((item) => (
              <Button
                key={item.label}
                variant={selectedCategory === item.category ? "default" : "secondary"}
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setQuery("");
                  setSelectedSubcategory(null);
                  setSelectedCategory(item.category);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Subcategorias só fazem sentido quando o usuário está vendo uma lista */}
      {!isLoading && !isError && (normalizedQuery || selectedCategory !== "all") && subcategoryOptions.length > 0 && (
        <section className="border-b bg-background">
          <div className="container px-4 py-3">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Tipos</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <Button
                size="sm"
                variant={selectedSubcategory === null ? "default" : "secondary"}
                className="shrink-0"
                onClick={() => setSelectedSubcategory(null)}
              >
                Todos
              </Button>
              {subcategoryOptions.map((opt) => (
                <Button
                  key={opt.name}
                  size="sm"
                  variant={selectedSubcategory === opt.name ? "default" : "secondary"}
                  className="shrink-0"
                  onClick={() => setSelectedSubcategory(opt.name)}
                >
                  {opt.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

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
                    <h2 className="font-serif text-2xl font-semibold md:text-3xl">Resultados</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Buscando por: <span className="font-medium">{query}</span>
                    </p>
                  </div>
                  <button
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setQuery("");
                      setSelectedSubcategory(null);
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
                    <h2 className="font-serif text-2xl font-semibold md:text-3xl capitalize">
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
                      setSelectedSubcategory(null);
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
              {/* Roteiros Tematicos */}
              {itineraries && itineraries.length > 0 && (
                <section className="py-8 border-b">
                  <div className="container px-4">
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-px w-8 bg-hotel-gold/60" />
                          <span className="text-hotel-gold text-xs">✦</span>
                          <div className="h-px w-8 bg-hotel-gold/60" />
                        </div>
                        <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                          Roteiros Temáticos
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Experiências prontas selecionadas pelo hotel
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => navigate("/itineraries")}
                      >
                        Ver todos
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {itineraries.slice(0, 3).map((itinerary) => (
                        <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Eventos em Goiânia */}
              {events && events.length > 0 && (
                <section className="py-8 border-b">
                  <div className="container px-4">
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-px w-8 bg-hotel-gold/60" />
                          <span className="text-hotel-gold text-xs">✦</span>
                          <div className="h-px w-8 bg-hotel-gold/60" />
                        </div>
                        <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                          Eventos em Goiânia
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          O que está acontecendo durante a sua estadia
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => navigate("/events")}
                      >
                        Ver agenda
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {events.slice(0, 3).map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Parceiros do Hotel */}
              {partners && partners.length > 0 && (
                <section className="py-8 border-b">
                  <div className="container px-4">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-px w-8 bg-hotel-gold/60" />
                        <span className="text-hotel-gold text-xs">✦</span>
                        <div className="h-px w-8 bg-hotel-gold/60" />
                      </div>
                      <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                        Parceiros do Hotel
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Benefícios exclusivos para hóspedes do Castro's Park
                      </p>
                    </div>
                    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {partners.map((partner) => (
                        <div key={partner.id} className="min-w-[260px] md:min-w-0">
                          <Card
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/place/${encodeURIComponent(partner.placeId)}`)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                navigate(`/place/${encodeURIComponent(partner.placeId)}`);
                              }
                            }}
                            className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 hover:border-hotel-gold/50"
                          >
                            {partner.place.image && (
                              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                                <img
                                  src={partner.place.image}
                                  alt={partner.place.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="mb-2">
                                <PartnerBadge label={partner.badgeLabel} size="sm" />
                              </div>
                              <h3 className="font-serif text-lg font-semibold leading-tight mb-1 group-hover:text-primary transition-colors">
                                {partner.place.name}
                              </h3>
                              {partner.place.rating && (
                                <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 fill-rating-star text-rating-star" />
                                  {partner.place.rating.toFixed(1)}
                                </div>
                              )}
                              {partner.dealDescription && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {partner.dealDescription}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <PlaceSection
                title="Recomendados pelo hotel"
                subtitle="Curadoria especial para uma experiência inesquecível em Goiânia"
                places={curatedTop}
              />
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

              <footer className="border-t bg-muted/20 py-10">
                <div className="container px-4 text-center">
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-hotel-gold/30" />
                    <span className="text-hotel-gold/50 text-sm">✦</span>
                    <div className="h-px w-12 bg-hotel-gold/30" />
                  </div>
                  <p className="font-serif text-base text-foreground/70 mb-1">
                    Castro&apos;s Park Hotel
                  </p>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    Guia exclusivo para hóspedes · Goiânia
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
