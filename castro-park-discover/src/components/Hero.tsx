export const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-hotel-navy py-16 text-primary-foreground">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Descubra o Melhor de Goiânia
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Recomendações exclusivas do Castro's Park Hotel para tornar sua estadia inesquecível
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              <span className="font-semibold">500+</span> Lugares
            </div>
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              <span className="font-semibold">15</span> Categorias
            </div>
            <div className="rounded-lg bg-background/10 px-4 py-2 backdrop-blur">
              <span className="font-semibold">Avaliações</span> Verificadas
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};
