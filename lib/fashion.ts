import {resolveCanonicalParameter} from './stat-parameters';
import type {Ability,CharacterBuild,FashionBlessing,FashionBlessingRule,FashionSlot,Item,Slot} from './model';

const eligible:Record<Exclude<FashionSlot,'mask'>,string[]>={
 fashionHead:['hat'],fashionSuit:['cloth'],fashionGloves:['glove'],fashionShoes:['shoes'],cloak:['cloak','visualcloak'],
};
export function canReceiveFashionBlessing(item:Item|undefined,slot:Slot):boolean{
 if(!item||item.category!=='fashion'||slot==='mask')return false;
 return slot in eligible&&eligible[slot as Exclude<FashionSlot,'mask'>].includes(item.subcategory??'');
}
const flatParameters=new Set(['str','sta','dex','int','attack','def','maxhp','maxmp','maxfp','magicdefense','pvedamage','pveincomingdamage']);
const rateParameters=new Set(['criticalchance','criticaldamage','speed','attackspeed','decreasedcastingtime','actionspeed','parry','meleeblock','rangedblock']);
/** Blessing-only legacy aliases; other mechanics retain their own flat/rate variants. */
export function resolveFashionBlessingParameter(parameter:string){return parameter==='castingspeed'?'decreasedcastingtime':parameter==='pvedamagereduction'?'pveincomingdamage':resolveCanonicalParameter(parameter);}
/** Audited 1.5.5 seeding semantics. Runtime calculations always use the actual matched rule. */
export function getFashionBlessingOperation(parameter:string){const key=resolveFashionBlessingParameter(parameter);return flatParameters.has(key)?'flat':rateParameters.has(key)?'rate':undefined;}
export function resolveFashionBlessingRule(line:FashionBlessing,rules:FashionBlessingRule[]){const matches=rules.filter(r=>r.active!==false&&(line.source==='unknown'||r.blessing_type===line.source)&&resolveFashionBlessingParameter(r.parameter)===resolveFashionBlessingParameter(line.parameter)&&r.value===line.value);if(!matches.length||matches.some(r=>typeof r.rate!=='boolean')||new Set(matches.map(r=>r.rate)).size!==1)return undefined;return matches[0];}
export const fashionBlessingLabels:Record<string,string>={str:'STR',sta:'STA',dex:'DEX',int:'INT',attack:'Attack',def:'Defense',maxhp:'HP',maxmp:'MP',maxfp:'FP',magicdefense:'Magic Defense',criticalchance:'Critical Chance',criticaldamage:'Critical Damage',speed:'Speed',attackspeed:'Attack Speed',decreasedcastingtime:'Casting Speed',actionspeed:'Action Speed',parry:'Parry',meleeblock:'Melee Block',rangedblock:'Ranged Block',pvedamage:'PvE Damage',pveincomingdamage:'PvE Damage Reduction'};
export function fashionBlessingLabel(parameter:string){return fashionBlessingLabels[resolveFashionBlessingParameter(parameter)]??parameter;}
export function formatFashionBlessing(line:FashionBlessing,rules:FashionBlessingRule[]){const rule=resolveFashionBlessingRule(line,rules);return fashionBlessingLabel(line.parameter)+' '+(line.value>=0?'+':'')+line.value+(rule?.rate?'%':'')+(rule?'':' · needs review');}
export function auditFashionBlessingRules(rules:FashionBlessingRule[]){const active=rules.filter(r=>r.active!==false),parameters=[...new Set(active.map(r=>resolveFashionBlessingParameter(r.parameter)))].sort(),flatParameters=[...new Set(active.filter(r=>r.rate===false).map(r=>resolveFashionBlessingParameter(r.parameter)))].sort(),rateParameters=[...new Set(active.filter(r=>r.rate===true).map(r=>resolveFashionBlessingParameter(r.parameter)))].sort(),unknown=active.filter(r=>typeof r.rate!=='boolean');return {goddess:active.filter(r=>r.blessing_type==='goddess').length,demon:active.filter(r=>r.blessing_type==='demon').length,parameters,flatParameters,rateParameters,unknownOperation:unknown.length,unknownParameters:[...new Set(unknown.map(r=>r.parameter))].sort()};}
export function getFashionBlessingOptions(rules:FashionBlessingRule[],source:FashionBlessing['source'],parameter:string){
 return [...new Set(rules.filter(r=>r.active!==false&&typeof r.rate==='boolean'&&(source==='unknown'||r.blessing_type===source)&&resolveFashionBlessingParameter(r.parameter)===resolveFashionBlessingParameter(parameter)).map(r=>Number(r.value)))].sort((a,b)=>a-b);
}
export function isValidFashionBlessing(blessing:FashionBlessing,rules:FashionBlessingRule[]){return Number.isFinite(blessing.value)&&!!resolveFashionBlessingRule(blessing,rules);}
export function blessingAbilities(build:CharacterBuild,items:Item[],rules:FashionBlessingRule[]=[]):Ability[]{
 const out:Ability[]=[];
 for(const [slot,gear] of Object.entries(build.equipment) as [Slot,{itemId:number;fashionBlessings?:FashionBlessing[]} ][]){
  const item=items.find(x=>x.id===gear?.itemId);if(!gear||!canReceiveFashionBlessing(item,slot))continue;
  for(const line of (gear.fashionBlessings??[]).slice(0,2))if(line&&Number.isFinite(line.value)&&isValidFashionBlessing(line,rules)){const rule=resolveFashionBlessingRule(line,rules)!;out.push({parameter:resolveFashionBlessingParameter(rule.parameter),add:line.value,rate:rule.rate!});}
 }
 return out;
}
