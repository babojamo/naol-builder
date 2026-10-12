import {parseBuild} from '../../../lib/persistence';import {data} from '../../../lib/flyff-server';import {validate} from '../../../combat/character';
import {serverClient,requestUser,sameOrigin,boundedText} from '../../../lib/supabase/server';import type {Tables,Json} from '../../../lib/supabase/database.types';
const record=(r:Tables<'builds'>)=>({build:r.build_data,revision:r.revision,visibility:r.visibility,updatedAt:r.updated_at,slug:r.slug});
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){try{
 const db=serverClient(request),u=new URL(request.url),id=u.searchParams.get('id');
 if(id){const {data:rows,error}=await db.rpc('get_shared_build',{p_key:id});if(error||!rows?.length)return response({error:'Build not found'},404);return response(rows[0].build_data);}
 if(!await requestUser(request))return response([]);
 const own=u.searchParams.get('record');
 if(own){const {data:row,error}=await db.from('builds').select('*').eq('id',own).maybeSingle();if(error)throw error;return response(row?record(row):null);}
 const {data:rows,error}=await db.from('builds').select('*').order('updated_at',{ascending:false}).limit(100);if(error)throw error;return response((rows??[]).map(record));
 }catch{return response({error:'Cloud storage is temporarily unavailable.'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Origin mismatch'},403);
 if(!await requestUser(request))return response({error:'Sign in to save to My Account.'},401);
 let text:string;try{text=await boundedText(request,32000);}catch{return response({error:'Build is too large'},413);}
 try{const body=JSON.parse(text),current=await data(),b=parseBuild(body.build,current);
 if(!/^[a-f0-9-]{36}$/i.test(b.id))return response({error:'Import this legacy build as a new copy.'},400);
 const errors=validate(b,current);if(errors.length&&!b.theoretical)return response({error:errors.join('. ')},400);
 if(!Number.isInteger(body.expectedRevision)||body.expectedRevision<0)return response({error:'A cloud revision is required'},400);
 if(body.visibility!==undefined&&!['private','unlisted','public'].includes(body.visibility))return response({error:'Invalid visibility'},400);
 const {data:row,error}=await serverClient(request).rpc('save_build',{p_build:b as unknown as Json,p_expected_revision:body.expectedRevision,...(body.visibility!==undefined?{p_visibility:body.visibility}:{})});
 if(error)return response({error:error.message},error.code==='PT409'?409:error.code==='42501'?403:400);
 return response(record(row));
 }catch{return response({error:'Invalid build payload or game cache unavailable'},400);}}
export async function DELETE(request:Request){if(!sameOrigin(request)||!await requestUser(request))return response({error:'Unauthorized'},403);const id=new URL(request.url).searchParams.get('id');if(!id)return response({error:'Build ID required'},400);const {error}=await serverClient(request).from('builds').delete().eq('id',id);return error?response({error:'Deletion failed'},400):response({deleted:true});}
