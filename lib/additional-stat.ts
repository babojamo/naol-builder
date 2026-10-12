import type {Ability,AdditionalStat,GameData,Item} from './model';

const primary=new Set(['str','sta','dex','int']);
export function canReceiveAdditionalStat(item:Item){return (item.category==='weapon'||item.category==='armor')&&item.subcategory!=='shield';}
export function getAdditionalStatAbilities(value:AdditionalStat|undefined,data:Pick<GameData,'statawake'>):Ability[]{if(!value)return [];if(value.source==='stat-scroll')return value.abilities;return value.awakeId===undefined?value.abilities:data.statawake[value.awakeId]?.abilities??[];}
export function validAdditionalStatOptions(item:Item,data:Pick<GameData,'statawake'>){if(!canReceiveAdditionalStat(item))return [];return data.statawake.map((awake,awakeId)=>({awake,awakeId})).filter(x=>x.awake.minimumLevel<=item.level);}
export function validateAdditionalStat(item:Item,value:AdditionalStat|undefined,data:Pick<GameData,'statawake'>):string[]{if(!value)return [];if(!canReceiveAdditionalStat(item))return ['Additional Stat is not allowed on '+item.name];if(value.source==='stat-scroll'){if(value.awakeId!==undefined)return ['Stat Scroll Additional Stat cannot reference a drop awakening'];if(value.abilities.length!==1)return ['A Stat Scroll must create exactly one stat line'];const a=value.abilities[0];if(!primary.has(a.parameter)||a.rate||a.set!==undefined||!Number.isInteger(a.add)||a.add!<1||(a.add??0)>4)return ['Invalid Stat Scroll value'];return [];}if(value.awakeId!==undefined){const awake=data.statawake[value.awakeId];if(!awake)return ['Unknown Additional Stat awake ID'];if(awake.minimumLevel>item.level)return ['Additional Stat requires a higher item level'];return [];}const match=validAdditionalStatOptions(item,data).some(x=>JSON.stringify(x.awake.abilities)===JSON.stringify(value.abilities));return match?[]:['Additional Stat does not match an official /statawake entry'];}
export type ExtractedAdditionalStat={source:'drop'|'stat-scroll'|'unknown';awakeIdCandidate?:number|null;abilities?:{parameter:string;value:number}[];/** Earlier saved analyses remain readable. */parameter?:string;value?:number;confidence:'high'|'medium'|'low'};
export function additionalStatText(value:ExtractedAdditionalStat|null|undefined,legacy:string|null){return value?(value.abilities??(value.parameter&&value.value!==undefined?[{parameter:value.parameter,value:value.value}]:[])).map(x=>`${x.parameter.toUpperCase()} +${x.value}`).join(' · '):legacy;}
const signature=(abilities:Ability[])=>abilities.map(x=>`${x.parameter}:${x.add}:${!!x.rate}:${x.set??''}`).sort().join('|');
export function matchExtractedAdditionalStat(value:ExtractedAdditionalStat|null|undefined,legacy:string|null,item:Item,data:Pick<GameData,'statawake'>):AdditionalStat|undefined{
 if(!canReceiveAdditionalStat(item))return;
 const extracted=value?.abilities??(value?.parameter&&value.value!==undefined?[{parameter:value.parameter,value:value.value}]:undefined);
 const abilities:Ability[]=extracted?extracted.map(x=>({parameter:x.parameter.toLowerCase(),add:x.value})):[...(legacy??'').toLowerCase().matchAll(/\b(str|sta|dex|int(?:elligence)?)\s*\+?\s*([1-9]\d*)\b/g)].map(x=>({parameter:x[1].startsWith('int')?'int':x[1],add:Number(x[2])}));
 if(!abilities.length)return;
 if(value?.source==='stat-scroll'){const stat:AdditionalStat={source:'stat-scroll',abilities};return validateAdditionalStat(item,stat,data).length?undefined:stat;}
 // Candidate IDs are untrusted; require an exact unordered canonical combination.
 const found=validAdditionalStatOptions(item,data).find(x=>signature(x.awake.abilities)===signature(abilities));
 return found?{source:value?.source??'unknown',awakeId:found.awakeId,abilities:found.awake.abilities}:undefined;
}
export function findAdditionalStat(text:string,item:Item,data:Pick<GameData,'statawake'>):AdditionalStat|undefined{return matchExtractedAdditionalStat(undefined,text,item,data);}
