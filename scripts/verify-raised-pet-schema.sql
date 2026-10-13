-- Read-only smoke checks against an existing representative production build.
do $test$
declare sample jsonb; modern jsonb := '{"id":5851,"tier":"S","levels":{"F":1,"E":2,"D":3,"C":4,"B":5,"A":7,"S":9}}';
begin
 select build_data into sample from public.builds where naol_private.valid_build(build_data) limit 1;
 if sample is null then raise exception 'No representative build available for pet save-schema smoke test'; end if;
 if not naol_private.valid_build(jsonb_set(sample,'{pet}',modern)) then raise exception 'Tier-aware pet rejected'; end if;
 if not naol_private.valid_build(jsonb_set(sample,'{pet}','{"id":5851,"level":8}')) then raise exception 'Legacy pet rejected'; end if;
 if naol_private.valid_build(jsonb_set(sample,'{pet}',jsonb_set(modern,'{levels,S}','10'))) then raise exception 'Invalid S roll accepted'; end if;
 if naol_private.valid_build(jsonb_set(sample,'{pet}',jsonb_set(modern,'{levels,A}','8'))) then raise exception 'Invalid A roll accepted'; end if;
 if not naol_private.valid_build(jsonb_set(sample,'{pet}','null')) then raise exception 'Empty pet rejected'; end if;
end $test$;
select 'Legacy, tier-aware, empty and invalid pet schema checks passed' as result;
