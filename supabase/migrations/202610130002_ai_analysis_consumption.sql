begin;
alter table public.ai_build_imports add column analysis_succeeded_at timestamptz;
update public.ai_build_imports set analysis_succeeded_at=coalesce(completed_at,created_at) where status='completed' and result_json is not null;

create or replace function public.record_ai_build_analysis(p_import_id uuid,p_result jsonb,p_normalized jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.ai_build_imports set analysis_succeeded_at=coalesce(analysis_succeeded_at,now()),result_json=p_result,normalized_json=p_normalized,status=case when status='completed' then status else 'processing' end
 where id=p_import_id and status in ('reserved','processing','completed');
 if not found then raise exception 'AI import reservation is no longer active' using errcode='PT409'; end if;
end $$;

create or replace function public.complete_ai_build_import(p_import_id uuid,p_result jsonb,p_normalized jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.ai_build_imports set status='completed',analysis_succeeded_at=coalesce(analysis_succeeded_at,now()),result_json=p_result,normalized_json=p_normalized,completed_at=coalesce(completed_at,now()),error_code=null,error_message=null
 where id=p_import_id and status in ('reserved','processing','completed');
 if not found then raise exception 'AI import reservation is no longer active' using errcode='PT409'; end if;
end $$;

create or replace function public.refund_ai_build_import(p_import_id uuid,p_error_code text,p_error_message text)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;
begin
 select user_id into uid from public.ai_build_imports where id=p_import_id and status in ('reserved','processing') and analysis_succeeded_at is null for update;
 if not found then return; end if;
 update public.ai_build_imports set status='failed',error_code=left(p_error_code,80),error_message=left(p_error_message,300),completed_at=now() where id=p_import_id;
 update public.ai_user_quotas set usage_used=greatest(0,usage_used-1) where user_id=uid;
end $$;
revoke all on function public.record_ai_build_analysis(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.record_ai_build_analysis(uuid,jsonb,jsonb) to service_role;
commit;
