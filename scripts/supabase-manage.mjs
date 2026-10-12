// Local deployment tool. Credentials stay in ignored env files/process memory.
import {readFileSync,writeFileSync} from 'node:fs';
process.loadEnvFile('.env.migration');
const [command,ref,arg]=process.argv.slice(2);
if(!/^[a-z0-9]{20}$/.test(ref??''))throw Error('Supply the verified Supabase project reference');
export async function management(path,body,method){
 const r=await fetch('https://api.supabase.com/v1/projects/'+ref+path,{method:method??(body?'POST':'GET'),headers:{Authorization:'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw Error('Supabase management '+r.status+' for '+path);
 return r.status===204?null:await r.json();
}
if(command==='inspect'){
 const auth=await management('/config/auth');
 const secrets=await management('/secrets');
 const tables=await management('/database/query',{query:"select tablename from pg_tables where schemaname='public' order by tablename"});
 console.log(JSON.stringify({auth:{emailEnabled:auth.external_email_enabled,confirmEmail:!auth.mailer_autoconfirm,siteURL:auth.site_url,redirects:auth.uri_allow_list,smtpConfigured:!!auth.smtp_host&&!!auth.smtp_pass},secretNames:secrets.map(x=>x.name),tables}));
}else if(command==='keys'){
 const keys=await management('/api-keys?reveal=true');
 const pub=keys.find(x=>x.type==='publishable')??keys.find(x=>x.name==='anon');
 const priv=keys.find(x=>x.type==='secret')??keys.find(x=>x.name==='service_role');
 const value=x=>x.api_key??x.key;
 if(!value(pub??{})||!value(priv??{}))throw Error('Project API keys not available');
 writeFileSync('.env.supabase',`SUPABASE_URL=https://${ref}.supabase.co\nSUPABASE_ANON_KEY=${value(pub)}\nSUPABASE_SERVICE_ROLE_KEY=${value(priv)}\n`);
 console.log('Saved development keys to ignored .env.supabase; no credentials displayed.');
}else if(command==='sql'){
 const result=await management('/database/query',{query:readFileSync(arg,'utf8')});console.log(JSON.stringify(result));
}else if(command==='auth'){
 const current=await management('/config/auth');await management('/config/auth',{external_email_enabled:true,disable_signup:false,mailer_autoconfirm:true,password_min_length:Math.max(8,current.password_min_length??8),site_url:'https://naol-builder.lokwensio.com',uri_allow_list:'https://naol-builder.lokwensio.com/reset-password,http://127.0.0.1:5173/reset-password'},'PATCH');console.log('Auth email/password, immediate sessions and approved reset redirects configured.');
}else if(command==='app-url'){
 await management('/secrets',[{name:'APP_URL',value:'https://naol-builder.lokwensio.com'}]);console.log('Edge Function application URL configured.');
}else throw Error('Unknown management command');
