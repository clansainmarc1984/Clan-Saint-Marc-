-- =========================================================
-- CLAN SAINT MARC
-- BASE SUPABASE SÉCURISÉE
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  text text not null,
  image text,
  created_at timestamptz not null default now()
);


create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  promo text,
  created_at timestamptz not null default now()
);


create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  image text not null,
  date date,
  created_at timestamptz not null default now()
);


create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);


create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  year text not null,
  text text,
  created_at timestamptz not null default now()
);


-- =========================================================
-- TABLE DES ADMINISTRATEURS
-- =========================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- =========================================================
-- RLS
-- =========================================================

alter table public.news enable row level security;
alter table public.birthdays enable row level security;
alter table public.gallery enable row level security;
alter table public.videos enable row level security;
alter table public.promotions enable row level security;
alter table public.admin_users enable row level security;


-- =========================================================
-- FONCTION DE VÉRIFICATION ADMIN
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;


-- =========================================================
-- PERMISSION POUR APPELER is_admin()
-- =========================================================

grant execute
on function public.is_admin()
to anon, authenticated;


-- =========================================================
-- SUPPRESSION DES ANCIENNES POLITIQUES
-- =========================================================

drop policy if exists "public read news"
on public.news;

drop policy if exists "public read birthdays"
on public.birthdays;

drop policy if exists "public read gallery"
on public.gallery;

drop policy if exists "public read videos"
on public.videos;

drop policy if exists "public read promotions"
on public.promotions;


drop policy if exists "auth insert news"
on public.news;

drop policy if exists "auth update news"
on public.news;

drop policy if exists "auth delete news"
on public.news;


drop policy if exists "auth insert birthdays"
on public.birthdays;

drop policy if exists "auth update birthdays"
on public.birthdays;

drop policy if exists "auth delete birthdays"
on public.birthdays;


drop policy if exists "auth insert gallery"
on public.gallery;

drop policy if exists "auth update gallery"
on public.gallery;

drop policy if exists "auth delete gallery"
on public.gallery;


drop policy if exists "auth insert videos"
on public.videos;

drop policy if exists "auth update videos"
on public.videos;

drop policy if exists "auth delete videos"
on public.videos;


drop policy if exists "auth insert promotions"
on public.promotions;

drop policy if exists "auth update promotions"
on public.promotions;

drop policy if exists "auth delete promotions"
on public.promotions;


-- =========================================================
-- LECTURE PUBLIQUE
-- =========================================================

create policy "public read news"
on public.news
for select
using (true);


create policy "public read birthdays"
on public.birthdays
for select
using (true);


create policy "public read gallery"
on public.gallery
for select
using (true);


create policy "public read videos"
on public.videos
for select
using (true);


create policy "public read promotions"
on public.promotions
for select
using (true);


-- =========================================================
-- ÉCRITURE ADMIN UNIQUEMENT
-- =========================================================

create policy "admin insert news"
on public.news
for insert
to authenticated
with check (public.is_admin());


create policy "admin update news"
on public.news
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy "admin delete news"
on public.news
for delete
to authenticated
using (public.is_admin());


create policy "admin insert birthdays"
on public.birthdays
for insert
to authenticated
with check (public.is_admin());


create policy "admin update birthdays"
on public.birthdays
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy "admin delete birthdays"
on public.birthdays
for delete
to authenticated
using (public.is_admin());


create policy "admin insert gallery"
on public.gallery
for insert
to authenticated
with check (public.is_admin());


create policy "admin update gallery"
on public.gallery
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy "admin delete gallery"
on public.gallery
for delete
to authenticated
using (public.is_admin());


create policy "admin insert videos"
on public.videos
for insert
to authenticated
with check (public.is_admin());


create policy "admin update videos"
on public.videos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy "admin delete videos"
on public.videos
for delete
to authenticated
using (public.is_admin());


create policy "admin insert promotions"
on public.promotions
for insert
to authenticated
with check (public.is_admin());


create policy "admin update promotions"
on public.promotions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


create policy "admin delete promotions"
on public.promotions
for delete
to authenticated
using (public.is_admin());


-- =========================================================
-- PROTECTION DE admin_users
-- =========================================================

create policy "admin users self check"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());
