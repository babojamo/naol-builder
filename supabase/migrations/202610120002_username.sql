create function public.username_available(p_username text) returns boolean language sql stable security definer set search_path='' as $$
 select lower(p_username) ~ '^[a-z0-9_]{3,24}$' and not exists(select 1 from public.profiles where username=lower(p_username))
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon,authenticated;
