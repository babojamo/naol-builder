begin;
create schema if not exists naol_private;
revoke all on schema naol_private from public, anon, authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (length(btrim(name)) between 2 and 60),
 username text not null check (username ~ '^[a-z0-9_]{3,24}$'),
 email_verified_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index profiles_username_ci on public.profiles(lower(username));
create function naol_private.updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function naol_private.updated_at();
create function naol_private.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,name,username) values(new.id,btrim(new.raw_user_meta_data->>'name'),lower(btrim(new.raw_user_meta_data->>'username')));
 return new;
end $$;
create trigger naol_create_profile after insert on auth.users for each row execute function naol_private.create_profile();
create function naol_private.reset_verification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email is distinct from old.email then
 update public.profiles set email_verified_at=null where id=new.id;
 delete from public.email_verification_tokens where user_id=new.id;
 end if; return new;
end $$;
create trigger naol_email_changed after update of email on auth.users for each row execute function naol_private.reset_verification();
alter table public.profiles enable row level security;
create policy profile_owner_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profile_owner_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(name,username) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table public.builds (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 80),
 slug text not null unique default gen_random_uuid()::text,
 build_data jsonb not null check(jsonb_typeof(build_data)='object' and octet_length(build_data::text)<=32000),
 schema_version integer not null default 3 check(schema_version=3),
 visibility text not null default 'private' check(visibility in ('private','unlisted','public')),
 revision bigint not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(build_data->>'id'=id::text and build_data->>'name'=name and build_data->>'schemaVersion'='3')
);
create index builds_owner_updated on public.builds(user_id,updated_at desc);
create index builds_public_updated on public.builds(updated_at desc) where visibility='public';
create trigger builds_updated before update on public.builds for each row execute function naol_private.updated_at();
alter table public.builds enable row level security;
create policy builds_owner_read on public.builds for select to authenticated using(user_id=(select auth.uid()));
create policy builds_owner_delete on public.builds for delete to authenticated using(user_id=(select auth.uid()));
revoke all on public.builds from anon,authenticated;
grant select,delete on public.builds to authenticated;
grant all on public.builds to service_role;
-- Mutations serialize per owner and reject stale revisions. Direct client writes are denied.
create function public.save_build(p_build jsonb,p_expected_revision bigint,p_visibility text default null)
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
 if p_expected_revision is null or existing.revision<>p_expected_revision then raise exception 'Cloud build changed. Reload it or save a copy.' using errcode='40001'; end if;
 else
 if p_expected_revision is distinct from 0::bigint then raise exception 'Cloud build was deleted or changed. Save a copy.' using errcode='40001'; end if;
 if (select count(*) from public.builds where user_id=uid)>=100 then raise exception '100-build limit reached'; end if;
 end if;
 v:=coalesce(p_visibility,existing.visibility,'private');
 insert into public.builds(id,user_id,name,build_data,visibility) values(bid,uid,btrim(p_build->>'name'),jsonb_set(p_build,'{name}',to_jsonb(btrim(p_build->>'name'))),v)
 on conflict(id) do update set name=excluded.name,build_data=excluded.build_data,visibility=excluded.visibility,revision=public.builds.revision+1 returning * into saved;
 return saved;
end $$;
revoke all on function public.save_build(jsonb,bigint,text) from public,anon;
grant execute on function public.save_build(jsonb,bigint,text) to authenticated;
-- Unlisted builds cannot be enumerated by a table query. Only an exact ID/slug resolves one.
create function public.get_shared_build(p_key text) returns table(id uuid,name text,slug text,build_data jsonb,updated_at timestamptz)
language sql stable security definer set search_path='' as $$
 select b.id,b.name,b.slug,b.build_data,b.updated_at from public.builds b
 where (b.id::text=p_key or b.slug=p_key) and (b.visibility in ('unlisted','public') or b.user_id=auth.uid()) limit 1
$$;
revoke all on function public.get_shared_build(text) from public;
grant execute on function public.get_shared_build(text) to anon,authenticated;

