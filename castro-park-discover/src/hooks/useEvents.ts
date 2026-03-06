import { useQuery } from "@tanstack/react-query";
import { Event } from "@/types/event";
import { supabase } from "@/lib/supabase";

const today = () => new Date().toISOString().split("T")[0];

const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase!
    .from("events")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", today())
    .order("start_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    image: row.image as string | null,
    address: row.address as string | null,
    link: row.link as string | null,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    category: row.category as string | null,
  }));
};

export const useEvents = () =>
  useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: fetchEvents,
    enabled: !!supabase,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
