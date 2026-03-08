import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Event } from "@/types/event";
import { supabase } from "@/lib/supabase";
import { resolveI18nField, type I18nField } from "@/lib/i18nField";

const today = () => new Date().toISOString().split("T")[0];

const fetchEvents = async (lang: string): Promise<Event[]> => {
  const { data, error } = await supabase!
    .from("events")
    .select("*")
    .eq("is_active", true)
    .or(`end_date.is.null,end_date.gte.${today()}`)
    .order("start_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: row.id as string,
    title: resolveI18nField(row.title as I18nField, lang) || (row.title as string),
    description: resolveI18nField(row.description as I18nField, lang) || null,
    image: row.image as string | null,
    address: row.address as string | null,
    link: row.link as string | null,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    category: row.category as string | null,
  }));
};

export const useEvents = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "pt";

  return useQuery<Event[]>({
    queryKey: ["events", lang],
    queryFn: () => fetchEvents(lang),
    enabled: !!supabase,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
};
