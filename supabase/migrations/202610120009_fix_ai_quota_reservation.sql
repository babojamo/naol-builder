create or replace function public.reserve_ai_build_usage(p_user_id uuid,p_image_count integer,p_model text)
returns table(import_id uuid,usage_used integer,usage_limit integer)
language plpgsql security definer set search_path='' as $$
declare q public.ai_user_quotas; result_id uuid;
begin
 if p_image_count<1 or p_image_count>8 then raise exception 'Upload between 1 and 8 screenshots' using errcode='22023'; end if;
 insert into public.ai_user_quotas(user_id) values(p_user_id) on conflict(user_id) do nothing;
 select * into q from public.ai_user_quotas where user_id=p_user_id for update;
 if not q.ai_enabled then raise exception 'AI character import is disabled for this account' using errcode='PT403'; end if;
 if q.usage_used>=q.usage_limit then raise exception 'No AI imports remain' using errcode='PT429'; end if;
 update public.ai_user_quotas as quota
  set usage_used=quota.usage_used+1
  where quota.user_id=p_user_id
  returning quota.* into q;
 insert into public.ai_build_imports(user_id,status,image_count,model_used) values(p_user_id,'reserved',p_image_count,p_model) returning id into result_id;
 return query select result_id,q.usage_used,q.usage_limit;
end $$;

revoke all on function public.reserve_ai_build_usage(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_ai_build_usage(uuid,integer,text) to service_role;
