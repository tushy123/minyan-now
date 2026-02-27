-- ==================== SHULS MIGRATION ====================
-- Creates the shul account system tables: shuls, shul_admins, shul_schedules, schedule_overrides

-- 1. Shuls (Official Shul Entities)
create table if not exists shuls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  nusach text check (nusach in ('ashkenaz','sefard','edot_hamizrach','other')),
  contact_email text,
  contact_phone text,
  website text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shuls_lat_lng_idx on shuls (lat, lng);

-- 2. Shul Admins
create table if not exists shul_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shul_id uuid not null references shuls(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','gabbai')),
  created_at timestamptz not null default now(),
  unique (user_id, shul_id)
);

create index if not exists shul_admins_user_idx on shul_admins (user_id);
create index if not exists shul_admins_shul_idx on shul_admins (shul_id);

-- 3. Shul Schedules (Recurring Weekly Times)
create table if not exists shul_schedules (
  id uuid primary key default gen_random_uuid(),
  shul_id uuid not null references shuls(id) on delete cascade,
  tefillah text not null check (tefillah in ('SHACHARIS','MINCHA','MAARIV')),
  days text[] not null default '{}',
  start_time text not null,
  name text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shul_schedules_shul_idx on shul_schedules (shul_id);
create index if not exists shul_schedules_tefillah_idx on shul_schedules (tefillah);

-- 4. Schedule Overrides (Special Days)
create table if not exists schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  shul_id uuid not null references shuls(id) on delete cascade,
  schedule_id uuid references shul_schedules(id) on delete cascade,
  override_date date not null,
  override_type text not null check (override_type in ('time_change','cancelled','added')),
  new_time text,
  tefillah text check (tefillah in ('SHACHARIS','MINCHA','MAARIV')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists schedule_overrides_shul_date_idx on schedule_overrides (shul_id, override_date);

-- 5. Enable RLS
alter table shuls enable row level security;
alter table shul_admins enable row level security;
alter table shul_schedules enable row level security;
alter table schedule_overrides enable row level security;

-- 6. RLS Policies: Shuls
create policy "Anyone can view shuls" on shuls for select using (true);
create policy "Authenticated users can create shuls" on shuls for insert with check (auth.uid() is not null);
create policy "Shul admins can update their shul" on shuls for update using (
  exists (select 1 from shul_admins where shul_admins.shul_id = shuls.id and shul_admins.user_id = auth.uid())
);
create policy "Shul owners can delete their shul" on shuls for delete using (
  exists (select 1 from shul_admins where shul_admins.shul_id = shuls.id and shul_admins.user_id = auth.uid() and shul_admins.role = 'owner')
);

-- 7. RLS Policies: Shul Admins
create policy "Anyone can view shul admins" on shul_admins for select using (true);
create policy "Authenticated users can become shul admin on insert" on shul_admins for insert with check (auth.uid() = user_id);
create policy "Shul owners can manage admins" on shul_admins for delete using (
  exists (select 1 from shul_admins sa where sa.shul_id = shul_admins.shul_id and sa.user_id = auth.uid() and sa.role = 'owner')
);

-- 8. RLS Policies: Shul Schedules
create policy "Anyone can view schedules" on shul_schedules for select using (true);
create policy "Shul admins can create schedules" on shul_schedules for insert with check (
  exists (select 1 from shul_admins where shul_admins.shul_id = shul_schedules.shul_id and shul_admins.user_id = auth.uid())
);
create policy "Shul admins can update schedules" on shul_schedules for update using (
  exists (select 1 from shul_admins where shul_admins.shul_id = shul_schedules.shul_id and shul_admins.user_id = auth.uid())
);
create policy "Shul admins can delete schedules" on shul_schedules for delete using (
  exists (select 1 from shul_admins where shul_admins.shul_id = shul_schedules.shul_id and shul_admins.user_id = auth.uid())
);

-- 9. RLS Policies: Schedule Overrides
create policy "Anyone can view overrides" on schedule_overrides for select using (true);
create policy "Shul admins can create overrides" on schedule_overrides for insert with check (
  exists (select 1 from shul_admins where shul_admins.shul_id = schedule_overrides.shul_id and shul_admins.user_id = auth.uid())
);
create policy "Shul admins can update overrides" on schedule_overrides for update using (
  exists (select 1 from shul_admins where shul_admins.shul_id = schedule_overrides.shul_id and shul_admins.user_id = auth.uid())
);
create policy "Shul admins can delete overrides" on schedule_overrides for delete using (
  exists (select 1 from shul_admins where shul_admins.shul_id = schedule_overrides.shul_id and shul_admins.user_id = auth.uid())
);

-- 10. Updated_at triggers
create trigger shuls_updated_at before update on shuls
  for each row execute function update_updated_at_column();

create trigger shul_schedules_updated_at before update on shul_schedules
  for each row execute function update_updated_at_column();
