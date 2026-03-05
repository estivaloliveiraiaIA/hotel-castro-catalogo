import { Header } from "@/components/Header";
import { ItineraryCard } from "@/components/ItineraryCard";
import { useItineraries } from "@/hooks/useItineraries";
import { useState } from "react";

const Itineraries = () => {
  const { data: itineraries, isLoading, isError } = useItineraries();
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header query={query} onQueryChange={setQuery} />

      <section className="border-b bg-gradient-to-b from-hotel-navy/5 to-background py-12">
        <div className="container px-4 text-center">
          <p className="font-serif text-hotel-gold text-sm tracking-widest uppercase mb-2">
            Experiencias Curadas
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
            Roteiros Tematicos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Experiencias prontas selecionadas pelo time do Castro&apos;s Park Hotel para tornar cada momento em Goiania inesquecivel.
          </p>
        </div>
      </section>

      <main className="container px-4 py-10">
        {isLoading && (
          <div className="text-muted-foreground text-center py-16">
            Carregando roteiros...
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            Nao foi possivel carregar os roteiros. Tente novamente.
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

      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Castro&apos;s Park Hotel — Curadoria especial para hospedes</p>
        </div>
      </footer>
    </div>
  );
};

export default Itineraries;
