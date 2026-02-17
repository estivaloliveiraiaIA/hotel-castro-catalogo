interface HeroProps {
  totalPlaces: number;
  totalCategories: number;
  updatedAt?: string;
}

export const Hero = ({ updatedAt }: HeroProps) => {
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-primary/80 py-16 text-primary-foreground md:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">

          {/* Ornamento superior dourado */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-hotel-gold/50" />
            <span className="text-hotel-gold text-base">✦</span>
            <div className="h-px w-12 bg-hotel-gold/50" />
          </div>

          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-hotel-gold/80">
            Guia oficial para hóspedes
          </p>

          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-widest sm:text-4xl md:text-5xl">
            Descubra Goiânia
          </h2>

          <p className="mx-auto mb-8 max-w-xl font-serif text-base italic text-primary-foreground/75 sm:text-lg">
            Uma curadoria pensada para tornar sua estadia inesquecível
          </p>

          {/* Separador dourado decorativo central */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-hotel-gold/40" />
            <span className="text-xs text-hotel-gold/60 tracking-widest">✦</span>
            <div className="h-px w-20 bg-hotel-gold/40" />
          </div>

          {/* Linha elegante — substitui os 3 cards genéricos */}
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-hotel-gold/90">
            ★ Curadoria exclusiva para hóspedes ★
          </p>

          {updatedText && (
            <p className="mt-6 text-xs opacity-50">Atualizado em {updatedText}</p>
          )}
        </div>
      </div>

      {/* Fade para o background */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
