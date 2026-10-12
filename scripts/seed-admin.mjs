// Explicit deployment-only bootstrap. Never exposed to browser/runtime callers.
import {writeFileSync,unlinkSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
process.loadEnvFile('.env.migration');
const email=process.env.NAOL_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Set NAOL_BOOTSTRAP_ADMIN_EMAIL in the ignored migration environment.');
const path='work/admin-seed.sql';
writeFileSync(path,"insert into public.app_admin_invites(email) values('"+email.replaceAll("'","''")+"') on conflict(email) do nothing;");
try{const result=spawnSync(process.execPath,['scripts/supabase-manage.mjs','sql',process.argv[2],path],{stdio:'inherit'});process.exitCode=result.status??1;}finally{unlinkSync(path);}
