import type {CharacterBuild} from '../model';import {authenticatedFetch} from '../supabase/client';
export type CloudBuild={build:CharacterBuild;revision:number;visibility:'private'|'unlisted'|'public';updatedAt:string;slug:string};
async function json<T>(url:string,init?:RequestInit):Promise<T>{const r=await authenticatedFetch(url,init);const value=await r.json();if(!r.ok)throw Error((value as {error?:string}).error??'Cloud storage request failed.');return value as T;}
export const buildRepository={
 // Keep transport payloads intact; the builder parses after loading its catalog.
 async list():Promise<CloudBuild[]>{return json<CloudBuild[]>('/api/builds');},
 async get(id:string){return json<CloudBuild|null>('/api/builds?record='+encodeURIComponent(id));},
 async save(build:CharacterBuild,revision:number,visibility?:CloudBuild['visibility']){return json<CloudBuild>('/api/builds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({build,expectedRevision:revision,visibility})});},
 async remove(id:string){await json('/api/builds?id='+encodeURIComponent(id),{method:'DELETE'});},
 async duplicate(build:CharacterBuild){return this.save({...structuredClone(build),id:crypto.randomUUID(),name:(build.name+' copy').slice(0,80)},0,'private');},
};
