-- ============================================================
-- Castro's Park Hotel — Tabela hotel_knowledge (RAG Concierge)
-- Execute no Supabase Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.hotel_knowledge (
  id       serial primary key,
  topic    text not null,
  content  text not null,
  keywords text[] default '{}'
);

-- RLS
alter table public.hotel_knowledge enable row level security;

create policy "public_read_hotel_knowledge"
  on public.hotel_knowledge for select using (true);

create policy "service_all_hotel_knowledge"
  on public.hotel_knowledge for all using (auth.role() = 'service_role');
