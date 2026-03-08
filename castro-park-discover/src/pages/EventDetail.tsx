import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, MapPin, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useEvents } from "@/hooks/useEvents";
import { getDirectionsUrl } from "@/lib/maps";

const fallbackImage =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop";

function formatFullDate(startDate: string, endDate: string | null): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const start = new Date(startDate + "T12:00:00");
  if (!endDate || endDate === startDate) return fmt(start);
  const end = new Date(endDate + "T12:00:00");
  return `${fmt(start)} — ${fmt(end)}`;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: events, isLoading } = useEvents();

  const event = useMemo(
    () => events?.find((e) => e.id === id),
    [id, events]
  );

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

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="font-serif text-xl text-muted-foreground">{t("events.notFound")}</p>
        <Button variant="outline" onClick={() => navigate("/events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("events.seeAllEvents")}
        </Button>
      </div>
    );
  }

  const image = event.image || fallbackImage;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Header />

      {/* Hero */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden">
        <img
          src={image}
          alt={event.title}
          className="h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Botão voltar */}
        <button
          onClick={() => navigate("/events")}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 text-white/90 text-sm hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.events")}
        </button>

        {/* Badge categoria */}
        {event.category && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-hotel-gold text-hotel-charcoal font-medium text-xs">
              {event.category}
            </Badge>
          </div>
        )}

        {/* Data em destaque sobre o hero */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-hotel-gold text-sm font-medium mb-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="capitalize">{formatFullDate(event.startDate, event.endDate)}</span>
          </div>
          <h1 className="font-serif text-2xl md:text-4xl font-semibold text-white leading-tight line-clamp-3">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container max-w-2xl px-4 py-6 space-y-6">

        {/* Endereço */}
        {event.address && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
            <MapPin className="h-4 w-4 text-hotel-gold shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{event.address}</p>
              <a
                href={getDirectionsUrl(event.address)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-hotel-gold hover:underline mt-0.5 inline-block"
              >
                {t("events.seeOnMap")}
              </a>
            </div>
          </div>
        )}

        {/* Descrição */}
        {event.description && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-hotel-gold/20" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-hotel-gold/60 font-medium">{t("events.aboutEvent")}</span>
              <div className="h-px flex-1 bg-hotel-gold/20" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}

        {/* Categoria tag */}
        {event.category && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            <span>{event.category}</span>
          </div>
        )}

        {/* CTA */}
        {event.link && (
          <div className="pt-2">
            <a href={event.link} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full bg-hotel-gold hover:bg-hotel-gold/90 text-hotel-charcoal font-semibold h-12 text-base">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("events.moreInfoTickets")}
              </Button>
            </a>
          </div>
        )}

        {/* Botão voltar (rodapé) */}
        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={() => navigate("/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("events.seeAllEvents")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
