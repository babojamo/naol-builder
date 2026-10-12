import {admin,reply,user,cors,body} from '../_shared/runtime.ts';
async function authorize(request:Request){
 const signed=await user(request);if(!signed)return {signed:null,allowed:false};const db=admin();
 let {data}=await db.from('app_admins').select('user_id').eq('user_id',signed.id).maybeSingle();
 if(!data&&signed.email){const claimed=await db.rpc('claim_verified_admin',{p_user:signed.id,p_email:signed.email});if(claimed.data===true){({data}=await db.from('app_admins').select('user_id').eq('user_id',signed.id).maybeSingle());}}
 return {signed,allowed:!!data};
}
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{headers:cors});
 const auth=await authorize(request);if(!auth.signed)return reply({error:'Sign in to continue.'},401);if(!auth.allowed)return reply({error:'Administrator access is required. Verify the invited account email first.'},403);
 const db=admin();
 try{
  if(request.method==='GET'){const {data,error}=await db.rpc('admin_dashboard',{p_admin:auth.signed.id});if(error)throw error;return reply(data);}
  if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
  const input=await body(request);if(input.action!=='quota'||typeof input.userId!=='string'||!['ai_reset','ai_limit_change','ai_enabled_change','ai_uses_granted'].includes(String(input.operation)))return reply({error:'Invalid administration request.'},400);
  const value=Number.isInteger(input.value)?Number(input.value):null;const {data,error}=await db.rpc('admin_apply_ai_quota',{p_admin:auth.signed.id,p_target:input.userId,p_action:input.operation,p_value:value});if(error)throw error;return reply({quota:data});
 }catch{return reply({error:'Administration request failed.'},503);}
});
