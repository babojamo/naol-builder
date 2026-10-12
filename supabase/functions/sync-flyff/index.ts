import {admin,reply,user,body,cors} from '../_shared/runtime.ts';
const resources=['class','item','monster','skill','equipset','upgradelevelbonus','statawake','skillawake','raisedpet','dungeon'];
const idResources=new Set(['class','item','monster','skill','equipset']);
const get=async(path:string)=>{await new Promise(r=>setTimeout(r,350));const response=await fetch('https://api.flyff.com/'+path,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Flyff API returned '+response.status);return response.json();};
function normalize(raw:Record<string,unknown>){const name=typeof raw.name==='object'?(raw.name as {en?:string})?.en:raw.name;const description=typeof raw.description==='object'?(raw.description as {en?:string})?.en:raw.description;const result={...raw,name:name??(raw.title as {en?:string})?.en??'',description:description??''};for(const key of ['spawns','drops','experienceTable','location','treePosition','masterVariations','title','transy'])delete result[key];if(Array.isArray(raw.levels))result.levels=raw.levels.map((l:Record<string,unknown>,index:number)=>({...l,level:l.level??index+1}));return result;}
async function continueInBackground(generation:string){
 const response=await fetch(Deno.env.get('SUPABASE_URL')+'/functions/v1/sync-flyff',{method:'POST',headers:{'Content-Type':'application/json','x-naol-sync-key':Deno.env.get('SYNC_KEY')!},body:JSON.stringify({generation})});if(!response.ok)throw Error('Sync continuation failed');
}
async function step(generation:string){const db=admin();const {data:gen,error}=await db.from('flyff_generations').select('*').eq('id',generation).single();if(error||gen.status!=='staging')return;const {resourceIndex,offset}=gen.cursor;const resource=resources[resourceIndex];
 try{
 const listing=await get(resource);let raw:Record<string,unknown>[];let total:number;
 if(idResources.has(resource)){if(!Array.isArray(listing)||!listing.every(x=>Number.isInteger(x)))throw Error('Invalid Flyff ID manifest');total=listing.length;const ids=listing.slice(offset,offset+200);const payload=await get(resource+'/'+ids.join(','));raw=Array.isArray(payload)?payload:[payload];if(raw.length!==ids.length||raw.some(x=>!ids.includes(x.id as number)))throw Error('Incomplete Flyff batch');}
 else {const values=Array.isArray(listing)?listing:[listing];total=values.length;raw=values.slice(offset,offset+200);}
 if(!total||!raw.length)throw Error('Empty Flyff resource '+resource);
 const rows=raw.map((value,index)=>{const n=normalize(value);return {generation_id:generation,resource,entity_id:String(value.id??value.petItemId??value.upgradeLevel??(Array.isArray(listing)?offset+index:'all')),raw_payload:value,normalized_payload:n,name:n.name,category:value.category??null,subcategory:value.subcategory??null,class_id:value.class??null,level:value.level??null,rank:value.rank??null,element:value.element??null,two_handed:value.twoHanded??null,is_active:true,api_version:gen.api_version};});
 const inserted=await db.from('flyff_entities').upsert(rows);if(inserted.error)throw Error('Cache batch write failed: '+inserted.error.message);
 const complete=offset+raw.length>=total;const cursor=complete?{resourceIndex:resourceIndex+1,offset:0}:{resourceIndex,offset:offset+raw.length};const counts={...gen.expected_counts,...(complete?{[resource]:total}:{})};
 const progress=await db.from('flyff_generations').update({cursor,expected_counts:counts}).eq('id',generation);if(progress.error)throw progress.error;
 if(cursor.resourceIndex===resources.length){const finalVersion=await get('version/data');if(finalVersion!==gen.api_version)throw Error('API version changed during synchronization. Previous cache retained.');const activated=await db.rpc('activate_flyff_generation',{p_generation:generation});if(activated.error)throw activated.error;}
 else await continueInBackground(generation);
 }catch(e){await db.from('flyff_generations').update({status:'failed'}).eq('id',generation);await db.from('flyff_sync_state').update({status:'failed',error:(e as Error).message.slice(0,500),lease_until:null}).eq('id',1);}
}
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{headers:cors});if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 const internal=!!Deno.env.get('SYNC_KEY')&&request.headers.get('x-naol-sync-key')===Deno.env.get('SYNC_KEY');
 if(!internal&&!await user(request))return reply({error:'Sign in to request a data check.'},401);
 try{const input=await body(request);if(input.generation){if(!internal||typeof input.generation!=='string')return reply({error:'Unauthorized sync continuation'},403);EdgeRuntime.waitUntil(step(input.generation));return reply({status:'syncing'});}
 const db=admin();const claimed=await db.rpc('claim_flyff_sync');if(claimed.error)throw claimed.error;
 const {data:state}=await db.from('flyff_sync_state').select('*').eq('id',1).single();if(!claimed.data)return reply({changed:false,version:state.checked_version??state.cached_version,status:state.status,message:state.status==='syncing'?'A sync is in progress.':'Version checks are limited to once per hour.'});
 const version=await get('version/data');await db.from('flyff_sync_state').update({last_api_check:new Date().toISOString(),checked_version:version}).eq('id',1);
 if(version===state.cached_version){await db.from('flyff_sync_state').update({status:'ready',lease_until:null}).eq('id',1);return reply({changed:false,version,message:'Your Supabase game cache is up to date.'});}
 const {data:gen,error}=await db.from('flyff_generations').insert({api_version:version}).select('id').single();if(error)throw error;await db.from('flyff_sync_state').update({status:'syncing'}).eq('id',1);EdgeRuntime.waitUntil(step(gen.id));return reply({changed:true,version,status:'syncing',message:'New official data is being staged. Your current cache remains available.'});
 }catch{await admin().from('flyff_sync_state').update({status:'failed',error:'Version check failed',lease_until:null}).eq('id',1);return reply({error:'Data synchronization failed. Previous cache retained.'},503);}
});
