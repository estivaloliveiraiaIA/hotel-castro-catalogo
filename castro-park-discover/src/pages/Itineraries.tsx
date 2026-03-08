import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { ItineraryCard } from "@/components/ItineraryCard";
import { useItineraries } from "@/hooks/useItineraries";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Itineraries = () => {
  const { data: itineraries, isLoading, isError } = useItineraries();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <div className="container px-4 pt-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.home")}
        </Button>
      </div>

      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-14">
        <div className="container px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-hotel-gold/50" />
            <span className="text-hotel-gold text-base">✦</span>
            <div className="h-px w-12 bg-hotel-gold/50" />
          </div>
          <p className="font-medium text-hotel-gold text-xs tracking-[0.2em] uppercase mb-3">
            {t("itinerary.curatedExperiences")}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
            {t("itinerary.thematicItineraries")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("itinerary.itinerariesSubtitle")}
          </p>
        </div>
      </section>

      <main className="container px-4 py-10">
        {isLoading && (
          <div className="text-muted-foreground text-center py-16">
            {t("itinerary.loadingItineraries")}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {t("itinerary.loadError")}
          </div>
        )}

        {itineraries && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <ItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-muted/20 py-10">
        <div className="container px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-hotel-gold/30" />
            <span className="text-hotel-gold/50 text-sm">✦</span>
            <div className="h-px w-12 bg-hotel-gold/30" />
          </div>
          <p className="font-serif text-base text-foreground/70 mb-1">
            {t("header.hotelName")}
          </p>
          <p className="text-xs text-muted-foreground tracking-wide">
            {t("itinerary.footerTagline")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Itineraries;
