do $test$
declare sample jsonb; configured jsonb;
begin
 select build_data into sample from public.builds where naol_private.valid_build(build_data) limit 1;
 if sample is null then raise exception 'No representative build for schema check'; end if;
 if not naol_private.valid_build(sample-'selfBuffs'-'simulationSkill'-'targetHealthPercent') then raise exception 'Legacy schema-3 build rejected'; end if;
 configured=sample||'{"simulationSkill":{"id":3974,"level":1},"selfBuffs":[{"id":12579,"level":5}],"targetHealthPercent":24}'::jsonb;
 if not naol_private.valid_build(configured) then raise exception 'New skill usage fields rejected'; end if;
 if not naol_private.valid_build(configured||jsonb_build_object('opponentBuild',configured-'opponentBuild')) then raise exception 'Opponent skill usage fields rejected'; end if;
 if naol_private.valid_build(jsonb_set(configured,'{selfBuffs}','[{"id":0,"level":5}]')) then raise exception 'Invalid self buff accepted'; end if;
 if naol_private.valid_build(jsonb_set(configured,'{targetHealthPercent}','101')) then raise exception 'Invalid HP context accepted'; end if;
 if naol_private.valid_build(configured||'{"unexpectedField":true}') then raise exception 'Unknown top-level field accepted'; end if;
end $test$;
select 'Legacy, explicit skill, self buff and opponent schema checks passed; no builds changed' as result;
