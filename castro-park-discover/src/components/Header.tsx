import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export const Header = ({ query, onQueryChange }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-6">
            <h1 className="text-xl font-semibold tracking-wide text-primary sm:text-2xl font-serif">
              Castro&apos;s Park Hotel
            </h1>
            <span className="hidden text-sm text-muted-foreground md:block">
              Guia de Goiânia
            </span>
          </div>

          {onQueryChange && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query ?? ""}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Buscar lugares..."
                className="w-72 pl-9"
              />
            </div>
          )}
        </div>

        {onQueryChange && (
          <div className="pb-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query ?? ""}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Buscar restaurantes, cafés, parques..."
                className="pl-9"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
