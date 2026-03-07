import { Phone, Utensils, Wine, Music } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const PILLS = [
  { label: "72 pratos" },
  { label: "Feijoada premiada · Sábados" },
  { label: "11h às 23h" },
];

export const IpeHeroCard = () => {
  return (
    <section className="container px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl border border-hotel-gold/30 bg-primary text-primary-foreground shadow-[0_0_40px_0_rgba(212,175,55,0.12)]">

        {/* Ornamento de fundo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute -right-8 -top-6 font-serif text-[160px] font-semibold leading-none text-hotel-gold/5 select-none">
            Ipê
          </span>
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">

          {/* Lado esquerdo — ícone + badges */}
          <div className="flex flex-col items-center md:items-start gap-3 shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-hotel-gold/40 bg-hotel-gold/10 shadow-[0_0_20px_0_rgba(212,175,55,0.2)]">
              <Utensils className="h-6 w-6 text-hotel-gold" />
            </div>
            {/* Badge sólido */}
            <div className="rounded-full bg-hotel-gold px-3 py-1">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-hotel-charcoal">
                Dentro do hotel
              </span>
            </div>
          </div>

          {/* Centro — conteúdo */}
          <div className="flex-1 text-center md:text-left">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.25em] text-hotel-gold/80">
              Recomendação principal
            </p>
            <h2 className="font-serif text-3xl font-semibold md:text-4xl mb-1 leading-tight">
              Restaurante Ipê
            </h2>
            <p className="font-serif italic text-primary-foreground/60 text-sm mb-4">
              30 anos de tradição · Certificação 5 estrelas · Gastronomia contemporânea
            </p>

            {/* Pills */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-5">
              {PILLS.map((p) => (
                <span
                  key={p.label}
                  className="rounded-full border border-hotel-gold/30 bg-hotel-gold/10 px-3 py-1 text-xs text-primary-foreground/80"
                >
                  {p.label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <ShimmerButton
                shimmerColor="#c9a84c"
                shimmerDuration="2.5s"
                className="text-sm font-medium gap-2 px-5 py-2.5"
                onClick={() => window.open("tel:+556230962000")}
              >
                <Phone className="h-3.5 w-3.5" />
                Reservar mesa
              </ShimmerButton>

              <button
                onClick={() => window.open("https://castros-park-hotel-restaurante-ip-1.goomer.app/menu", "_blank", "noreferrer")}
                className="inline-flex items-center gap-2 rounded-full border border-hotel-gold/40 px-5 py-2.5 text-sm font-medium text-hotel-gold/90 hover:border-hotel-gold/70 hover:text-hotel-gold transition-colors"
              >
                <Wine className="h-3.5 w-3.5" />
                Ver cardápio
              </button>
            </div>
          </div>

          {/* Lado direito — Piano ao vivo */}
          <div className="hidden md:flex flex-col items-center gap-2 shrink-0 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-hotel-gold/30 bg-hotel-gold/10">
              <Music className="h-4 w-4 text-hotel-gold" />
            </div>
            <p className="text-xs text-primary-foreground/50 leading-tight">
              Piano ao vivo<br />todo sábado
            </p>
          </div>

        </div>

        {/* Linha decorativa inferior */}
        <div className="h-px bg-gradient-to-r from-transparent via-hotel-gold/30 to-transparent" />
      </div>
    </section>
  );
};
