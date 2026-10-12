process.loadEnvFile('.env.migration');process.loadEnvFile('.env.supabase');
const ref=process.argv[2];if(!/^[a-z0-9]{20}$/.test(ref??''))throw Error('Verified project reference required');
if(!/^[a-f0-9]{64}$/.test(process.env.SYNC_KEY??''))throw Error('Configured sync key required');
const origin=new URL(process.env.SUPABASE_URL).origin;
const query=`create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
do $body$ declare secret_id uuid; begin
select id into secret_id from vault.secrets where name='naol_sync_key';
if secret_id is null then perform vault.create_secret('${process.env.SYNC_KEY}','naol_sync_key','NAOL hourly Flyff version check');
else perform vault.update_secret(secret_id,'${process.env.SYNC_KEY}','naol_sync_key','NAOL hourly Flyff version check'); end if;
end $body$;
select cron.schedule('naol-flyff-version-check','17 * * * *',$job$
select net.http_post(url:='${origin}/functions/v1/sync-flyff',headers:=jsonb_build_object('Content-Type','application/json','x-naol-sync-key',(select decrypted_secret from vault.decrypted_secrets where name='naol_sync_key')),body:='{}'::jsonb);
$job$);`;
const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query})});if(!r.ok)throw Error('Schedule configuration failed '+r.status);console.log('Hourly version check configured; sync credentials remain in Supabase Vault.');
