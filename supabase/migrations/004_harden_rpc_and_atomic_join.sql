-- Harden helper RPC functions and add atomic space join

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

-- Replace old arg-based presence RPCs with auth.uid()-bound versions

drop function if exists update_user_presence(uuid);
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

drop function if exists set_user_offline(uuid);
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

revoke execute on function check_rate_limit(uuid, text, integer, integer) from public;
grant execute on function check_rate_limit(uuid, text, integer, integer) to authenticated, service_role;

revoke execute on function create_notification(uuid, text, uuid, text, text) from public;
grant execute on function create_notification(uuid, text, uuid, text, text) to authenticated, service_role;

revoke execute on function join_space_atomic(uuid) from public;
grant execute on function join_space_atomic(uuid) to authenticated, service_role;
