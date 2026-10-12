import {serverClient} from '../supabase/server';import type {GameData} from '../model';import type {Tables} from '../supabase/database.types';
export type SyncState=Tables<'flyff_sync_state'>;
const resources=['class','item','monster','skill','equipset','upgradelevelbonus','statawake','skillawake','raisedpet','dungeon'] as const;
let cached:{generation:string;data:GameData;checked:number}|null=null;
let pending:Promise<GameData>|null=null;
export const flyffDataRepository={
 async getSyncStatus(){const {data,error}=await serverClient().from('flyff_sync_state').select('*').eq('id',1).single();if(error)throw error;return data;},
 async getData():Promise<GameData>{if(pending)return pending;pending=this.loadData();try{return await pending;}finally{pending=null;}},
 async loadData():Promise<GameData>{
 if(cached&&Date.now()-cached.checked<15000)return cached.data;
 const status=await this.getSyncStatus();if(!status.active_generation)throw Error('The Supabase Flyff cache has not been initialized.');
 if(cached?.generation===status.active_generation){cached.checked=Date.now();return cached.data;}
 const db=serverClient(),generation=status.active_generation;
 const entries=await Promise.all(resources.map(async resource=>{const out:unknown[]=[];const count=status.record_counts&&typeof status.record_counts==='object'&&!Array.isArray(status.record_counts)?Number(status.record_counts[resource]):0;const concurrency=count>1000?4:1;for(let offset=0;;offset+=1000*concurrency){const pages=await Promise.all(Array.from({length:concurrency},async(_,page)=>{const start=offset+page*1000;let query=db.from('flyff_entities').select('normalized_payload,is_active').eq('generation_id',generation).eq('resource',resource).order('entity_id').range(start,start+999);if(resource==='item')query=query.in('category',['weapon','armor','jewelry','fashion','raisedpet','material']);const {data,error}=await query;if(error)throw error;return data;}));for(const page of pages)out.push(...page.map(row=>({...row.normalized_payload as Record<string,unknown>,isActive:row.is_active})));if(pages.some(page=>page.length<1000))break;}return [resource,resource==='skillawake'?out[0]:out] as const;}));
 const {data:fashionBlessingRules,error:rulesError}=await db.from('flyff_fashion_blessing_rules').select('blessing_type,parameter,value,appearance_probability,value_probability,game_version,effective_from,source_reference').eq('active',true).order('blessing_type').order('parameter').order('value');if(rulesError)throw rulesError;
 const data={...Object.fromEntries(entries),fashionBlessingRules,version:status.cached_version,syncedAt:status.last_successful_sync} as GameData;
 const after=await this.getSyncStatus();if(after.active_generation!==generation)return this.loadData();
 cached={generation,data,checked:Date.now()};return data;
 },
 async getItem(id:number){return (await this.getData()).item.find(x=>x.id===id);},
 async getClass(id:number){return (await this.getData()).class.find(x=>x.id===id);},
 async getClasses(){return (await this.getData()).class;},
 async getMonster(id:number){return (await this.getData()).monster.find(x=>x.id===id);},
 async getSkill(id:number){return (await this.getData()).skill.find(x=>x.id===id);},
 async getEquipmentSets(){return (await this.getData()).equipset;},
 async getUpgradeLevelBonuses(){return (await this.getData()).upgradelevelbonus;},
};
