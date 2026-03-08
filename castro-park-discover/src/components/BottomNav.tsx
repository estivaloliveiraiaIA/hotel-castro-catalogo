import { Home, Map, CalendarDays, Sparkles, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CONCIERGE_OPEN_EVENT } from "@/components/ConciergeFloat";

const NAV_ITEMS = [
  { label: "Guia", href: "/", icon: Home },
  { label: "Roteiros", href: "/itineraries", icon: Map },
  { label: "Favoritos", href: "/recomendados", icon: Heart },
  { label: "Eventos", href: "/events", icon: CalendarDays },
  { label: "Concierge IA", href: null, icon: Sparkles },
];

export const BottomNav = () => {
  const { pathname } = useLocation();

  const handleConciergeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event(CONCIERGE_OPEN_EVENT));
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-hotel-gold/25 bg-background/90 backdrop-blur-md shadow-[0_8px_32px_-4px_rgba(0,0,0,0.25),0_0_0_1px_hsl(var(--hotel-gold)/0.08)] px-2 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isConcierge = label === "Concierge IA";
          const isActive = isConcierge
            ? false
            : label === "Guia"
            ? pathname === "/"
            : href !== null && href !== "/" && pathname.startsWith(href);

          const className = cn(
            "relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 text-[10px] font-medium rounded-xl transition-all duration-200",
            isActive
              ? "text-hotel-gold bg-hotel-gold/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          );

          if (isConcierge) {
            return (
              <button key={label} onClick={handleConciergeClick} aria-label={label} className={className}>
                <Icon className="h-5 w-5 transition-all duration-200" />
                {label}
              </button>
            );
          }

          return (
            <Link key={label} to={href!} aria-label={label} className={className}>
              <Icon className={cn("h-5 w-5 transition-all duration-200", isActive && "stroke-[2.5] scale-110")} />
              {label}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-hotel-gold" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
