import type {GameData,Target} from './model';

export const bossMonsterRanks=new Set(['giant','boss','super','worldboss']);
export const hasMonsterDisplayName=(monster:Target)=>typeof monster.name==='string'&&!!monster.name.trim()&&monster.name.trim().toLowerCase()!=='null';
export type MonsterFilters={search?:string;rank?:string;element?:string;maximumLevel?:number;dungeonId?:number;includeEvents?:boolean;allRecords?:boolean};
type MonsterData=Pick<GameData,'monster'|'dungeon'>;
export function canBrowseMonster(monster:Target,options:Pick<MonsterFilters,'includeEvents'|'allRecords'>={}){return options.allRecords===true||monster.isActive!==false&&hasMonsterDisplayName(monster)&&(!monster.event||options.includeEvents===true);}
/** Browse filters never replace a saved target or change identity/statistics. */
export function filterMonsters(data:MonsterData,options:MonsterFilters={}){
 const dungeon=options.dungeonId===undefined?undefined:data.dungeon.find(row=>row.id===options.dungeonId);
 if(options.dungeonId!==undefined&&!dungeon)return [];
 const ids=dungeon?new Set(dungeon.monsters):null;
 return data.monster.filter(monster=>canBrowseMonster(monster,options)
  &&(monster.name??'').toLowerCase().includes((options.search??'').toLowerCase())
  &&(!options.rank||options.rank==='all'||(options.rank==='bosses'?bossMonsterRanks.has(monster.rank):monster.rank===options.rank))
  &&(!options.element||options.element==='all'||monster.element===options.element)
  &&monster.level<=(options.maximumLevel??Infinity)&&(!ids||ids.has(monster.id)));
}
export type MonsterLabel={name:string;details:string;context:string;fullContext:string;label:string;idFallback:boolean};
const difficultyLabel=(difficulty:string)=>difficulty.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/\b\w/g,character=>character.toUpperCase());
/** English labels group only for presentation. The result is keyed exclusively by source ID. */
export function monsterLabels(data:MonsterData,options:Pick<MonsterFilters,'includeEvents'|'allRecords'>={}){
 const associations=new Map<number,GameData['dungeon']>();
 for(const dungeon of data.dungeon)for(const id of dungeon.monsters){const rows=associations.get(id)??[];rows.push(dungeon);associations.set(id,rows);}
 const groups=new Map<string,Target[]>();
 for(const monster of data.monster.filter(row=>canBrowseMonster(row,options))){const key=monster.name?.trim()??'',rows=groups.get(key)??[];rows.push(monster);groups.set(key,rows);}
 const labels=new Map<number,MonsterLabel>();
 for(const rows of groups.values()){
  const collision=rows.length>1,allDungeonRows=rows.flatMap(row=>associations.get(row.id)??[]);
  const sharedWorld=rows.every(row=>(associations.get(row.id)?.length??0)>0)&&new Set(allDungeonRows.map(row=>row.world)).size===1&&allDungeonRows.every(row=>typeof row.world==='number');
  for(const monster of rows){
   const dungeons=associations.get(monster.id)??[],fullContext=[...new Set(dungeons.map(row=>row.name))].join(' / ');
   const context=collision?(sharedWorld&&dungeons.every(row=>!!row.difficulty)?[...new Set(dungeons.map(row=>difficultyLabel(row.difficulty)))].join(' / '):fullContext):'';
   const details=`Lv. ${monster.level} · ${monster.rank}`+(context?' · '+context:'')+(monster.event?' · Event':'');
   labels.set(monster.id,{name:monster.name,details,context,fullContext,label:monster.name+' · '+details,idFallback:false});
  }
  const compactCounts=new Map<string,number>();for(const monster of rows){const label=labels.get(monster.id)!;compactCounts.set(label.label,(compactCounts.get(label.label)??0)+1);}
  for(const monster of rows){const label=labels.get(monster.id)!;if((compactCounts.get(label.label)??0)>1&&label.fullContext&&label.context!==label.fullContext){label.context=label.fullContext;label.details=`Lv. ${monster.level} · ${monster.rank} · ${label.context}`+(monster.event?' · Event':'');label.label=label.name+' · '+label.details;}}
  // Verified ID is the final fallback when level/rank/dungeon metadata cannot distinguish records.
  const signatures=new Map<string,number>();for(const monster of rows){const label=labels.get(monster.id)!;signatures.set(label.label,(signatures.get(label.label)??0)+1);}
  for(const monster of rows){const label=labels.get(monster.id)!;if(!hasMonsterDisplayName(monster)||(signatures.get(label.label)??0)>1){label.details+=' · ID '+monster.id;label.label=label.name+' · '+label.details;label.idFallback=true;}}
 }
 return labels;
}
export function auditMonsterSelection(data:MonsterData){
 const labels=monsterLabels(data,{allRecords:true}),groups=new Map<string,Target[]>();
 for(const row of data.monster){const key=row.name?.trim()??'',group=groups.get(key)??[];group.push(row);groups.set(key,group);}
 const variants=[...groups].filter(([,rows])=>rows.length>1).map(([name,rows])=>({name,ids:rows.map(row=>row.id),labels:rows.map(row=>labels.get(row.id)!.label)}));
 const signatures=new Map<string,number[]>();for(const [id,label] of labels){const ids=signatures.get(label.label)??[];ids.push(id);signatures.set(label.label,ids);}
 return {total:data.monster.length,sameNameVariants:variants,missingDisplayNames:data.monster.filter(row=>!hasMonsterDisplayName(row)).map(row=>({id:row.id,name:row.name})),eventMonsters:data.monster.filter(row=>row.event).length,superRankMonsters:data.monster.filter(row=>row.rank==='super').length,superRankExcludedByBossPolicy:data.monster.filter(row=>row.rank==='super'&&!bossMonsterRanks.has(row.rank)).length,ambiguousLabels:[...signatures].filter(([,ids])=>ids.length>1).map(([label,ids])=>({label,ids})),idFallback: [...labels].filter(([,row])=>row.idFallback).map(([id,row])=>({id,name:row.name})),inactiveRecords:data.monster.filter(row=>row.isActive===false).length,bossRanks:[...bossMonsterRanks]};
}
