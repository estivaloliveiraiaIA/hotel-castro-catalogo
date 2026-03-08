import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/PlaceCard";
import { SkeletonGrid } from "@/components/PlaceCardSkeleton";
import { BackgroundPaths } from "@/components/BackgroundPaths";
import { IpeHeroCard } from "@/components/IpeHeroCard";
import { Button } from "@/components/ui/button";
import { usePlaces } from "@/hooks/usePlaces";
import { usePartners } from "@/hooks/usePartners";

const HERO_IMAGES = ["/images/hero1.jpg", "/images/hero2.jpg"];
const SLIDE_INTERVAL = 10000;

const Recomendados = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading } = usePlaces();
  const { data: partners } = usePartners();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

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

  const CATEGORY_KEYS: Record<string, string> = {
    restaurants: "categories.restaurants",
    cafes: "categories.cafes",
    nightlife: "categories.bars",
    attractions: "categories.attractions",
    nature: "categories.parksNature",
    culture: "categories.culture",
    shopping: "categories.shopping",
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 text-white">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
            style={{ backgroundImage: `url('${src}')`, opacity: i === currentSlide ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <BackgroundPaths />
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">

            <div
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-hotel-gold/50 bg-hotel-gold/10 px-5 py-2 shadow-[0_0_18px_0_rgba(212,175,55,0.18)] animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="text-hotel-gold text-xs">✦</span>
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-hotel-gold">
                {t("recommended.hotelName")}
              </span>
              <span className="text-hotel-gold text-xs">✦</span>
            </div>

            <div
              className="mb-5 flex items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              <div className="h-px w-12 bg-hotel-gold/50" />
              <span className="text-hotel-gold/70 text-sm">✦</span>
              <div className="h-px w-12 bg-hotel-gold/50" />
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-full border border-hotel-gold/40 bg-hotel-gold/10 px-4 py-1.5 mb-5 animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              <span className="text-xs font-medium text-hotel-gold tracking-wider uppercase">
                {t("recommended.selectionTitle")}
              </span>
            </div>

            <h1
              className="font-serif text-4xl font-semibold sm:text-5xl mb-4 leading-tight animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              {t("recommended.favoritesTitle")}
            </h1>

            <p
              className="font-serif italic text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto animate-fade-up"
              style={{ animationDelay: "440ms" }}
            >
              {t("recommended.favoritesSubtitle")}
            </p>

            {!isLoading && (
              <p
                className="mt-5 text-xs text-hotel-gold/60 tracking-widest uppercase animate-fade-up"
                style={{ animationDelay: "560ms" }}
              >
                {t("recommended.selectedPlaces", { count: recomendados.length })}
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Restaurante Ipê — destaque principal */}
      <IpeHeroCard />

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
                {t("categories.allWithCount", { count: recomendados.length })}
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
                  {CATEGORY_KEYS[cat] ? t(CATEGORY_KEYS[cat]) : cat} ({count})
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
            <p className="font-serif italic">{t("recommended.noCategoryPlaces")}</p>
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
                {t("recommended.backToGuide")}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Recomendados;
