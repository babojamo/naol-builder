import {admin,reply,user,hash,cors} from '../_shared/runtime.ts';
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{headers:cors});if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 const account=await user(request);if(!account?.email)return reply({error:'Sign in to request verification.'},401);
 const db=admin();const {data:profile}=await db.from('profiles').select('email_verified_at').eq('id',account.id).single();if(profile?.email_verified_at)return reply({message:'Email already verified.'});
 const apiKey=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('EMAIL_FROM'),app=Deno.env.get('APP_URL');if(!apiKey||!from||!app)return reply({error:'Email sender is not configured. Your account remains fully usable.'},503);
 const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');const tokenHash=await hash(token);
 const {error}=await db.rpc('issue_verification',{p_user:account.id,p_email:account.email,p_hash:tokenHash});if(error)return reply({error:error.message},429);
 const link=new URL('/verify-email',app);link.searchParams.set('token',token);
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':'naol-verify-'+tokenHash},body:JSON.stringify({from,to:[account.email],subject:'Verify your NAOL Build email',text:`Your NAOL account is ready. All features are available now. Verify your email within 24 hours: ${link.href}\nIf you did not request this email, ignore it.`})});if(!response.ok)throw Error('Email delivery unavailable');const sent=await response.json();return reply({message:'Verification email sent.',dispatchId:sent.id});}
 catch{await db.from('email_verification_tokens').delete().eq('token_hash',tokenHash);return reply({error:'Email delivery failed. Please try again later; your account remains fully usable.'},502);}
});
