import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { PlaceSection } from "@/components/PlaceSection";
import { PlaceCard } from "@/components/PlaceCard";
import { ItineraryCard } from "@/components/ItineraryCard";
import { EventCard } from "@/components/EventCard";
import { HomeCarousel } from "@/components/HomeCarousel";
import { SkeletonGrid } from "@/components/PlaceCardSkeleton";
import { ConciergeChat } from "@/components/ConciergeChat";
import { IpeStripBanner } from "@/components/IpeStripBanner";
import { CONCIERGE_OPEN_EVENT } from "@/components/ConciergeFloat";
import { PartnerBadge } from "@/components/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Utensils, Coffee, Wine, TreePine, MapPin } from "lucide-react";
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
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = usePlaces();
  const { data: itineraries } = useItineraries();
  const { data: events } = useEvents();
  const { data: partners } = usePartners();
  const places = data?.places ?? [];
  const updatedAt = data?.updatedAt;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const [filters, setFilters] = useState<ListFilterState>({
    sortBy: "best",
    openNow: false,
    maxDistanceKm: null,
    maxPriceLevel: null,
    minRating: null,
  });

  const quickActions = [
    { labelKey: "home.quickActions.eat", category: "restaurants", icon: Utensils },
    { labelKey: "home.quickActions.coffee", category: "cafes", icon: Coffee },
    { labelKey: "home.quickActions.night", category: "nightlife", icon: Wine },
    { labelKey: "home.quickActions.tour", category: "nature", icon: TreePine },
    { labelKey: "home.quickActions.nearby", category: "all", icon: MapPin },
  ] as const;

  const CATEGORY_LABEL_KEYS: Record<string, string> = {
    nightlife: "categories.bars",
    cafes: "categories.cafes",
    restaurants: "categories.restaurants",
    nature: "categories.parksNature",
    attractions: "categories.attractions",
    culture: "categories.culture",
    shopping: "categories.shopping",
  };

  const totalCategories = useMemo(
    () => new Set(places.map((p) => p.category).filter(Boolean)).size,
    [places]
  );

  const baseCategoryResults = useMemo(() => {
    if (selectedCategory === "all") return [];
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  const subcategoryOptions = useMemo(() => {
    const list = selectedCategory !== "all" ? baseCategoryResults : [];

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
  }, [selectedCategory, baseCategoryResults]);

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
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />
      <Hero totalPlaces={places.length} totalCategories={totalCategories} updatedAt={updatedAt} />
      <div id="concierge-section">
        <ConciergeChat onOpenChat={() => window.dispatchEvent(new Event(CONCIERGE_OPEN_EVENT))} />
      </div>
      <IpeStripBanner />
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => {
          setSelectedCategory(value);
          setSelectedSubcategory(null);
        }}
      />

      <section className="border-b bg-background">
        <div className="container px-4 py-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-hotel-gold/70">
            {t("home.exploreGoiania")}
          </p>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {quickActions.map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.category;
              return (
                <button
                  key={item.labelKey}
                  onClick={() => {
                    setSelectedSubcategory(null);
                    setSelectedCategory(item.category);
                  }}
                  className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-background border-hotel-gold/20 text-muted-foreground hover:border-hotel-gold/50 hover:text-foreground hover:bg-hotel-gold/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-hotel-gold" : ""}`} />
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {!isLoading && !isError && selectedCategory !== "all" && subcategoryOptions.length > 0 && (
        <section className="border-b bg-background">
          <div className="container px-4 py-3">
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t("home.types")}</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <Button
                size="sm"
                variant={selectedSubcategory === null ? "default" : "secondary"}
                className="shrink-0"
                onClick={() => setSelectedSubcategory(null)}
              >
                {t("home.all")}
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

      {!isLoading && !isError && selectedCategory !== "all" && (
        <ListFilters value={filters} onChange={setFilters} />
      )}

      {isLoading && (
        <main className="container px-4 py-10">
          <SkeletonGrid count={8} />
        </main>
      )}

      {isError && (
        <main className="container px-4 py-10">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("home.loadError")} {error instanceof Error ? error.message : t("home.loadErrorRetry")}
          </div>
        </main>
      )}

      {!isLoading && !isError && (
        <main>
          {selectedCategory !== "all" ? (
            <section className="py-8">
              <div className="container px-4">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold md:text-3xl capitalize">
                      {CATEGORY_LABEL_KEYS[selectedCategory]
                        ? t(CATEGORY_LABEL_KEYS[selectedCategory])
                        : t("home.places")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("home.placesFound", { count: categoryResults.length })}
                    </p>
                  </div>
                  <button
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedSubcategory(null);
                      setFilters({ sortBy: "best", openNow: false, maxDistanceKm: null, maxPriceLevel: null, minRating: null });
                    }}
                  >
                    {t("home.seeAll")}
                  </button>
                </div>

                {categoryResults.length === 0 ? (
                  <div className="rounded-md border border-border p-6 text-center text-muted-foreground">
                    {t("home.noCategoryResults")}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categoryResults.slice(0, 60).map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        partner={partners?.find((p) => p.placeId === place.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              {/* Roteiros Temáticos */}
              {itineraries && itineraries.length > 0 && (
                <section className="py-10 border-b overflow-hidden">
                  <div className="container px-4">
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-px w-8 bg-hotel-gold/60" />
                          <span className="text-hotel-gold text-xs">✦</span>
                          <div className="h-px w-8 bg-hotel-gold/60" />
                        </div>
                        <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                          {t("home.thematicItineraries")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("home.thematicItinerariesSubtitle")}
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => navigate("/itineraries")}
                      >
                        {t("home.seeAllItineraries")}
                      </button>
                    </div>
                    <HomeCarousel
                      label={t("home.thematicItineraries")}
                      autoplayDelay={2800}
                      slideBasis="basis-[85%] sm:basis-[48%] lg:basis-[34%]"
                      containerHeight="h-[235px] md:h-[250px]"
                      items={itineraries.map((itinerary) => (
                        <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                      ))}
                    />
                  </div>
                </section>
              )}

              {/* Eventos em Goiânia */}
              {events && events.length > 0 && (
                <section className="py-10 border-b overflow-hidden">
                  <div className="container px-4">
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-px w-8 bg-hotel-gold/60" />
                          <span className="text-hotel-gold text-xs">✦</span>
                          <div className="h-px w-8 bg-hotel-gold/60" />
                        </div>
                        <h2 className="font-serif text-2xl font-semibold md:text-3xl">
                          {t("home.eventsInGoiania")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("home.eventsSubtitle")}
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => navigate("/events")}
                      >
                        {t("home.seeSchedule")}
                      </button>
                    </div>
                    <HomeCarousel
                      label={t("home.eventsInGoiania")}
                      autoplayDelay={2800}
                      slideBasis="basis-[85%] sm:basis-[48%] lg:basis-[34%]"
                      items={events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    />
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
                        {t("home.hotelPartners")}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("home.hotelPartnersSubtitle")}
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

              {/* Recomendados — seção dark premium */}
              <div id="recomendados-section">
                <section className="py-12 bg-primary text-primary-foreground overflow-hidden">
                  <div className="container px-4">
                    <div className="mb-8 text-center">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="h-px w-10 bg-hotel-gold/50" />
                        <span className="text-hotel-gold text-sm">✦</span>
                        <div className="h-px w-10 bg-hotel-gold/50" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.3em] text-hotel-gold/80 mb-3">
                        {t("home.hotelSelection")}
                      </p>
                      <h2 className="font-serif text-3xl font-semibold md:text-4xl mb-2">
                        {t("home.hotelRecommended")}
                      </h2>
                      <p className="font-serif italic text-primary-foreground/60 text-sm md:text-base max-w-md mx-auto">
                        {t("home.hotelSelectionSubtitle")}
                      </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {curatedTop.map((place) => (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          partner={partners?.find((p) => p.placeId === place.id)}
                        />
                      ))}
                    </div>
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => navigate("/recomendados")}
                        className="inline-flex items-center gap-2 rounded-full border border-hotel-gold/40 bg-hotel-gold/10 px-6 py-2.5 text-sm font-medium text-hotel-gold hover:bg-hotel-gold/20 hover:border-hotel-gold/60 transition-all duration-200"
                      >
                        <span className="text-hotel-gold text-xs">✦</span>
                        {t("home.seeAllRecommended")}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              <PlaceSection
                title={t("home.nearbyHotel")}
                subtitle={t("home.nearbySubtitle")}
                places={nearHotel}
                partners={partners}
              />
              <PlaceSection
                title={t("home.restaurants")}
                subtitle={t("home.restaurantsSubtitle")}
                places={topRestaurants}
                partners={partners}
              />
              <PlaceSection
                title={t("home.bars")}
                subtitle={t("home.barsSubtitle")}
                places={topBars}
                partners={partners}
              />
              <PlaceSection
                title={t("home.cafes")}
                subtitle={t("home.cafesSubtitle")}
                places={topCafes}
                partners={partners}
              />
              <PlaceSection
                title={t("home.attractionsParks")}
                subtitle={t("home.attractionsParksSubtitle")}
                places={topAttractionsAndParks}
                partners={partners}
              />

              <footer className="border-t bg-primary text-primary-foreground py-12">
                <div className="container px-4 text-center">
                  <div className="mb-5 flex items-center justify-center gap-3">
                    <div className="h-px w-12 bg-hotel-gold/30" />
                    <span className="text-hotel-gold/60 text-sm">✦</span>
                    <div className="h-px w-12 bg-hotel-gold/30" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-white mb-1">
                    {t("footer.hotelName")}
                  </p>
                  <p className="text-xs text-primary-foreground/50 tracking-[0.2em] uppercase mb-4">
                    {t("footer.tagline")}
                  </p>
                  <p className="text-xs text-primary-foreground/40">
                    {t("footer.address")}
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
