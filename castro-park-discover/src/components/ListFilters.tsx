import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <section className="border-b bg-background">
      <div className="container px-4 py-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>{t("filters.sort")}</Label>
            <Select
              value={value.sortBy}
              onValueChange={(v) => onChange({ ...value, sortBy: v as SortBy })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filters.sort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">{t("filters.sortBest")}</SelectItem>
                <SelectItem value="distance">{t("filters.sortDistance")}</SelectItem>
                <SelectItem value="rating">{t("filters.sortRating")}</SelectItem>
                <SelectItem value="reviews">{t("filters.sortReviews")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.distance")}</Label>
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
                <SelectValue placeholder={t("filters.distance")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("filters.distanceAny")}</SelectItem>
                <SelectItem value="1">{t("filters.distanceUpTo", { km: 1 })}</SelectItem>
                <SelectItem value="3">{t("filters.distanceUpTo", { km: 3 })}</SelectItem>
                <SelectItem value="5">{t("filters.distanceUpTo", { km: 5 })}</SelectItem>
                <SelectItem value="10">{t("filters.distanceUpTo", { km: 10 })}</SelectItem>
                <SelectItem value="20">{t("filters.distanceUpTo", { km: 20 })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.price")}</Label>
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
                <SelectValue placeholder={t("filters.price")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("filters.priceAny")}</SelectItem>
                <SelectItem value="1">{t("filters.priceCheap")}</SelectItem>
                <SelectItem value="2">{t("filters.priceMedium")}</SelectItem>
                <SelectItem value="3">{t("filters.priceExpensive")}</SelectItem>
                <SelectItem value="4">{t("filters.pricePremium")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("filters.minRating")}</Label>
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
                <SelectValue placeholder={t("filters.minRating")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("filters.ratingAny")}</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="4.3">4.3+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4.7">4.7+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 md:mt-7">
            <div>
              <p className="text-sm font-medium">{t("filters.openNow")}</p>
              <p className="text-xs text-muted-foreground">{t("filters.openNowHint")}</p>
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
