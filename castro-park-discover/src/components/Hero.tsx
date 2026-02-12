interface HeroProps {
  totalPlaces: number;
  totalCategories: number;
  updatedAt?: string;
}

export const Hero = ({ totalPlaces, totalCategories, updatedAt }: HeroProps) => {
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-hotel-navy py-12 text-primary-foreground md:py-16">
      <div className="container px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            Guia oficial para hóspedes do Castro&apos;s Park Hotel
          </p>

          <h2 className="mb-4 text-3xl font-semibold sm:text-4xl md:text-5xl font-serif tracking-wide">
            Descubra Goiânia com mais conforto
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-base opacity-90 sm:text-lg">
            Lugares escolhidos para facilitar seu roteiro: onde comer, passear e aproveitar a cidade sem perder tempo.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-background/10 px-4 py-3 text-left backdrop-blur">
              <p className="text-xs uppercase tracking-wide opacity-80">Lugares</p>
              <p className="text-lg font-semibold">{totalPlaces}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-background/10 px-4 py-3 text-left backdrop-blur">
              <p className="text-xs uppercase tracking-wide opacity-80">Categorias</p>
              <p className="text-lg font-semibold">{totalCategories}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-background/10 px-4 py-3 text-left backdrop-blur">
              <p className="text-xs uppercase tracking-wide opacity-80">Diferencial</p>
              <p className="text-lg font-semibold">Curadoria do hotel</p>
            </div>
          </div>

          {updatedText && <p className="mt-4 text-xs opacity-80">Atualizado em {updatedText}</p>}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
