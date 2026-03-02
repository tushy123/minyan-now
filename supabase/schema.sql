-- MinyanNow Database Schema
-- Run this in Supabase SQL Editor to set up the database

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- ==================== PROFILES TABLE ====================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  reliability numeric not null default 1.0,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==================== SPACES TABLE ====================
create table if not exists spaces (
  id uuid primary key default extensions.gen_random_uuid(),
  host_id uuid references profiles(id) on delete set null,
  tefillah text not null check (tefillah in ('SHACHARIS','MINCHA','MAARIV')),
  start_time timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  map_x integer not null,
  map_y integer not null,
  address text,
  notes text,
  status text not null default 'OPEN' check (status in ('OPEN','LOCKED','STARTED','CANCELLED','EXPIRED')),
  capacity integer not null default 10,
  quorum_count integer not null default 0,
  presence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_start_time_idx on spaces (start_time);
create index if not exists spaces_status_idx on spaces (status);
create index if not exists spaces_host_id_idx on spaces (host_id);

-- ==================== SPACE MEMBERS TABLE ====================
create table if not exists space_members (
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create index if not exists space_members_space_id_idx on space_members (space_id);
create index if not exists space_members_user_id_idx on space_members (user_id);

-- ==================== SPACE MESSAGES TABLE (Chat) ====================
create table if not exists space_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists space_messages_space_id_idx on space_messages (space_id);
create index if not exists space_messages_created_at_idx on space_messages (created_at);

-- ==================== NOTIFICATIONS TABLE ====================
create table if not exists notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('SPACE_JOINED', 'QUORUM_REACHED', 'SPACE_STARTING', 'SPACE_CANCELLED', 'NEW_MESSAGE', 'NEARBY_SPACE')),
  space_id uuid references spaces(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications (user_id);
create index if not exists notifications_read_idx on notifications (user_id, read);

-- ==================== OFFICIAL MINYANIM TABLE ====================
create table if not exists official_minyanim (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  shul_name text not null,
  tefillah text not null check (tefillah in ('SHACHARIS','MINCHA','MAARIV')),
  start_time text not null, -- Format: "HH:MM AM/PM"
  lat double precision not null,
  lng double precision not null,
  address text not null,
  reliability numeric not null default 0.9,
  avg_members integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists official_minyanim_tefillah_idx on official_minyanim (tefillah);
create index if not exists official_minyanim_active_idx on official_minyanim (active);

-- ==================== SHULS (Official Shul Entities) ====================
create table if not exists shuls (
  id uuid primary key default extensions.gen_random_uuid(),
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

-- ==================== SHUL ADMINS ====================
create table if not exists shul_admins (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shul_id uuid not null references shuls(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','gabbai')),
  created_at timestamptz not null default now(),
  unique (user_id, shul_id)
);

create index if not exists shul_admins_user_idx on shul_admins (user_id);
create index if not exists shul_admins_shul_idx on shul_admins (shul_id);

-- ==================== SHUL SCHEDULES (Recurring Weekly Times) ====================
create table if not exists shul_schedules (
  id uuid primary key default extensions.gen_random_uuid(),
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

-- ==================== SCHEDULE OVERRIDES (Special Days) ====================
create table if not exists schedule_overrides (
  id uuid primary key default extensions.gen_random_uuid(),
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

-- ==================== USER NOTIFICATION PREFERENCES ====================
create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  notify_formation boolean not null default true,
  notify_quorum boolean not null default true,
  notify_only_undavened boolean not null default true,
  kaddish_priority boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ==================== RATE LIMITING TABLE ====================
create table if not exists rate_limits (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  action text not null, -- 'create_space', 'join_space', 'send_message'
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_user_action_idx on rate_limits (user_id, action, created_at);
create index if not exists rate_limits_ip_action_idx on rate_limits (ip_address, action, created_at);

-- Auto-cleanup old rate limit records (keep last 24 hours)
create or replace function cleanup_old_rate_limits()
returns void as $$
begin
  delete from rate_limits where created_at < now() - interval '24 hours';
end;
$$ language plpgsql;

-- ==================== ENABLE ROW LEVEL SECURITY ====================
alter table profiles enable row level security;
alter table spaces enable row level security;
alter table space_members enable row level security;
alter table space_messages enable row level security;
alter table notifications enable row level security;
alter table official_minyanim enable row level security;
alter table notification_preferences enable row level security;
alter table rate_limits enable row level security;

-- ==================== DROP EXISTING POLICIES ====================
drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles can be inserted by owner" on profiles;
drop policy if exists "Profiles can be updated by owner" on profiles;

drop policy if exists "Spaces are viewable by everyone" on spaces;
drop policy if exists "Spaces can be created by authenticated users" on spaces;
drop policy if exists "Spaces can be updated by host" on spaces;
drop policy if exists "Spaces can be deleted by host" on spaces;

drop policy if exists "Space members are viewable by owner" on space_members;
drop policy if exists "Space members viewable by space host" on space_members;
drop policy if exists "Space members viewable by participants" on space_members;
drop policy if exists "Space members can be inserted by owner" on space_members;
drop policy if exists "Space members can be deleted by owner" on space_members;
drop policy if exists "Space members can be deleted by host" on space_members;

drop policy if exists "Messages viewable by space members" on space_messages;
drop policy if exists "Messages can be inserted by space members" on space_messages;

drop policy if exists "Notifications viewable by owner" on notifications;
drop policy if exists "Notifications can be updated by owner" on notifications;

drop policy if exists "Official minyanim viewable by everyone" on official_minyanim;

drop policy if exists "Notification preferences viewable by owner" on notification_preferences;
drop policy if exists "Notification preferences can be inserted by owner" on notification_preferences;
drop policy if exists "Notification preferences can be updated by owner" on notification_preferences;

drop policy if exists "Rate limits can be inserted by authenticated users" on rate_limits;

-- ==================== PROFILES POLICIES ====================
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Profiles can be inserted by owner" on profiles
  for insert with check (auth.uid() = id);

create policy "Profiles can be updated by owner" on profiles
  for update using (auth.uid() = id);

-- ==================== SPACES POLICIES ====================
create policy "Spaces are viewable by everyone" on spaces
  for select using (true);

create policy "Spaces can be created by authenticated users" on spaces
  for insert with check (auth.uid() = host_id);

create policy "Spaces can be updated by host" on spaces
  for update using (auth.uid() = host_id);

create policy "Spaces can be deleted by host" on spaces
  for delete using (auth.uid() = host_id);

-- ==================== SPACE MEMBERS POLICIES (FIXED) ====================
-- Users can see their own memberships
create policy "Space members viewable by participants" on space_members
  for select using (auth.uid() = user_id);

-- Hosts can see all members of their spaces
create policy "Space members viewable by space host" on space_members
  for select using (
    exists (
      select 1 from spaces
      where spaces.id = space_members.space_id
      and spaces.host_id = auth.uid()
    )
  );

-- Users can join spaces (insert their own membership)
create policy "Space members can be inserted by owner" on space_members
  for insert with check (auth.uid() = user_id);

-- Users can leave spaces (delete their own membership)
create policy "Space members can be deleted by owner" on space_members
  for delete using (auth.uid() = user_id);

-- Hosts can remove members from their spaces
create policy "Space members can be deleted by host" on space_members
  for delete using (
    exists (
      select 1 from spaces
      where spaces.id = space_members.space_id
      and spaces.host_id = auth.uid()
    )
  );

-- ==================== SPACE MESSAGES POLICIES ====================
-- Members of a space can view messages
create policy "Messages viewable by space members" on space_messages
  for select using (
    exists (
      select 1 from space_members
      where space_members.space_id = space_messages.space_id
      and space_members.user_id = auth.uid()
    )
    or exists (
      select 1 from spaces
      where spaces.id = space_messages.space_id
      and spaces.host_id = auth.uid()
    )
  );

-- Members can send messages to spaces they've joined
create policy "Messages can be inserted by space members" on space_messages
  for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from space_members
        where space_members.space_id = space_messages.space_id
        and space_members.user_id = auth.uid()
      )
      or exists (
        select 1 from spaces
        where spaces.id = space_messages.space_id
        and spaces.host_id = auth.uid()
      )
    )
  );

-- ==================== NOTIFICATIONS POLICIES ====================
create policy "Notifications viewable by owner" on notifications
  for select using (auth.uid() = user_id);

create policy "Notifications can be updated by owner" on notifications
  for update using (auth.uid() = user_id);

-- ==================== OFFICIAL MINYANIM POLICIES ====================
create policy "Official minyanim viewable by everyone" on official_minyanim
  for select using (true);

-- ==================== NOTIFICATION PREFERENCES POLICIES ====================
create policy "Notification preferences viewable by owner" on notification_preferences
  for select using (auth.uid() = user_id);

create policy "Notification preferences can be inserted by owner" on notification_preferences
  for insert with check (auth.uid() = user_id);

create policy "Notification preferences can be updated by owner" on notification_preferences
  for update using (auth.uid() = user_id);

-- ==================== RATE LIMITS POLICIES ====================
create policy "Rate limits can be inserted by authenticated users" on rate_limits
  for insert with check (auth.uid() is not null);

-- ==================== TRIGGERS ====================

-- Sync quorum count on member insert
create or replace function sync_space_quorum_insert()
returns trigger as $$
begin
  update spaces
  set quorum_count = (select count(*) from space_members where space_id = new.space_id),
      updated_at = now()
  where id = new.space_id;
  return new;
end;
$$ language plpgsql;

-- Sync quorum count on member delete
create or replace function sync_space_quorum_delete()
returns trigger as $$
begin
  update spaces
  set quorum_count = (select count(*) from space_members where space_id = old.space_id),
      updated_at = now()
  where id = old.space_id;
  return old;
end;
$$ language plpgsql;

drop trigger if exists space_members_insert on space_members;
create trigger space_members_insert
after insert on space_members
for each row execute function sync_space_quorum_insert();

drop trigger if exists space_members_delete on space_members;
create trigger space_members_delete
after delete on space_members
for each row execute function sync_space_quorum_delete();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  -- Also create default notification preferences
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Update updated_at timestamp automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();

drop trigger if exists spaces_updated_at on spaces;
create trigger spaces_updated_at
before update on spaces
for each row execute function update_updated_at_column();

drop trigger if exists official_minyanim_updated_at on official_minyanim;
create trigger official_minyanim_updated_at
before update on official_minyanim
for each row execute function update_updated_at_column();

drop trigger if exists notification_preferences_updated_at on notification_preferences;
create trigger notification_preferences_updated_at
before update on notification_preferences
for each row execute function update_updated_at_column();

-- ==================== HELPER FUNCTIONS ====================

-- Check rate limit (returns true if allowed, false if rate limited)
create or replace function check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_requests integer,
  p_window_minutes integer
)
returns boolean as $$
declare
  actor_user_id uuid := auth.uid();
  actor_role text := auth.role();
  request_count integer;
begin
  if actor_role <> 'service_role' then
    if actor_user_id is null then
      raise exception 'Authentication required';
    end if;
    if p_user_id is distinct from actor_user_id then
      raise exception 'Cannot check rate limit for another user';
    end if;
  elsif p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  select count(*) into request_count
  from rate_limits
  where user_id = p_user_id
    and action = p_action
    and created_at > now() - (p_window_minutes || ' minutes')::interval;

  if request_count >= p_max_requests then
    return false;
  end if;

  insert into rate_limits (user_id, action)
  values (p_user_id, p_action);

  return true;
end;
$$ language plpgsql security definer set search_path = public;

-- Create notification helper
create or replace function create_notification(
  p_user_id uuid,
  p_type text,
  p_space_id uuid,
  p_title text,
  p_body text default null
)
returns uuid as $$
declare
  actor_user_id uuid := auth.uid();
  actor_role text := auth.role();
  notification_id uuid;
begin
  if actor_role <> 'service_role' then
    if actor_user_id is null then
      raise exception 'Authentication required';
    end if;
    if p_user_id is distinct from actor_user_id then
      raise exception 'Cannot create notifications for another user';
    end if;
  elsif p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  insert into notifications (user_id, type, space_id, title, body)
  values (p_user_id, p_type, p_space_id, p_title, p_body)
  returning id into notification_id;

  return notification_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Atomically join a space while enforcing capacity under row lock.
create or replace function join_space_atomic(p_space_id uuid)
returns text as $$
declare
  actor_user_id uuid := auth.uid();
  v_capacity integer;
  v_status text;
  v_members integer;
begin
  if actor_user_id is null then
    return 'NOT_AUTHENTICATED';
  end if;

  select capacity, status
  into v_capacity, v_status
  from spaces
  where id = p_space_id
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  if v_status <> 'OPEN' then
    return 'SPACE_CLOSED';
  end if;

  if exists (
    select 1
    from space_members
    where space_id = p_space_id
      and user_id = actor_user_id
  ) then
    return 'ALREADY_JOINED';
  end if;

  select count(*) into v_members
  from space_members
  where space_id = p_space_id;

  if v_members >= v_capacity then
    return 'SPACE_FULL';
  end if;

  insert into space_members (space_id, user_id)
  values (p_space_id, actor_user_id);

  return 'OK';
exception
  when unique_violation then
    return 'ALREADY_JOINED';
end;
$$ language plpgsql security definer set search_path = public;

-- ==================== SEED OFFICIAL MINYANIM ====================
-- Only insert if table is empty
insert into official_minyanim (name, shul_name, tefillah, start_time, lat, lng, address, reliability, avg_members)
select * from (values
  ('Kotel Mincha', 'Western Wall', 'MINCHA', '1:30 PM', 31.7767, 35.2345, 'Western Wall Plaza, Jerusalem', 0.98, 50),
  ('Great Synagogue Shacharit', 'Great Synagogue', 'SHACHARIS', '7:00 AM', 31.7812, 35.2176, '56 King George St, Jerusalem', 0.95, 30),
  ('Great Synagogue Mincha', 'Great Synagogue', 'MINCHA', '1:15 PM', 31.7812, 35.2176, '56 King George St, Jerusalem', 0.92, 25),
  ('Great Synagogue Maariv', 'Great Synagogue', 'MAARIV', '7:30 PM', 31.7812, 35.2176, '56 King George St, Jerusalem', 0.90, 20),
  ('Belz Mincha', 'Belz World Center', 'MINCHA', '12:45 PM', 31.7891, 35.2089, 'Kiryat Belz, Jerusalem', 0.97, 100),
  ('Young Israel Mincha', 'Young Israel', 'MINCHA', '1:00 PM', 31.7756, 35.2234, 'Rehavia, Jerusalem', 0.88, 15)
) as t(name, shul_name, tefillah, start_time, lat, lng, address, reliability, avg_members)
where not exists (select 1 from official_minyanim limit 1);

-- ==================== FRIENDSHIPS TABLE ====================
create table if not exists friendships (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  friend_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

create index if not exists friendships_user_id_idx on friendships (user_id);
create index if not exists friendships_friend_id_idx on friendships (friend_id);

-- ==================== FRIEND REQUESTS TABLE ====================
create table if not exists friend_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);

create index if not exists friend_requests_to_user_idx on friend_requests (to_user_id, status);
create index if not exists friend_requests_from_user_idx on friend_requests (from_user_id);

-- ==================== USER PRESENCE TABLE ====================
create table if not exists user_presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  last_seen timestamptz not null default now(),
  is_online boolean not null default true
);

create index if not exists user_presence_online_idx on user_presence (is_online) where is_online = true;

-- ==================== MINYAN INVITES TABLE ====================
create table if not exists minyan_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(space_id, from_user_id, to_user_id)
);

create index if not exists minyan_invites_to_user_idx on minyan_invites (to_user_id, status);

-- ==================== ENABLE RLS FOR NEW TABLES ====================
alter table friendships enable row level security;
alter table friend_requests enable row level security;
alter table user_presence enable row level security;
alter table minyan_invites enable row level security;
alter table shuls enable row level security;
alter table shul_admins enable row level security;
alter table shul_schedules enable row level security;
alter table schedule_overrides enable row level security;

-- ==================== SHULS POLICIES ====================
create policy "Anyone can view shuls" on shuls
  for select using (true);

create policy "Authenticated users can create shuls" on shuls
  for insert with check (auth.uid() is not null);

create policy "Shul admins can update their shul" on shuls
  for update using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = shuls.id
      and shul_admins.user_id = auth.uid()
    )
  );

