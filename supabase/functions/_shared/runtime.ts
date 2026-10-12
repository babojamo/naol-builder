import {createClient} from 'npm:@supabase/supabase-js@2.110.7';
export const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-naol-sync-key','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
export const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
export async function user(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)return null;const {data,error}=await admin().auth.getUser(token);return error?null:data.user;}
export async function hash(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function body(request:Request){const text=await request.text();if(text.length>4096)throw Error('Request too large');return JSON.parse(text||'{}') as Record<string,unknown>;}
