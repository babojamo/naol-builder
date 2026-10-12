begin;
create table public.app_admin_invites (
 email text primary key check(email=lower(btrim(email))),
 created_at timestamptz not null default now(),
 claimed_at timestamptz,
 claimed_by uuid references auth.users(id) on delete set null
);
alter table public.app_admin_invites enable row level security;
revoke all on public.app_admin_invites from public,anon,authenticated;
grant all on public.app_admin_invites to service_role;
-- Environment-specific invitations are provisioned by scripts/seed-admin.mjs.
create or replace function public.claim_verified_admin(p_user uuid,p_email text)
returns boolean language plpgsql security definer set search_path='' as $$
declare invited public.app_admin_invites;
begin
 select * into invited from public.app_admin_invites where email=lower(btrim(p_email)) and claimed_at is null for update;
 if not found then return exists(select 1 from public.app_admins where user_id=p_user); end if;
 if not exists(select 1 from auth.users u join public.profiles p on p.id=u.id where u.id=p_user and lower(u.email)=lower(btrim(p_email)) and p.email_verified_at is not null) then return false; end if;
 insert into public.app_admins(user_id,created_by) values(p_user,p_user) on conflict(user_id) do nothing;
 update public.app_admin_invites set claimed_at=now(),claimed_by=p_user where email=invited.email;
 return true;
end $$;
revoke all on function public.claim_verified_admin(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_verified_admin(uuid,text) to service_role;
commit;
