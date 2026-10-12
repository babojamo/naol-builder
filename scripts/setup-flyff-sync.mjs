import {randomBytes} from 'node:crypto';import {appendFileSync,writeFileSync} from 'node:fs';
process.loadEnvFile('.env.migration');process.loadEnvFile('.env.supabase');
const ref=process.argv[2];if(!/^[a-z0-9]{20}$/.test(ref??''))throw Error('Verified project reference required');
const key=process.env.SYNC_KEY??randomBytes(32).toString('hex');if(!process.env.SYNC_KEY)appendFileSync('.env.supabase','SYNC_KEY='+key+'\n');
const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`,{method:'POST',headers:{Authorization:'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([{name:'SYNC_KEY',value:key}])});if(!r.ok)throw Error('Sync secret configuration failed '+r.status);
writeFileSync('.dev.vars',`SUPABASE_URL=${process.env.SUPABASE_URL}\nSUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}\n`);
const sync=await fetch(process.env.SUPABASE_URL+'/functions/v1/sync-flyff',{method:'POST',headers:{'x-naol-sync-key':key,'Content-Type':'application/json'},body:'{}'});console.log(JSON.stringify({status:sync.status,result:await sync.json()}));
