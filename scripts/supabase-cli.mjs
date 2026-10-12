import {spawnSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';
process.loadEnvFile('.env.migration');
const args=process.argv.slice(2);const types=args[0]==='types';
const result=spawnSync(process.execPath,['work/supabase-tools/node_modules/supabase/dist/supabase.js',...(types?['gen','types','typescript','--project-id',args[1],'--schema','public']:args)],{env:process.env,encoding:'utf8',stdio:types?'pipe':'inherit'});
if(result.status!==0)throw Error('Supabase CLI failed: '+(types?result.stderr:'see diagnostics'));
if(types){mkdirSync('lib/supabase',{recursive:true});writeFileSync('lib/supabase/database.types.ts',result.stdout);console.log('Database TypeScript types generated.');}
