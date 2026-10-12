-- Production integration check. All test reservations and quota changes roll back.
begin;
do $$
declare uid uuid; first_id uuid; second_id uuid; used integer;
begin
 select id into uid from auth.users order by created_at limit 1;
 if uid is null then raise exception 'An existing account is required for this rollback-only check'; end if;
 insert into public.ai_user_quotas(user_id) values(uid) on conflict(user_id) do nothing;
 update public.ai_user_quotas set usage_used=0,usage_limit=2,ai_enabled=true where user_id=uid;
 select import_id into first_id from public.reserve_ai_build_usage(uid,1,'integration-check');
 perform public.record_ai_build_analysis(first_id,'{"equipment":[]}'::jsonb,'{"equipment":[]}'::jsonb);
 perform public.refund_ai_build_import(first_id,'late_save_error','Should not refund valid analysis');
 select usage_used into used from public.ai_user_quotas where user_id=uid;
 if used<>1 then raise exception 'Valid analysis was incorrectly refunded'; end if;
 perform public.complete_ai_build_import(first_id,'{"equipment":[]}'::jsonb,'{"equipment":[]}'::jsonb);
 perform public.complete_ai_build_import(first_id,'{"equipment":[]}'::jsonb,'{"equipment":[]}'::jsonb);
 select import_id into second_id from public.reserve_ai_build_usage(uid,1,'integration-check');
 perform public.refund_ai_build_import(second_id,'provider_timeout','No valid result');
 perform public.refund_ai_build_import(second_id,'provider_timeout','Idempotent retry');
 select usage_used into used from public.ai_user_quotas where user_id=uid;
 if used<>1 then raise exception 'Technical failure refund was not idempotent'; end if;
 if has_function_privilege('authenticated','public.record_ai_build_analysis(uuid,jsonb,jsonb)','EXECUTE') or has_function_privilege('anon','public.record_ai_build_analysis(uuid,jsonb,jsonb)','EXECUTE') then raise exception 'Analysis bookkeeping must be service-only'; end if;
end $$;
rollback;
select 'consumption, refund idempotency, completion retry and service-only grants passed; all test writes rolled back' as result;
