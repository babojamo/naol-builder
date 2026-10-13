begin;
alter table public.flyff_fashion_blessing_rules add column if not exists rate boolean;
-- Canonical parameter fixes scoped to fashion rules; saved legacy line names resolve in lib/fashion.ts.
update public.flyff_fashion_blessing_rules set parameter='decreasedcastingtime' where game_version='1.5.5' and parameter='castingspeed';
update public.flyff_fashion_blessing_rules set parameter='pveincomingdamage' where game_version='1.5.5' and parameter='pvedamagereduction';
-- Official 1.5.5 table and pinned Blessings.json: PvE amounts are flat, not percentage bonuses.
update public.flyff_fashion_blessing_rules set rate=case
 when parameter in ('str','sta','dex','int','attack','def','maxhp','maxmp','maxfp','magicdefense','pvedamage','pveincomingdamage') then false
 when parameter in ('criticalchance','criticaldamage','speed','attackspeed','decreasedcastingtime','actionspeed','parry','meleeblock','rangedblock') then true
 else null end
where game_version='1.5.5';
do $$ begin
 if exists(select 1 from public.flyff_fashion_blessing_rules where active and rate is null) then
  raise exception 'Active fashion rule operation is unknown; verify before publishing';
 end if;
end $$;
commit;
