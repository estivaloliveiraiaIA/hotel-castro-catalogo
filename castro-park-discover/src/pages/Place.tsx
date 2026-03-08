import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin, ArrowLeft, ExternalLink, Globe, Phone,
  Star, Navigation, Clock, Mail, DollarSign, Tag, Sparkles
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { usePlaces } from "@/hooks/usePlaces";
import { usePartners } from "@/hooks/usePartners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceGallery } from "@/components/PlaceGallery";
import { PartnerBadge } from "@/components/PartnerBadge";
import { Header } from "@/components/Header";
import { getDirectionsUrl } from "@/lib/maps";
import { computeOpenStatus } from "@/lib/openStatus";

function getReviewSource(url?: string): string {
  if (!url) return "";
  if (url.includes("google")) return "via Google";
  if (url.includes("tripadvisor")) return "via TripAdvisor";
  return "ver avaliação";
}

function PriceLevel({ level }: { level: number }) {
  if (!level) return null;
  return (
    <div className="flex items-center gap-px">
      {Array.from({ length: 4 }, (_, i) => (
        <DollarSign
          key={i}
          className={`h-3.5 w-3.5 ${i < level ? "text-hotel-gold" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="h-px flex-1 bg-hotel-gold/20" />
      <span className="text-[10px] uppercase tracking-[0.25em] text-hotel-gold/60 font-medium">{label}</span>
      <div className="h-px flex-1 bg-hotel-gold/20" />
    </div>
  );
}

const Place = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { data, isLoading } = usePlaces();
  const { data: partners } = usePartners();
  const places = data?.places ?? [];

  const place = useMemo(() => places.find((p) => encodeURIComponent(p.id) === id), [id, places]);
  const partner = useMemo(() => partners?.find((p) => p.placeId === place?.id), [partners, place]);
  const openStatus = useMemo(() => computeOpenStatus(place?.hours), [place?.id]);

  const fallbackImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&auto=format&fit=crop";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 text-hotel-gold/60">
            <div className="h-px w-8 bg-hotel-gold/40" />
            <span className="text-sm">✦</span>
            <div className="h-px w-8 bg-hotel-gold/40" />
          </div>
          <p className="text-sm text-muted-foreground font-serif italic">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="max-w-lg">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-lg font-semibold">{t("place.notFound")}</p>
            <p className="text-sm text-muted-foreground">
              {t("place.notFoundDesc")}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.back")}</Button>
              <Button onClick={() => navigate("/")}>{t("common.home")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const heroImage = place.image || fallbackImage;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Header />

      {/* ── HERO FULL-BLEED ─────────────────────────────────────── */}
      <section className="relative h-[55vh] min-h-[340px] max-h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Topo: voltar + favorito */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("common.back")}
          </button>
          <FavoriteButton placeId={place.id} className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-full p-2" />
        </div>

        {/* Base: badges + nome + endereço */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 space-y-3">

          {/* Badges de status */}
          <div className="flex flex-wrap items-center gap-2">
            {place.hotelRecommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hotel-gold px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-black shadow-md">
                {t("place.hotelRecommended")}
              </span>
            )}
            {partner && (
              <PartnerBadge
                label={partner.badgeLabel}
                size="sm"
                className="bg-black/50 backdrop-blur border-white/20 text-white"
              />
            )}
            {openStatus && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-sm border ${
                openStatus.isOpen
                  ? "bg-black/50 text-green-400 border-green-500/30"
                  : "bg-black/50 text-red-400/90 border-red-500/20"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${openStatus.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400/80"}`} />
                {openStatus.label}
                {openStatus.closesAt && ` · ${t("place.closes", { time: openStatus.closesAt })}`}
              </span>
            )}
          </div>

          {/* Nome */}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-white drop-shadow-lg">
            {place.name}
          </h1>

          {/* Endereço + metadados inline */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-white/70 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-hotel-gold/70 shrink-0" />
              {place.address}
            </span>
            {place.distanceKm && (
              <span className="flex items-center gap-1 text-hotel-gold/90 font-medium">
                <Navigation className="h-3.5 w-3.5" />
                {t("place.distance", { distance: place.distanceKm })}
              </span>
            )}
            <PriceLevel level={place.priceLevel ?? 0} />
          </div>
        </div>
      </section>

      <main className="container px-4 py-8 space-y-8">

        {/* ── GALERIA ─────────────────────────────────────────────── */}
        <PlaceGallery name={place.name} image={place.image} gallery={place.gallery} />

        {/* ── VANTAGEM PARCEIRO ────────────────────────────────────── */}
        {partner?.dealDescription && (
          <div className="rounded-xl border border-hotel-gold/40 bg-hotel-gold/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-hotel-gold mb-1.5">
              {t("place.exclusiveGuest")}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{partner.dealDescription}</p>
          </div>
        )}

        {/* ── GRID PRINCIPAL ───────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Coluna esquerda — conteúdo editorial */}
          <div className="lg:col-span-2 space-y-8">

            {/* Sobre */}
            <section className="space-y-3">
              <SectionDivider label={t("place.about")} />
              <p className="text-base leading-relaxed text-foreground/85">{place.description}</p>
            </section>

            {/* Destaques */}
            {place.highlights && place.highlights.length > 0 && (
              <section className="space-y-3">
                <SectionDivider label={t("place.highlights")} />
                <div className="flex flex-wrap gap-2">
                  {place.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hotel-gold/30 bg-hotel-gold/5 px-3 py-1 text-xs font-medium text-foreground/80"
                    >
                      <Sparkles className="h-3 w-3 text-hotel-gold/70" />
                      {h}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Tags e subcategorias */}
            {((place.subcategories?.length ?? 0) > 0 || (place.tags?.length ?? 0) > 0) && (
              <section className="space-y-3">
                <SectionDivider label={t("place.categories")} />
                <div className="flex flex-wrap gap-2">
                  {(place.subcategories || []).map((sub) => (
                    <Badge key={sub} variant="secondary" className="font-medium">
                      {sub}
                    </Badge>
                  ))}
                  {(place.tags || []).map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1 border-hotel-gold/20">
                      <Tag className="h-3 w-3 text-hotel-gold/60" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Nota do hotel */}
            {place.notes && (
              <section className="space-y-3">
                <SectionDivider label={t("place.notes")} />
                <div className="rounded-xl border border-hotel-gold/25 bg-hotel-gold/5 px-5 py-4">
                  <p className="font-serif italic text-sm text-foreground/75 leading-relaxed">
                    "{place.notes}"
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Coluna direita — sidebar informações */}
          <aside className="space-y-4">

            {/* Card horários */}
            {place.hours && place.hours.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-hotel-gold/70" />
                  {t("place.hours")}
                </div>
                <ul className="space-y-1.5">
                  {place.hours.map((h, i) => {
                    const [day, ...rest] = h.split(/:\s*/);
                    const hours = rest.join(": ");
                    const isToday = (() => {
                      const todayIdx = new Date().toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase().split("-")[0];
                      return day.toLowerCase().startsWith(todayIdx.slice(0, 3));
                    })();
                    return (
                      <li key={i} className={`flex justify-between text-xs gap-3 ${isToday ? "text-hotel-gold font-semibold" : "text-muted-foreground"}`}>
                        <span className="shrink-0">{day}</span>
                        <span className="text-right">{hours || h}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Card contato + CTA */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <p className="text-sm font-semibold">{t("place.contactAccess")}</p>

              <div className="space-y-2.5 text-sm text-muted-foreground">
                {place.phone && (
                  <a href={`tel:${place.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4 text-hotel-gold/60 shrink-0" />
                    {place.phone}
                  </a>
                )}
                {place.email && (
                  <a href={`mailto:${place.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4 text-hotel-gold/60 shrink-0" />
                    <span className="truncate">{place.email}</span>
                  </a>
                )}
                {place.menuUrl && (
                  <a href={place.menuUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 text-hotel-gold/60 shrink-0" />
                    {t("place.menu")}
                  </a>
                )}
                {place.website && (
                  <a href={place.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 text-hotel-gold/60 shrink-0" />
                    {t("place.visitWebsite")}
                  </a>
                )}
              </div>

              {/* CTA Como Chegar */}
              <a
                href={getDirectionsUrl(place)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-hotel-gold px-4 py-3 text-sm font-semibold text-black hover:bg-hotel-gold/90 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                {t("place.getDirections")}
                {place.distanceKm && (
                  <span className="ml-1 rounded-full bg-black/15 px-2 py-0.5 text-xs font-medium">
                    {place.distanceKm} km
                  </span>
                )}
              </a>

              {place.sourceUrl && !place.sourceUrl.includes("google.com/maps") && (
                <a
                  href={place.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-hotel-gold/40 transition-colors"
                >
                  {t("place.source")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </aside>
        </div>

        {/* ── AVALIAÇÕES ──────────────────────────────────────────── */}
        {place.reviews && place.reviews.length > 0 && (
          <section className="space-y-5 pt-2">
            <SectionDivider label={t("place.reviews")} />

            {/* Rating prominente */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(place.rating) ? "fill-rating-star text-rating-star" : "fill-muted text-muted"}`}
                  />
                ))}
              </div>
              <span className="font-serif text-2xl font-semibold">{place.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">{t("place.reviewsCount", { count: place.reviewCount })}</span>
            </div>

            {/* Cards de review */}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(showAllReviews ? place.reviews : place.reviews.slice(0, 3)).map((review, idx) => (
                <li key={idx} className="rounded-xl bg-card border border-border/50 p-5 space-y-2 flex flex-col">
                  <span className="font-serif text-4xl leading-none text-hotel-gold/40 select-none">"</span>
                  <p className="text-sm text-foreground/80 leading-relaxed font-serif italic flex-1 -mt-2">
                    {review.text}
                  </p>
                  {review.url && (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground/60 hover:text-hotel-gold transition-colors mt-auto"
                    >
                      {getReviewSource(review.url)} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {place.reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews((prev) => !prev)}
                className="text-xs text-hotel-gold/70 hover:text-hotel-gold transition-colors font-medium"
              >
                {showAllReviews
                  ? t("place.showLess")
                  : t("place.showAll", { count: place.reviews.length })}
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Place;
