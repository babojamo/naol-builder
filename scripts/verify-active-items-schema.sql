do $test$
declare sample jsonb;
begin
 select build_data into sample from public.builds where naol_private.valid_build(build_data) limit 1;
 if sample is null then raise exception 'No representative build for schema check'; end if;
 if not naol_private.valid_build(sample-'activeItems') then raise exception 'Legacy build rejected'; end if;
 if not naol_private.valid_build(jsonb_set(sample,'{activeItems}','[{"itemId":2265}]')) then raise exception 'Active Item reference rejected'; end if;
 if naol_private.valid_build(jsonb_set(sample,'{activeItems}','[{"itemId":0}]')) then raise exception 'Invalid reference accepted'; end if;
end $test$;
select 'Legacy and Active Items save schema checks passed' as result;