create policy "Shul owners can delete their shul" on shuls
  for delete using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = shuls.id
      and shul_admins.user_id = auth.uid()
      and shul_admins.role = 'owner'
    )
  );

-- ==================== SHUL ADMINS POLICIES ====================
create policy "Anyone can view shul admins" on shul_admins
  for select using (true);

create policy "Authenticated users can become shul admin on insert" on shul_admins
  for insert with check (auth.uid() = user_id);

create policy "Shul owners can manage admins" on shul_admins
  for delete using (
    exists (
      select 1 from shul_admins sa
      where sa.shul_id = shul_admins.shul_id
      and sa.user_id = auth.uid()
      and sa.role = 'owner'
    )
  );

-- ==================== SHUL SCHEDULES POLICIES ====================
create policy "Anyone can view schedules" on shul_schedules
  for select using (true);

create policy "Shul admins can create schedules" on shul_schedules
  for insert with check (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = shul_schedules.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

create policy "Shul admins can update schedules" on shul_schedules
  for update using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = shul_schedules.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

create policy "Shul admins can delete schedules" on shul_schedules
  for delete using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = shul_schedules.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

-- ==================== SCHEDULE OVERRIDES POLICIES ====================
create policy "Anyone can view overrides" on schedule_overrides
  for select using (true);

create policy "Shul admins can create overrides" on schedule_overrides
  for insert with check (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = schedule_overrides.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

create policy "Shul admins can update overrides" on schedule_overrides
  for update using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = schedule_overrides.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

create policy "Shul admins can delete overrides" on schedule_overrides
  for delete using (
    exists (
      select 1 from shul_admins
      where shul_admins.shul_id = schedule_overrides.shul_id
      and shul_admins.user_id = auth.uid()
    )
  );

-- ==================== FRIENDSHIPS POLICIES ====================
create policy "Users can view their own friendships" on friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendships" on friendships
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own friendships" on friendships
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- ==================== FRIEND REQUESTS POLICIES ====================
create policy "Users can view requests they sent or received" on friend_requests
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send friend requests" on friend_requests
  for insert with check (auth.uid() = from_user_id);

create policy "Users can update requests sent to them" on friend_requests
  for update using (auth.uid() = to_user_id);

create policy "Users can delete requests they sent" on friend_requests
  for delete using (auth.uid() = from_user_id);

-- ==================== USER PRESENCE POLICIES ====================
create policy "Anyone can view online status" on user_presence
  for select using (true);

create policy "Users can update their own presence" on user_presence
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own presence status" on user_presence
  for update using (auth.uid() = user_id);

-- ==================== MINYAN INVITES POLICIES ====================
create policy "Users can view invites they sent or received" on minyan_invites
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send invites" on minyan_invites
  for insert with check (auth.uid() = from_user_id);

create policy "Users can update invites sent to them" on minyan_invites
  for update using (auth.uid() = to_user_id);

-- ==================== FRIEND REQUEST TRIGGERS ====================
-- When a friend request is accepted, create the friendship
create or replace function handle_friend_request_accepted()
returns trigger as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    -- Create bidirectional friendship
    insert into friendships (user_id, friend_id)
    values (new.from_user_id, new.to_user_id)
    on conflict do nothing;

    insert into friendships (user_id, friend_id)
    values (new.to_user_id, new.from_user_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_friend_request_accepted on friend_requests;
create trigger on_friend_request_accepted
after update on friend_requests
for each row execute function handle_friend_request_accepted();

-- Update friend_requests updated_at
drop trigger if exists friend_requests_updated_at on friend_requests;
create trigger friend_requests_updated_at
before update on friend_requests
for each row execute function update_updated_at_column();

-- ==================== HELPER FUNCTIONS FOR FRIENDS ====================
-- Get online user count
create or replace function get_online_user_count()
returns integer as $$
begin
  return (
    select count(*)::integer
    from user_presence
    where is_online = true
      and last_seen > now() - interval '5 minutes'
  );
end;
$$ language plpgsql security invoker;

-- Update user presence (upsert)
create or replace function update_user_presence()
returns void as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into user_presence (user_id, last_seen, is_online)
  values (actor_user_id, now(), true)
  on conflict (user_id) do update
  set last_seen = now(), is_online = true;
end;
$$ language plpgsql security invoker;

-- Set user offline
create or replace function set_user_offline()
returns void as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null then
    raise exception 'Authentication required';
  end if;

  update user_presence
  set is_online = false
  where user_id = actor_user_id;
end;
$$ language plpgsql security invoker;

revoke execute on function check_rate_limit(uuid, text, integer, integer) from public;
grant execute on function check_rate_limit(uuid, text, integer, integer) to authenticated, service_role;

revoke execute on function create_notification(uuid, text, uuid, text, text) from public;
grant execute on function create_notification(uuid, text, uuid, text, text) to authenticated, service_role;

revoke execute on function join_space_atomic(uuid) from public;
grant execute on function join_space_atomic(uuid) to authenticated, service_role;

-- ==================== ENABLE REALTIME ====================
-- Enable realtime for tables that need live updates
alter publication supabase_realtime add table spaces;
alter publication supabase_realtime add table space_members;
alter publication supabase_realtime add table space_messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table friendships;
alter publication supabase_realtime add table friend_requests;
alter publication supabase_realtime add table user_presence;
alter publication supabase_realtime add table minyan_invites;
