-- Business conflicts return HTTP 409 rather than a retryable database failure.
create or replace function public.save_build(p_build jsonb,p_expected_revision bigint,p_visibility text default null)
returns public.builds language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); bid uuid; existing public.builds; saved public.builds; v text;
begin
 if uid is null then raise exception 'Sign in to save builds' using errcode='42501'; end if;
 if jsonb_typeof(p_build)<>'object' or octet_length(p_build::text)>32000 or p_build->>'schemaVersion'<>'3' then raise exception 'Invalid build payload' using errcode='22023'; end if;
 bid:=(p_build->>'id')::uuid;
 perform 1 from public.profiles where id=uid for update;
 select * into existing from public.builds where id=bid for update;
 if found then
 if existing.user_id<>uid then raise exception 'Build belongs to another account' using errcode='42501'; end if;
 if p_expected_revision is null or existing.revision<>p_expected_revision then raise exception 'Cloud build changed. Reload it or save a copy.' using errcode='PT409'; end if;
 else
 if p_expected_revision is distinct from 0::bigint then raise exception 'Cloud build was deleted or changed. Save a copy.' using errcode='PT409'; end if;
 if (select count(*) from public.builds where user_id=uid)>=100 then raise exception '100-build limit reached'; end if;
 end if;
 v:=coalesce(p_visibility,existing.visibility,'private');
 insert into public.builds(id,user_id,name,build_data,visibility) values(bid,uid,btrim(p_build->>'name'),jsonb_set(p_build,'{name}',to_jsonb(btrim(p_build->>'name'))),v)
 on conflict(id) do update set name=excluded.name,build_data=excluded.build_data,visibility=excluded.visibility,revision=public.builds.revision+1 returning * into saved;
 return saved;
end $$;
