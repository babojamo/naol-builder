import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import type {Database} from './database.types';
let client:SupabaseClient<Database>|null=null;
export function configureClient(url:string,key:string){if(!client)client=createClient<Database>(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});return client;}
export function supabaseClient(){if(!client)throw Error('Account service is still loading.');return client;}
export async function authenticatedFetch(url:string,init:RequestInit={}){const headers=new Headers(init.headers);if(client){const {data}=await client.auth.getSession();if(data.session)headers.set('Authorization','Bearer '+data.session.access_token);}return fetch(url,{...init,headers});}
