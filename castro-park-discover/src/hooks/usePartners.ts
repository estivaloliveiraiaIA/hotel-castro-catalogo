import { useQuery } from "@tanstack/react-query";
import { Partner } from "@/types/partner";
import { supabase } from "@/lib/supabase";

const fetchPartners = async (): Promise<Partner[]> => {
  const { data, error } = await supabase!
    .from("partners")
    .select(`
      id,
      place_id,
      deal_description,
      badge_label,
      place:places(id, name, category, image, rating)
    `)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  return (data || [])
    .filter((row) => row.place)
    .map((row) => {
      const p = row.place as Record<string, unknown>;
      return {
        id: row.id as string,
        placeId: row.place_id as string,
        dealDescription: row.deal_description as string | null,
        badgeLabel: (row.badge_label as string) || "Parceiro do Hotel",
        place: {
          id: p.id as string,
          name: p.name as string,
          category: p.category as string | null,
          image: p.image as string | null,
          rating: p.rating as number | null,
        },
      };
    });
};

export const usePartners = () =>
  useQuery<Partner[]>({
    queryKey: ["partners"],
    queryFn: fetchPartners,
    enabled: !!supabase,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
