import { Home, Map, CalendarDays, Sparkles, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CONCIERGE_OPEN_EVENT } from "@/components/ConciergeFloat";

const NAV_ITEMS = [
  { label: "Guia", href: "/", icon: Home },
  { label: "Roteiros", href: "/itineraries", icon: Map },
  { label: "Favoritos", href: "/favorites", icon: Heart },
  { label: "Eventos", href: "/events", icon: CalendarDays },
  { label: "Concierge", href: null, icon: Sparkles },
];

export const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-hotel-gold/20 bg-background/95 backdrop-blur-sm md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            label === "Guia"
              ? pathname === "/"
              : label === "Concierge"
              ? false
              : href !== null && pathname.startsWith(href) && href !== "/";

          const className = cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors duration-150",
            isActive ? "text-hotel-gold" : "text-muted-foreground hover:text-foreground"
          );

          if (label === "Concierge") {
            return (
              <button
                key={label}
                onClick={() => window.dispatchEvent(new Event(CONCIERGE_OPEN_EVENT))}
                aria-label="Abrir Concierge"
                className={className}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          }

          return (
            <Link
              key={label}
              to={href!}
              aria-label={label}
              className={className}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
