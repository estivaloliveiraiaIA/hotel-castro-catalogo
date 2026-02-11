import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UtensilsCrossed, 
  Landmark, 
  Music, 
  ShoppingBag, 
  Coffee,
  Heart,
  Palette,
  TreePine
} from "lucide-react";

const categories = [
  { id: "all", label: "Todos", icon: Heart },
  { id: "restaurants", label: "Restaurantes", icon: UtensilsCrossed },
  { id: "attractions", label: "Atrações", icon: Landmark },
  { id: "nightlife", label: "Vida Noturna", icon: Music },
  { id: "shopping", label: "Compras", icon: ShoppingBag },
  { id: "cafes", label: "Cafés", icon: Coffee },
  { id: "culture", label: "Cultura", icon: Palette },
  { id: "nature", label: "Natureza", icon: TreePine },
];

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="border-b bg-background">
      <div className="container px-4 py-4">
        <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
          <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 hover:bg-muted data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
