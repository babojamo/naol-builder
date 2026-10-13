import {catalogSkill} from './catalog-index';import type {Item,GameData} from './model';
const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
export const compareDisplayName=(a:string,b:string)=>collator.compare(a,b);
const family=(name:string)=>name.replace(/\s*\(\d+\)\s*$/,'').trim();
export function compareItemNameThenTier(a:Item,b:Item){return compareDisplayName(family(a.name),family(b.name))||((a.tier??0)-(b.tier??0))||compareDisplayName(a.name,b.name)||a.id-b.id;}
export function compareSkillName(a:{id:number},b:{id:number},data:GameData){return compareDisplayName(catalogSkill(data,a.id)?.name??'',catalogSkill(data,b.id)?.name??'')||a.id-b.id;}
export const comparePiercingCard=(a:Item,b:Item)=>compareDisplayName(a.name,b.name)||a.id-b.id;
