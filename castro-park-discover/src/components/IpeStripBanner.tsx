import { Phone, Clock, Music } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const FACTS = [
  { icon: Music, label: "Piano ao vivo · Sábados" },
  { icon: Clock, label: "Seg–Dom · 11h às 23h" },
  { icon: Phone, label: "Café da manhã incluso" },
];

export const IpeStripBanner = () => {
  return (
    <section className="bg-primary border-b border-hotel-gold/20 py-10 md:py-14 text-primary-foreground">
      <div className="container px-4">
        <div className="mx-auto max-w-4xl">

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

            {/* Conteúdo principal */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hotel-gold/50 bg-hotel-gold/10 px-5 py-2 shadow-[0_0_18px_0_rgba(212,175,55,0.18)]">
                <span className="text-hotel-gold text-xs">✦</span>
                <span className="text-xs font-semibold tracking-[0.28em] uppercase text-hotel-gold">
                  Dentro do hotel
                </span>
                <span className="text-hotel-gold text-xs">✦</span>
              </div>

              <h2 className="font-serif text-5xl font-semibold md:text-6xl mb-2 leading-tight">
                Restaurante Ipê
              </h2>
              <p className="font-serif italic text-primary-foreground/70 text-lg mb-2">
                No seu hotel. Agora.
              </p>
              <p className="text-sm text-primary-foreground/50 mb-6 max-w-sm">
                Mais de 30 anos de tradição · Certificação 5 estrelas · 72 pratos
              </p>

              <div className="flex justify-center md:justify-start">
                <ShimmerButton
                  shimmerColor="#c9a84c"
                  shimmerDuration="2.5s"
                  className="text-sm font-medium gap-2 px-6 py-3"
                  onClick={() => window.open("tel:+556230962000")}
                >
                  <Phone className="h-4 w-4" />
                  Reservar mesa
                </ShimmerButton>
              </div>
            </div>

            {/* Decorativo — ornamento dourado */}
            <div className="hidden md:flex flex-col items-center justify-center gap-4 shrink-0">
              <div className="h-px w-24 bg-hotel-gold/40" />
              <span className="font-serif text-7xl text-hotel-gold/20 leading-none select-none">Ipê</span>
              <div className="h-px w-24 bg-hotel-gold/40" />
            </div>

          </div>

          {/* Faixa de fatos */}
          <div className="mt-8 pt-6 border-t border-hotel-gold/20 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {FACTS.map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-primary-foreground/60">
                <Icon className="h-3.5 w-3.5 text-hotel-gold/60" />
                <span>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
