import {officialAbilityParameters} from './ability-registry';
import {offensiveElements} from './element-stats';
import {resolveCanonicalParameter} from './stat-parameters';
import type {CharacterBuild,GameData} from './model';

export type CharacterElementDefenseValues=Record<typeof offensiveElements[number],number|null>;
export const characterElementDefenseReason='Exact Flyff Universe Character-window Element Defense formula is not verified. Calibration required.';
/** Extension point for a future verified formula. Includes every build source, not only the suit. */
export function calculateCharacterElementDefense(build:CharacterBuild,data:GameData){
 const suit=build.equipment.suit,issues:string[]=[];
 if(suit&&!data.item.some(item=>item.id===suit.itemId))issues.push('Suit item data is missing.');
 if(suit?.element&&!['none',...offensiveElements].includes(suit.element))issues.push('Unsupported suit element.');
 if(suit?.elementUpgrade!==undefined&&(!Number.isInteger(suit.elementUpgrade)||suit.elementUpgrade<0||suit.elementUpgrade>10))issues.push('Invalid suit element upgrade level.');
 return {values:Object.fromEntries(offensiveElements.map(element=>[element,null])) as CharacterElementDefenseValues,status:'unsupported' as const,confidence:'unsupported' as const,reason:characterElementDefenseReason,issues};
}
/** Known defense-named abilities are resistance; never count them as missing Character Defense effects. */
export function auditCharacterElementDefense(data:GameData){
 const resistanceParameters=offensiveElements.map(element=>element+'defense').concat('allelementsdefense');
 const unmappedEffects:{resource:string;path:string;parameter:string}[]=[];
 const resistanceCounts=new Map<string,number>();
 const visit=(value:unknown,resource:string,path:string)=>{
  if(!value||typeof value!=='object')return;
  const row=value as Record<string,unknown>;
  if(typeof row.parameter==='string'){
   const parameter=resolveCanonicalParameter(row.parameter);
   if(resistanceParameters.includes(parameter))resistanceCounts.set(parameter,(resistanceCounts.get(parameter)??0)+1);
   else if(/^(fire|water|wind|earth|electricity|electric|lightning).*(defen|resist)|element.*defen|defen.*element/i.test(parameter))unmappedEffects.push({resource,path,parameter:row.parameter});
  }
  for(const [key,child] of Object.entries(row))visit(child,resource,path+'.'+key);
 };
 for(const resource of ['class','item','skill','equipset','statawake','raisedpet','fashionBlessingRules'] as const)visit(data[resource],resource,resource);
 return {mechanic:'character_element_defense',status:'unsupported' as const,reason:characterElementDefenseReason,recognizedCharacterDefenseStatIds:[] as string[],recognizedResistanceStatIds:resistanceParameters.filter(parameter=>officialAbilityParameters.has(parameter)),resistanceSources:[...resistanceCounts].map(([parameter,count])=>({parameter,count})),unmappedEffects,combatUpgradeRows:data.upgradelevelbonus.filter(row=>typeof row.elementDefense==='number').length,missingFormulas:['Character-window Element Defense']};
}
