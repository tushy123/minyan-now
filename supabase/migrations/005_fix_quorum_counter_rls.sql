-- Fix quorum sync triggers to bypass row-level visibility constraints
-- so counts always reflect all members in a space.

create or replace function sync_space_quorum_insert()
returns trigger as $$
begin
  update public.spaces
  set quorum_count = (select count(*) from public.space_members where space_id = new.space_id),
      updated_at = now()
  where id = new.space_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function sync_space_quorum_delete()
returns trigger as $$
begin
  update public.spaces
  set quorum_count = (select count(*) from public.space_members where space_id = old.space_id),
      updated_at = now()
  where id = old.space_id;
  return old;
end;
$$ language plpgsql security definer set search_path = public;
