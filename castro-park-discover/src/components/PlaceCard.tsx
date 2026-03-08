import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, DollarSign, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDirectionsUrl } from "@/lib/maps";
import { computeOpenStatus } from "@/lib/openStatus";
import { Place } from "@/types/place";
import { Partner } from "@/types/partner";
import { useNavigate } from "react-router-dom";
import { PartnerBadge } from "@/components/PartnerBadge";
import { FavoriteButton } from "@/components/FavoriteButton";

interface PlaceCardProps {
  place: Place;
  partner?: Partner;
}

export const PlaceCard = ({ place, partner }: PlaceCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fallbackImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";

  const [imgSrc, setImgSrc] = React.useState(place.image || fallbackImage);

  const directionsUrl = getDirectionsUrl(place);

  // Calcula status aberto em tempo real baseado nos horários do lugar
  const openStatus = React.useMemo(
    () => computeOpenStatus(place.hours),
    // Recalcula a cada vez que o componente monta — suficiente para uma sessão
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place.id]
  );

  const renderPriceLevel = (level: number) => {
    if (!level) return null;
    return (
      <div className="flex items-center gap-px">
        {Array.from({ length: 4 }, (_, i) => (
          <DollarSign
            key={i}
            className={cn(
              "h-3 w-3",
              i < level ? "text-hotel-gold/90" : "text-white/20"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/place/${encodeURIComponent(place.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/place/${encodeURIComponent(place.id)}`);
        }
      }}
      className="group overflow-hidden transition-all duration-500 hover:shadow-[0_12px_48px_-8px_hsl(var(--hotel-gold)/0.30)] hover:border-hotel-gold/50 cursor-pointer border-border/60"
    >
      {/* Imagem com overlay editorial */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imgSrc}
          alt={place.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />

        {/* Gradient overlay editorial — forte na base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Badges topo-esquerda */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {place.hotelRecommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-hotel-gold px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-black shadow-md">
              ✦ Hotel
            </span>
          )}
          {partner && (
            <PartnerBadge
              label={partner.badgeLabel}
              size="sm"
              className="bg-black/50 backdrop-blur border-white/20 text-white"
            />
          )}
        </div>

        {/* Favorito topo-direita */}
        <FavoriteButton placeId={place.id} className="absolute right-3 top-3" />

        {/* Status aberto — calculado em tempo real */}
        {openStatus && (
          <span
            aria-label={openStatus.label}
            className={`absolute right-3 bottom-[5.5rem] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm border ${
              openStatus.isOpen
                ? "bg-black/50 text-green-400 border-green-500/30"
                : "bg-black/50 text-red-400/90 border-red-500/20"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400/80"}`} />
            {openStatus.label}
          </span>
        )}

        {/* Conteúdo editorial sobre a imagem — base */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-xl font-semibold leading-tight text-white mb-1.5 group-hover:text-hotel-gold/90 transition-colors duration-300">
            {place.name}
          </h3>
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-rating-star text-rating-star" />
              <span className="text-sm font-semibold text-white">
                {Number.isFinite(place.rating) ? place.rating.toFixed(1) : "—"}
              </span>
              {place.reviewCount ? (
                <span className="text-[11px] text-white/50">({place.reviewCount})</span>
              ) : null}
            </div>

            {/* Distância */}
            {place.distanceKm && (
              <div className="flex items-center gap-1 text-hotel-gold/90 text-xs font-medium">
                <Navigation className="h-3 w-3" />
                {place.distanceKm} km
              </div>
            )}

            {/* Preço */}
            {renderPriceLevel(place.priceLevel ?? 0)}
          </div>
        </div>
      </div>

      {/* Conteúdo mínimo abaixo da imagem */}
      <CardContent className="p-3.5">
        <div className="mb-2.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-hotel-gold/60" />
          <span className="line-clamp-1">{place.address}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {place.subcategories?.[0] &&
              !["Restaurante", "Bar & Noite", "Atração", "Cultura", "Compras", "Ao ar livre", "Café"].includes(
                place.subcategories[0]
              ) && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-hotel-gold/20 text-muted-foreground">
                  {place.subcategories[0]}
                </Badge>
              )}
            {(place.tags || []).slice(0, 1).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Como chegar — link elegante */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-hotel-gold/70 hover:text-hotel-gold transition-colors"
          >
            <Navigation className="h-3 w-3" />
            {t("place.getDirections")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
