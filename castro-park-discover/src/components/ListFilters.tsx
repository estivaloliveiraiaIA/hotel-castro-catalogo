import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type SortBy = "best" | "distance" | "rating" | "reviews";

export interface ListFilterState {
  sortBy: SortBy;
  openNow: boolean;
  maxDistanceKm: number | null;
  maxPriceLevel: number | null;
  minRating: number | null;
}

interface ListFiltersProps {
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
}

export function ListFilters({ value, onChange }: ListFiltersProps) {
  return (
    <section className="border-b bg-background">
      <div className="container px-4 py-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Ordenar</Label>
            <Select
              value={value.sortBy}
              onValueChange={(v) => onChange({ ...value, sortBy: v as SortBy })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Melhor recomendado</SelectItem>
                <SelectItem value="distance">Mais perto do hotel</SelectItem>
                <SelectItem value="rating">Maior nota</SelectItem>
                <SelectItem value="reviews">Mais avaliações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Distância</Label>
            <Select
              value={value.maxDistanceKm === null ? "any" : String(value.maxDistanceKm)}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  maxDistanceKm: v === "any" ? null : Number(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Distância" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="1">Até 1 km</SelectItem>
                <SelectItem value="3">Até 3 km</SelectItem>
                <SelectItem value="5">Até 5 km</SelectItem>
                <SelectItem value="10">Até 10 km</SelectItem>
                <SelectItem value="20">Até 20 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preço</Label>
            <Select
              value={value.maxPriceLevel === null ? "any" : String(value.maxPriceLevel)}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  maxPriceLevel: v === "any" ? null : Number(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="1">$ (barato)</SelectItem>
                <SelectItem value="2">$$ (médio)</SelectItem>
                <SelectItem value="3">$$$ (caro)</SelectItem>
                <SelectItem value="4">$$$$ (premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nota mínima</Label>
            <Select
              value={value.minRating === null ? "any" : String(value.minRating)}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  minRating: v === "any" ? null : Number(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="4.3">4.3+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4.7">4.7+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 md:mt-7">
            <div>
              <p className="text-sm font-medium">Aberto agora</p>
              <p className="text-xs text-muted-foreground">(quando disponível)</p>
            </div>
            <Switch
              checked={value.openNow}
              onCheckedChange={(checked) => onChange({ ...value, openNow: checked })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
