import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, ArrowLeft, ExternalLink, Globe, Phone, Clock, Tag, Star, Navigation } from "lucide-react";
import { usePlaces } from "@/hooks/usePlaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceGallery } from "@/components/PlaceGallery";
import { getDirectionsUrl } from "@/lib/maps";

const Place = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePlaces();
  const places = data?.places ?? [];

  const place = useMemo(() => places.find((p) => encodeURIComponent(p.id) === id), [id, places]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Carregando lugar...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="max-w-lg">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-lg font-semibold">Lugar não encontrado</p>
            <p className="text-sm text-muted-foreground">
              Não localizamos este estabelecimento na base offline. Recarregue ou volte para a lista.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Voltar
              </Button>
              <Button onClick={() => navigate("/")}>Ir para início</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gallery is now handled by PlaceGallery (mosaic + full-screen carousel).

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Castro&apos;s Park Hotel</p>
              <p className="text-base font-semibold">Guia de Goiânia • Detalhes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Star className="mr-1 h-4 w-4 fill-rating-star text-rating-star" />
              {place.rating.toFixed(1)} ({place.reviewCount})
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PlaceGallery name={place.name} image={place.image} gallery={place.gallery} />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{place.category}</Badge>
                    {place.hotelRecommended && (
                      <Badge className="bg-hotel-gold text-hotel-charcoal hover:bg-hotel-gold/90">Recomendado pelo hotel</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold leading-tight">{place.name}</h1>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {place.address}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-muted-foreground">Preço</p>
                  <p className="text-lg">{place.priceText || "Não informado"}</p>
                </div>
              </div>

              {place.openStatusText && (
                <Badge className="bg-green-600 text-primary-foreground">
                  {place.openStatusText}
                </Badge>
              )}

              <p className="text-base leading-relaxed text-foreground/90">{place.description}</p>

              <div className="flex flex-wrap gap-2">
                {(place.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {place.reviews && place.reviews.length > 0 && (
              <div className="space-y-3 rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold">O que dizem</p>
                <ul className="space-y-2">
                  {place.reviews.slice(0, 4).map((review, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      “{review.text}”{" "}
                      {review.url && (
                        <a
                          href={review.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          ver mais
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-semibold">Informações</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-rating-star" />
                    <span>{place.rating.toFixed(1)} ({place.reviewCount} avaliações)</span>
                  </div>
                  {place.openStatusText && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{place.openStatusText}</span>
                    </div>
                  )}
                  {place.menuUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a className="underline" href={place.menuUrl} target="_blank" rel="noreferrer">
                        Menu
                      </a>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a className="underline" href={place.website} target="_blank" rel="noreferrer">
                        Site oficial
                      </a>
                    </div>
                  )}
                  {place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{place.phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <a href={getDirectionsUrl(place)} target="_blank" rel="noreferrer">
                      <Navigation className="mr-2 h-4 w-4" />
                      Como chegar (Google Maps)
                    </a>
                  </Button>

                  {/* Removido: botão "Ver no Google Maps" ("Como chegar" já atende) */}

                  {place.sourceUrl && !place.sourceUrl.includes("google.com/maps") && (
                    <Button asChild variant="outline">
                      <a href={place.sourceUrl} target="_blank" rel="noreferrer">
                        Ver fonte <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar ao início
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Place;