create table public.user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferences jsonb not null default '{}' check(jsonb_typeof(preferences)='object' and octet_length(preferences::text)<=16000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create trigger preferences_updated before update on public.user_preferences for each row execute function naol_private.updated_at();
alter table public.user_preferences enable row level security;
create policy preferences_owner on public.user_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.user_preferences from anon,authenticated;
grant select,insert,update,delete on public.user_preferences to authenticated;
grant all on public.user_preferences to service_role;

create table public.email_verification_tokens (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),email text not null,
 expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now()
);
create index verification_user_created on public.email_verification_tokens(user_id,created_at desc);
alter table public.email_verification_tokens enable row level security;
revoke all on public.email_verification_tokens from public,anon,authenticated;
grant all on public.email_verification_tokens to service_role;
create function public.issue_verification(p_user uuid,p_email text,p_hash text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id=p_user for update;
 if not exists(select 1 from auth.users where id=p_user and email=p_email) then raise exception 'Account email changed'; end if;
 if exists(select 1 from public.email_verification_tokens where user_id=p_user and created_at>now()-interval '60 seconds') then raise exception 'Please wait 60 seconds before resending'; end if;
 if (select count(*) from public.email_verification_tokens where user_id=p_user and created_at>now()-interval '1 hour')>=5 then raise exception 'Verification email hourly limit reached'; end if;
 update public.email_verification_tokens set used_at=now() where user_id=p_user and used_at is null;
 insert into public.email_verification_tokens(user_id,email,token_hash,expires_at) values(p_user,p_email,p_hash,now()+interval '24 hours');
end $$;
create function public.consume_verification(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare token public.email_verification_tokens;
begin
 select * into token from public.email_verification_tokens where token_hash=p_hash for update;
 if not found or token.used_at is not null or token.expires_at<=now() then return false; end if;
 if not exists(select 1 from auth.users where id=token.user_id and email=token.email) then return false; end if;
 update public.profiles set email_verified_at=now() where id=token.user_id;
 update public.email_verification_tokens set used_at=now() where id=token.id;
 return true;
end $$;
revoke all on function public.issue_verification(uuid,text,text),public.consume_verification(text) from public,anon,authenticated;
grant execute on function public.issue_verification(uuid,text,text),public.consume_verification(text) to service_role;

create table public.flyff_generations (
 id uuid primary key default gen_random_uuid(),api_version integer not null,
 status text not null default 'staging' check(status in ('staging','ready','failed')),
 expected_counts jsonb not null default '{}',created_at timestamptz not null default now(),completed_at timestamptz
);
create table public.flyff_sync_state (
 id integer primary key check(id=1),active_generation uuid references public.flyff_generations(id),
 cached_version integer,checked_version integer,last_api_check timestamptz,last_successful_sync timestamptz,
 status text not null default 'empty',error text,record_counts jsonb not null default '{}',lease_until timestamptz
);
insert into public.flyff_sync_state(id) values(1);
create table public.flyff_entities (
 generation_id uuid not null references public.flyff_generations(id) on delete cascade,
 resource text not null check(resource in ('class','item','monster','skill','equipset','upgradelevelbonus','statawake','skillawake','raisedpet','dungeon')),
 entity_id text not null,raw_payload jsonb not null,normalized_payload jsonb not null,
 name text,category text,subcategory text,class_id integer,level integer,rank text,element text,two_handed boolean,
 is_active boolean not null default true,api_version integer not null,synced_at timestamptz not null default now(),
 primary key(generation_id,resource,entity_id)
);
create index flyff_resource on public.flyff_entities(generation_id,resource,is_active,entity_id);
create index flyff_item_filter on public.flyff_entities(generation_id,category,subcategory,class_id,level) where resource='item';
create index flyff_monster_filter on public.flyff_entities(generation_id,level,rank,element) where resource='monster';
create index flyff_skill_class on public.flyff_entities(generation_id,class_id) where resource='skill';
create index flyff_name on public.flyff_entities(generation_id,resource,lower(name) text_pattern_ops);
alter table public.flyff_generations enable row level security;
alter table public.flyff_sync_state enable row level security;
alter table public.flyff_entities enable row level security;
create policy flyff_state_read on public.flyff_sync_state for select to anon,authenticated using(true);
create policy flyff_active_read on public.flyff_entities for select to anon,authenticated using(generation_id=(select active_generation from public.flyff_sync_state where id=1));
revoke all on public.flyff_generations,public.flyff_sync_state,public.flyff_entities from anon,authenticated;
grant select on public.flyff_sync_state,public.flyff_entities to anon,authenticated;
grant all on public.flyff_generations,public.flyff_sync_state,public.flyff_entities to service_role;
create function public.claim_flyff_sync() returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.flyff_sync_state set lease_until=now()+interval '15 minutes',status='checking',error=null where id=1 and (lease_until is null or lease_until<now()) and (last_api_check is null or last_api_check<now()-interval '1 hour');
 return found;
end $$;
create function public.activate_flyff_generation(p_generation uuid) returns void language plpgsql security definer set search_path='' as $$
declare gen public.flyff_generations; state public.flyff_sync_state; entry record; n bigint;
begin
 select * into state from public.flyff_sync_state where id=1 for update;
 select * into gen from public.flyff_generations where id=p_generation for update;
 if not found or gen.status<>'staging' then raise exception 'Invalid staging generation'; end if;
 if state.cached_version is not null and gen.api_version<state.cached_version then raise exception 'Cannot activate an older API version'; end if;
 if (select count(*) from jsonb_object_keys(gen.expected_counts))<>10 then raise exception 'Incomplete resource manifest'; end if;
 for entry in select key,value from jsonb_each_text(gen.expected_counts) loop
 select count(*) into n from public.flyff_entities where generation_id=p_generation and resource=entry.key and is_active;
 if n<>entry.value::bigint or n=0 then raise exception 'Resource count mismatch: %',entry.key; end if;
 end loop;
 -- Carry forward removed records for historical builds, without making them current picker options.
 insert into public.flyff_entities(generation_id,resource,entity_id,raw_payload,normalized_payload,name,category,subcategory,class_id,level,rank,element,two_handed,is_active,api_version,synced_at)
 select p_generation,e.resource,e.entity_id,e.raw_payload,e.normalized_payload,e.name,e.category,e.subcategory,e.class_id,e.level,e.rank,e.element,e.two_handed,false,e.api_version,e.synced_at
 from public.flyff_entities e where e.generation_id=state.active_generation
 on conflict(generation_id,resource,entity_id) do nothing;
 update public.flyff_generations set status='ready',completed_at=now() where id=p_generation;
 update public.flyff_sync_state set active_generation=p_generation,cached_version=gen.api_version,checked_version=gen.api_version,last_successful_sync=now(),record_counts=gen.expected_counts,status='ready',error=null,lease_until=null where id=1;
end $$;
revoke all on function public.claim_flyff_sync(),public.activate_flyff_generation(uuid) from public,anon,authenticated;
grant execute on function public.claim_flyff_sync(),public.activate_flyff_generation(uuid) to service_role;
-- Trigger functions are never RPC entry points.
revoke all on all functions in schema naol_private from public,anon,authenticated;
commit;
