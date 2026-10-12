import type {Ability} from './model';

/** Canonical NAOL concepts mapped to the raw Flyff API parameter vocabulary. */
export const StatParameter={
 str:'str',sta:'sta',dex:'dex',int:'int',allStats:'allstats',
 maxHp:'maxhp',maxMp:'maxmp',maxFp:'maxfp',attack:'attack',damage:'damage',magicAttack:'magicattack',
 attributeAttack:'attribute',movementSpeed:'speed',actionSpeed:'actionspeed',attackSpeed:'attackspeed',
 hitRate:'hitrate',criticalChance:'criticalchance',criticalDamage:'criticaldamage',criticalResist:'criticalresist',
 defense:'def',magicDefense:'magicdefense',parry:'parry',block:'block',meleeBlock:'meleeblock',rangedBlock:'rangedblock',pvpBlock:'pvpblock',
 pveDamage:'pvedamage',pvpDamage:'pvpdamage',bossDamage:'bossmonsterdamage',pveDamageReduction:'pvedamagereduction',pvpDamageReduction:'pvpdamagereduction',
 incomingDamage:'incomingdamage',incomingHealing:'incominghealing',hpRestoration:'hprestoration',hpRecovery:'hprecovery',skillDamage:'skilldamage',
 blockPenetration:'blockpenetration',pvpBlockPenetration:'pvpblockpenetration',allElementsDefense:'allelementsdefense',
} as const;

export type CanonicalStatParameter=typeof StatParameter[keyof typeof StatParameter];

// These IDs appeared in older NAOL saves or code, but are not current API IDs.
// Keeping the aliases here preserves schema-3 saves without changing raw catalog data.
const legacyAliases:Record<string,CanonicalStatParameter>={
 bossdamage:StatParameter.bossDamage,
 attributeattack:StatParameter.attributeAttack,
 pve:StatParameter.pveDamage,
 pvp:StatParameter.pvpDamage,
};

export function resolveCanonicalParameter(parameter:string):string{const normalized=parameter.toLowerCase().replace(/[^a-z0-9]/g,'');return legacyAliases[normalized]??normalized;}
export const parameterFamilies:Record<string,string[]>={str:['allstats'],sta:['allstats'],dex:['allstats'],int:['allstats'],speed:['allspeed'],attackspeed:['allspeed'],decreasedcastingtime:['allspeed'],firemastery:['allelementsmastery'],watermastery:['allelementsmastery'],windmastery:['allelementsmastery'],electricitymastery:['allelementsmastery'],earthmastery:['allelementsmastery'],firedefense:['allelementsdefense'],waterdefense:['allelementsdefense'],winddefense:['allelementsdefense'],electricitydefense:['allelementsdefense'],earthdefense:['allelementsdefense'],meleeblock:['block'],rangedblock:['block']};
export function getAbilityAliases(parameter:string):string[]{const canonical=resolveCanonicalParameter(parameter);return [canonical,...(parameterFamilies[canonical]??[]),...Object.entries(legacyAliases).filter(([,value])=>value===canonical).map(([alias])=>alias)];}
export function getFlatAbility(list:Ability[],parameter:string){const aliases=new Set(getAbilityAliases(parameter));return list.filter(a=>aliases.has(a.parameter)&&!a.rate&&a.set===undefined).reduce((sum,a)=>sum+(a.add??0),0);}
export function getRateAbility(list:Ability[],parameter:string){const aliases=new Set(getAbilityAliases(parameter));return list.filter(a=>aliases.has(a.parameter)&&a.rate&&a.set===undefined).reduce((sum,a)=>sum+(a.add??0),0);}
export function getAbilityTotal(list:Ability[],parameter:string){const aliases=new Set(getAbilityAliases(parameter)),relevant=list.filter(a=>aliases.has(a.parameter)),set=[...relevant].reverse().find(a=>a.set!==undefined)?.set;return {parameter:resolveCanonicalParameter(parameter),flat:getFlatAbility(list,parameter),rate:getRateAbility(list,parameter),set};}
export function applyFlatRateSet(base:number,parameter:string,list:Ability[]){const total=getAbilityTotal(list,parameter),start=total.set??base;return (start+total.flat)*(1+total.rate/100);}
export function addAbilityValues(base:number,parameter:string,list:Ability[]){const aliases=new Set(getAbilityAliases(parameter)),relevant=list.filter(a=>aliases.has(a.parameter)),set=[...relevant].reverse().find(a=>a.set!==undefined)?.set;return (set??base)+relevant.reduce((sum,a)=>sum+(a.add??0),0);}

