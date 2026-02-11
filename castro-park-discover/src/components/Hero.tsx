interface HeroProps {
  totalPlaces: number;
  totalCategories: number;
}

export const Hero = ({ totalPlaces, totalCategories }: HeroProps) => {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-hotel-navy py-14 text-primary-foreground md:py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Descubra o melhor de Goiânia
          </h2>
          <p className="mb-8 text-base opacity-90 sm:text-lg">
            Recomendações do Castro&apos;s Park Hotel para tornar sua estadia inesquecível
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              <span className="font-semibold">{totalPlaces}</span> lugares
            </div>
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              <span className="font-semibold">{totalCategories}</span> categorias
            </div>
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              Curadoria do hotel
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
