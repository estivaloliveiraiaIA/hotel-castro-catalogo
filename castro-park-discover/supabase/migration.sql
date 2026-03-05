-- ============================================================
-- Castro's Park Hotel — Schema do banco de dados
-- Execute no Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: places
-- ============================================================
create table if not exists public.places (
  id                  text primary key,
  name                text not null,
  category            text,
  rating              numeric,
  review_count        integer,
  price_level         integer,
  price_text          text,
  description         text,
  image               text,
  address             text,
  latitude            numeric,
  longitude           numeric,
  phone               text,
  website             text,
  hours               jsonb default '[]',
  tags                jsonb default '[]',
  subcategories       jsonb default '[]',
  gallery             jsonb default '[]',
  source_url          text,
  open_status_text    text,
  menu_url            text,
  distance_km         numeric,
  hotel_recommended   boolean default false,
  hotel_score         integer,
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- TABELA: itineraries
-- ============================================================
create table if not exists public.itineraries (
  id          text primary key,
  title       text not null,
  subtitle    text,
  icon        text,
  cover_image text,
  duration    text,
  best_time   text,
  profile     text,
  tips        jsonb default '[]',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABELA: itinerary_places (paradas de cada roteiro)
-- ============================================================
create table if not exists public.itinerary_places (
  id             uuid default gen_random_uuid() primary key,
  itinerary_id   text references public.itineraries(id) on delete cascade,
  place_id       text references public.places(id) on delete set null,
  order_index    integer not null,
  note           text,
  suggested_time text
);

-- ============================================================
-- TABELA: events (agenda de eventos)
-- ============================================================
create table if not exists public.events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  image       text,
  address     text,
  link        text,
  start_date  date,
  end_date    date,
  category    text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TABELA: partners (parceiros especiais)
-- ============================================================
create table if not exists public.partners (
  id               uuid default gen_random_uuid() primary key,
  place_id         text references public.places(id) on delete set null,
  deal_description text,
  badge_label      text default 'Parceiro do Hotel',
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.places        enable row level security;
alter table public.itineraries   enable row level security;
alter table public.itinerary_places enable row level security;
alter table public.events        enable row level security;
alter table public.partners      enable row level security;

-- Leitura pública (app dos hóspedes)
create policy "public_read_places"        on public.places        for select using (is_active = true);
create policy "public_read_itineraries"   on public.itineraries   for select using (is_active = true);
create policy "public_read_itinerary_places" on public.itinerary_places for select using (true);
create policy "public_read_events"        on public.events        for select using (is_active = true);
create policy "public_read_partners"      on public.partners      for select using (is_active = true);

-- Escrita via service_role (Admin Dashboard usa service_role no servidor)
create policy "service_all_places"        on public.places        for all using (auth.role() = 'service_role');
create policy "service_all_itineraries"   on public.itineraries   for all using (auth.role() = 'service_role');
create policy "service_all_itinerary_places" on public.itinerary_places for all using (auth.role() = 'service_role');
create policy "service_all_events"        on public.events        for all using (auth.role() = 'service_role');
create policy "service_all_partners"      on public.partners      for all using (auth.role() = 'service_role');

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_places_updated_at        before update on public.places        for each row execute procedure public.set_updated_at();
create trigger trg_itineraries_updated_at   before update on public.itineraries   for each row execute procedure public.set_updated_at();
create trigger trg_events_updated_at        before update on public.events        for each row execute procedure public.set_updated_at();
create trigger trg_partners_updated_at      before update on public.partners      for each row execute procedure public.set_updated_at();
