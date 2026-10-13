import type {Ability,Element,Gear,Item,Upgrade} from './model';
import {getFlatAbility,getRateAbility} from './stat-parameters';
import {getStrongElement,getWeakElement} from './elements';
export const offensiveElements=['fire','water','wind','electricity','earth'] as const;
export function resolveWeaponElement(item:Item|undefined,gear:Gear|undefined):Element{return gear?.element&&gear.element!=='none'?gear.element:item?.element??'none';}
/** Sheet masteries/resistances are percentage points; elementattack is the API flat element-power stat. */
export function calculateElementStats(abilities:Ability[],suit?:Gear){const adjustments=calculateSuitElementSheetEffects(suit).resistanceAdjustments;return Object.fromEntries([['elementAttack',getFlatAbility(abilities,'elementattack')],...offensiveElements.flatMap(element=>[[element+'Mastery',getRateAbility(abilities,element+'mastery')],[element+'Resistance',getRateAbility(abilities,element+'defense')+adjustments[element]]])]) as Record<string,number>;}
export function suitElementInfo(gear:Gear|undefined,rows:Upgrade[]){const element=gear?.element??'none',upgrade=element==='none'?0:gear?.elementUpgrade??0;return {element,upgrade,displayedDefense:calculateDisplayedElementDefense(element,upgrade,rows),combatDefenseCoefficient:upgrade>0?Number(rows.find(x=>x.upgradeLevel===upgrade)?.elementDefense??0)/100:0};}
/** Sheet percentage points, independently of the combat upgrade coefficient. */
export function calculateSuitElementSheetEffects(gear:Gear|undefined){
 const element=gear?.element??'none',upgrade=element==='none'?0:Math.max(0,gear?.elementUpgrade??0);
 const resistanceAdjustments={fire:0,water:0,wind:0,electricity:0,earth:0};
 if(element!=='none'&&upgrade>0){const strong=getStrongElement(element),weak=getWeakElement(element);if(strong!=='none')resistanceAdjustments[strong]=upgrade*2;if(weak!=='none')resistanceAdjustments[weak]=-upgrade*2;}
 return {element,upgrade,resistanceAdjustments};
}
/** No verified Character-window transformation; never substitute the combat coefficient. */
export function calculateDisplayedElementDefense(element:Element,upgradeLevel:number,rows:Upgrade[]){return {element,upgrade:upgradeLevel,combatDataAvailable:rows.some(row=>row.upgradeLevel===upgradeLevel),value:null,confidence:'unsupported' as const};}

