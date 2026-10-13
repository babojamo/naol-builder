import type {Ability,Element,Gear,Item,Upgrade} from './model';
import {getFlatAbility,getRateAbility} from './stat-parameters';
export const offensiveElements=['fire','water','wind','electricity','earth'] as const;
export function resolveWeaponElement(item:Item|undefined,gear:Gear|undefined):Element{return gear?.element&&gear.element!=='none'?gear.element:item?.element??'none';}
/** Sheet masteries/resistances are percentage points; elementattack is the API flat element-power stat. */
export function calculateElementStats(abilities:Ability[]){return Object.fromEntries([['elementAttack',getFlatAbility(abilities,'elementattack')],...offensiveElements.flatMap(element=>[[element+'Mastery',getRateAbility(abilities,element+'mastery')],[element+'Resistance',getRateAbility(abilities,element+'defense')]])]) as Record<string,number>;}
export function suitElementInfo(gear:Gear|undefined,rows:Upgrade[]){const element=gear?.element??'none',upgrade=element==='none'?0:gear?.elementUpgrade??0;return {element,upgrade,defenseCoefficient:upgrade>0?Number(rows.find(x=>x.upgradeLevel===upgrade)?.elementDefense??0)/100:0};}
