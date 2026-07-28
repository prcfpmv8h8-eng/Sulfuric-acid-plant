create extension if not exists pgcrypto;

create table if not exists public.equipment (
  uid uuid primary key default gen_random_uuid(),
  equipment_id text not null,
  name text not null,
  facility text not null check (facility in ('10', '11')),
  section text default '',
  description text default '',
  location text default '',
  operation text default '',
  additional_info text default '',
  notes text default '',
  image_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists equipment_unique_unit
on public.equipment (equipment_id, facility);

create or replace function public.set_equipment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
before update on public.equipment
for each row execute function public.set_equipment_updated_at();

alter table public.equipment enable row level security;

grant select, insert, update on public.equipment to anon;

drop policy if exists "Public equipment read" on public.equipment;
create policy "Public equipment read"
on public.equipment for select
to anon
using (true);

drop policy if exists "Public equipment insert" on public.equipment;
create policy "Public equipment insert"
on public.equipment for insert
to anon
with check (true);

drop policy if exists "Public equipment update" on public.equipment;
create policy "Public equipment update"
on public.equipment for update
to anon
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'equipment-images',
  'equipment-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public equipment images read" on storage.objects;
create policy "Public equipment images read"
on storage.objects for select
to anon
using (bucket_id = 'equipment-images');

drop policy if exists "Public equipment images upload" on storage.objects;
create policy "Public equipment images upload"
on storage.objects for insert
to anon
with check (bucket_id = 'equipment-images');

drop policy if exists "Public equipment images update" on storage.objects;
create policy "Public equipment images update"
on storage.objects for update
to anon
using (bucket_id = 'equipment-images')
with check (bucket_id = 'equipment-images');

alter publication supabase_realtime add table public.equipment;
