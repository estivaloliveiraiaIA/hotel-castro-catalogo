import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Users, MapPin, Navigation, Lightbulb } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { usePlaces } from "@/hooks/usePlaces";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDirectionsUrl } from "@/lib/maps";

const Itinerary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: itineraries, isLoading: loadingItineraries } = useItineraries();
  const { data: placesData, isLoading: loadingPlaces } = usePlaces();

  const itinerary = useMemo(
    () => itineraries?.find((i) => i.id === id),
    [itineraries, id]
  );

  const stops = useMemo(() => {
    if (!itinerary || !placesData) return [];
    return itinerary.places
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((stop) => ({
        ...stop,
        place: placesData.places.find((p) => p.id === stop.placeId) ?? null,
      }));
  }, [itinerary, placesData]);

  const isLoading = loadingItineraries || loadingPlaces;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando roteiro...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Roteiro nao encontrado</p>
          <Button onClick={() => navigate("/itineraries")}>Ver roteiros</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/itineraries")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Roteiros
          </Button>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Castro&apos;s Park Hotel</p>
            <p className="text-sm font-semibold line-clamp-1">{itinerary.icon} {itinerary.title}</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={itinerary.coverImage}
          alt={itinerary.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container px-0">
            <p className="text-4xl mb-2">{itinerary.icon}</p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-1">
              {itinerary.title}
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-3">{itinerary.subtitle}</p>
            <div className="flex flex-wrap gap-3 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {itinerary.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {itinerary.profile}
              </span>
              <span className="text-hotel-gold font-medium">{itinerary.bestTime}</span>
            </div>
          </div>
        </div>
      </section>

      <main className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-0">
            <h2 className="text-xl font-semibold mb-6">
              {stops.length} paradas neste roteiro
            </h2>

            {stops.map((stop, index) => (
              <div key={stop.placeId} className="relative flex gap-4">
                {/* Timeline line */}
                {index < stops.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                )}

                {/* Step number */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-hotel-gold bg-background text-sm font-bold text-hotel-gold">
                  {stop.order}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  {stop.suggestedTime && (
                    <Badge variant="outline" className="mb-2 text-xs text-muted-foreground border-hotel-gold/30">
                      <Clock className="mr-1 h-3 w-3" />
                      {stop.suggestedTime}
                    </Badge>
                  )}

                  {stop.place ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/place/${encodeURIComponent(stop.placeId)}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/place/${encodeURIComponent(stop.placeId)}`);
                        }
                      }}
                      className="group rounded-xl border bg-card p-4 hover:border-hotel-gold/40 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        {stop.place.image && (
                          <div className="hidden sm:block h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                            <img
                              src={stop.place.image}
                              alt={stop.place.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                              {stop.place.name}
                            </h3>
                            {stop.place.hotelRecommended && (
                              <Badge className="shrink-0 text-xs border border-hotel-gold/50 bg-hotel-gold/10 text-primary">
                                ✦ Hotel
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {stop.place.address}
                          </p>
                          {stop.note && (
                            <p className="mt-2 text-sm text-foreground/80 italic">
                              "{stop.note}"
                            </p>
                          )}
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-hotel-gold/50 text-primary hover:bg-hotel-gold/10 h-7 text-xs"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={getDirectionsUrl(stop.place)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Navigation className="mr-1 h-3 w-3" />
                                Como chegar
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Lugar nao disponivel</p>
                      {stop.note && (
                        <p className="mt-1 text-sm italic">"{stop.note}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tips sidebar */}
          <aside className="space-y-4">
            {itinerary.tips.length > 0 && (
              <div className="rounded-xl border bg-hotel-gold/5 border-hotel-gold/20 p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-hotel-gold" />
                  Dicas do concierge
                </h3>
                <ul className="space-y-2">
                  {itinerary.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-hotel-gold font-bold shrink-0">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border p-5 space-y-3">
              <h3 className="font-semibold text-sm">Outros roteiros</h3>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/itineraries")}
              >
                Ver todos os roteiros
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Explorar lugares
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Itinerary;
