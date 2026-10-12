begin;
create or replace function public.admin_dashboard(p_admin uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.app_admins where user_id=p_admin) then raise exception 'Administrator access required' using errcode='42501'; end if;
 with users as (
  select p.id,p.username,p.name,au.email,p.email_verified_at,p.created_at,
   coalesce(q.usage_used,0) as ai_used,coalesce(q.usage_limit,2) as ai_limit,coalesce(q.ai_enabled,true) as ai_enabled,
   coalesce(i.import_count,0) as ai_imports
  from public.profiles p join auth.users au on au.id=p.id
  left join public.ai_user_quotas q on q.user_id=p.id
  left join lateral (select count(*)::integer import_count from public.ai_build_imports a where a.user_id=p.id and a.status='completed') i on true
 ), imports as (select * from public.ai_build_imports)
 select jsonb_build_object(
  'stats',jsonb_build_object(
   'totalUsers',(select count(*) from users),
   'newToday',(select count(*) from users where created_at>=date_trunc('day',now())),
   'new7Days',(select count(*) from users where created_at>=now()-interval '7 days'),
   'new30Days',(select count(*) from users where created_at>=now()-interval '30 days'),
   'verifiedUsers',(select count(*) from users where email_verified_at is not null),
   'unverifiedUsers',(select count(*) from users where email_verified_at is null),
   'aiTotal',(select count(*) from imports where status='completed'),
   'aiToday',(select count(*) from imports where status='completed' and completed_at>=date_trunc('day',now())),
   'ai7Days',(select count(*) from imports where status='completed' and completed_at>=now()-interval '7 days'),
   'ai30Days',(select count(*) from imports where status='completed' and completed_at>=now()-interval '30 days'),
   'aiRemaining',(select coalesce(sum(greatest(usage_limit-usage_used,0)),0) from public.ai_user_quotas),
   'aiErrors',(select count(*) from imports where status='failed')
  ),
  'users',(select coalesce(jsonb_agg(to_jsonb(users) order by created_at desc),'[]'::jsonb) from users),
  'recentErrors',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'user_id',user_id,'error_code',error_code,'error_message',error_message,'created_at',created_at) order by created_at desc),'[]'::jsonb) from (select * from public.ai_build_imports where status='failed' order by created_at desc limit 50) e),
  'auditLog',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'admin_user_id',admin_user_id,'target_user_id',target_user_id,'action',action,'before_data',before_data,'after_data',after_data,'created_at',created_at) order by created_at desc),'[]'::jsonb) from (select * from public.admin_audit_log order by created_at desc limit 100) a)
 ) into result;
 return result;
end $$;
revoke all on function public.admin_dashboard(uuid) from public,anon,authenticated;
grant execute on function public.admin_dashboard(uuid) to service_role;
commit;
