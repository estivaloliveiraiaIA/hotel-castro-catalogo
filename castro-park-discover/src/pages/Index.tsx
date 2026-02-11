import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryTabs } from "@/components/CategoryTabs";
import { PlaceCard } from "@/components/PlaceCard";
import { usePlaces } from "@/hooks/usePlaces";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: places = [], isLoading, isError, error } = usePlaces();

  const filteredPlaces = useMemo(
    () =>
      selectedCategory === "all"
        ? places
        : places.filter((place) => place.category === selectedCategory),
    [places, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryTabs 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <main className="container px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {selectedCategory === "all" 
              ? "Todos os Lugares" 
              : `${filteredPlaces.length} Lugares Encontrados`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Curadoria Castro's Park Hotel
          </p>
        </div>

        {isLoading && (
          <div className="text-muted-foreground">Carregando lugares reais...</div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Não foi possível carregar os lugares agora. {error instanceof Error ? error.message : "Tente novamente em instantes."}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
            {filteredPlaces.length === 0 && (
              <div className="col-span-full rounded-md border border-border p-6 text-center text-muted-foreground">
                Nenhum resultado para esta categoria no momento.
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {new Date().getFullYear()} Castro's Park Hotel - Todos os direitos reservados
          </p>
          <p>
            Recomendações exclusivas para tornar sua experiência em Goiânia inesquecível
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
