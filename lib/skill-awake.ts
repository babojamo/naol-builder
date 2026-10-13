import {getSkillAwakeGroupKeys,canUseSkillWithWeapon} from './skill-weapons';
import {catalogItem,catalogSkill} from './catalog-index';
import {getBaseWeaponVariant} from './item-variants';
import {resolveCanonicalParameter} from './stat-parameters';
import {lineage,type CharacterBuild,type GameData,type Gear,type Item,type Skill} from './model';
const parameterRates=new Set(['healing','block','reflectdamage','criticalresist','firedefense','waterdefense','winddefense','electricitydefense','earthdefense','bleedandpoisonresist']);
export function isParameterAwakeRate(parameter:string){return parameterRates.has(parameter);}
/** A newly selected result replaces the old result, including the legacy field. */
export function replaceWeaponBonus(gear:Gear,weaponBonus:Gear['weaponBonus']):Gear{return {...gear,weaponBonus,skillAwake:undefined};}
export function skillAwakeOptions(item:Item|undefined,d:GameData,build?:CharacterBuild):{id:number;values:number[]}[]{if(!item||item.category!=='weapon')return [];const groups=getSkillAwakeGroupKeys(item.subcategory).map(key=>d.skillawake[key]);const map=new Map<number,number[]>();for(const raw of groups){const data=raw as {skills?:Record<string,Record<string,number[]>>}|undefined;for(const [id,ranks] of Object.entries(data?.skills??{})){const tier=resolveBonusAwakeningRarityTier(item,d,ranks),values=tier?ranks[tier]:undefined;if(values?.length)map.set(Number(id),[...new Set([...(map.get(Number(id))??[]),...values])]);}}return [...map].filter(([id])=>{const skill=catalogSkill(d,id);return !!skill&&(!build||!!skill.class&&lineage(build.classId,d).includes(skill.class)&&skill.level<=item.level)&&canUseSkillWithWeapon(skill,item);}).map(([id,values])=>({id,values}));}
export function parameterAwakeOptions(item:Item|undefined,d:GameData):{parameter:string;values:number[]}[]{if(!item)return [];return [...new Map(getSkillAwakeGroupKeys(item.subcategory).map(key=>d.skillawake[key]).flatMap(raw=>Object.entries((raw as {parameters?:Record<string,Record<string,number[]>>}|undefined)?.parameters??{}).map(([parameter,ranks])=>[parameter,ranks[resolveBonusAwakeningRarityTier(item,d,ranks)??'']??[]] as const)).filter(([,values])=>values.length>0)).entries()].map(([parameter,values])=>({parameter,values:[...new Set(values)]}));}
export function validWeaponBonus(item:Item|undefined,d:GameData,build:CharacterBuild,bonus:Gear['weaponBonus']):boolean{if(!item||!bonus)return false;if(bonus.type==='skill')return skillAwakeOptions(item,d,build).some(x=>x.id===bonus.skillId&&x.values.includes(bonus.value));return parameterAwakeOptions(item,d).some(x=>x.parameter===bonus.parameter&&x.values.includes(bonus.value));}
export function mainHandSkillBonus(build:CharacterBuild,skill:Skill|undefined,data?:GameData){if(!skill)return 0;const matches=(id:number)=>{let current:Skill|undefined=skill;const seen=new Set<number>();while(current&&!seen.has(current.id)){if(current.id===id)return true;seen.add(current.id);current=data?.skill.find(x=>x.id===current?.inheritSkill);}return false;};const bonus=build.equipment.rightHand?.weaponBonus;if(bonus?.type==='skill'&&matches(bonus.skillId))return bonus.value;const legacy=build.equipment.rightHand?.skillAwake;if(legacy&&matches(legacy.skillId))return legacy.value;return 0;}
export function weaponBonusAbility(build:CharacterBuild,d:GameData):{parameter:string;add:number;rate:boolean}[]{const out:{parameter:string;add:number;rate:boolean}[]=[];for(const slot of ['rightHand','shield'] as const){const gear=build.equipment[slot],bonus=gear?.weaponBonus;if(!gear||!bonus||bonus.type!=='parameter')continue;const item=catalogItem(d,gear.itemId);if(!validWeaponBonus(item,d,build,bonus))continue;out.push({parameter:bonus.parameter,add:bonus.value,rate:isParameterAwakeRate(bonus.parameter)});}return out;}
const rarityOrder=['common','uncommon','rare','veryrare','unique'] as const;
export function resolveBonusAwakeningRarityTier(item:Item,d:Pick<GameData,'item'>,table:Record<string,number[]>):string|undefined{
 if(Array.isArray(table[item.rarity]))return item.rarity;
 if(item.category!=='weapon'||item.rarity!=='ultimate')return;
 const base=getBaseWeaponVariant(item,d);
 if(base&&Array.isArray(table[base.rarity]))return base.rarity;
 return [...rarityOrder].reverse().find(tier=>Array.isArray(table[tier])&&table[tier].length>0);
}
export function normalizeImportedWeaponBonus(extracted:{skillName:string|null;parameter:string|null;value:number|null},item:Item,d:GameData,character:CharacterBuild):Gear['weaponBonus']{
 if(extracted.value===null)return;
 if(extracted.skillName){const name=extracted.skillName.trim().toLowerCase(),matches=skillAwakeOptions(item,d,character).filter(x=>catalogSkill(d,x.id)?.name.trim().toLowerCase()===name);if(matches.length!==1)return;const bonus={type:'skill' as const,skillId:matches[0].id,value:extracted.value};return validWeaponBonus(item,d,character,bonus)?bonus:undefined;}
 if(extracted.parameter){const bonus={type:'parameter' as const,parameter:resolveCanonicalParameter(extracted.parameter),value:extracted.value};return validWeaponBonus(item,d,character,bonus)?bonus:undefined;}
}
