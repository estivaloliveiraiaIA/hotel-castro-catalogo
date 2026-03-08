import { useMemo, useState } from "react";
import { ArrowLeft, CalendarX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { Header } from "@/components/Header";
import { useEvents } from "@/hooks/useEvents";

const EventsSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-2xl bg-muted/40 animate-pulse aspect-[4/3]" />
    ))}
  </div>
);

const Events = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: events, isLoading } = useEvents();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!events) return [];
    const cats = new Set(events.map((e) => e.category).filter(Boolean) as string[]);
    return [...cats].sort();
  }, [events]);

  const filtered = useMemo(() => {
    if (!events) return [];
    if (!selectedCategory) return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.home")}
          </Button>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-hotel-gold/60" />
            <span className="text-hotel-gold text-xs">✦</span>
            <div className="h-px w-8 bg-hotel-gold/60" />
          </div>
          <h1 className="font-serif text-3xl font-semibold md:text-4xl mb-2">
            {t("events.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("events.subtitle")}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 mb-6">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "secondary"}
              className="shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              {t("events.all")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "secondary"}
                className="shrink-0"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {isLoading && <EventsSkeleton />}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <CalendarX className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-serif text-lg font-semibold text-foreground/70">
                {t("events.comingSoon")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("events.comingSoonSubtitle")}
              </p>
            </div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;
