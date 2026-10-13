import {canUseSkillWithEquipment} from './skill-weapons';
import {getRaisedPetBonus} from './raised-pets';
import {catalogItem,catalogSkill} from './catalog-index';
import {calculateEquipmentSetBonuses,canEquipAccessory,getAccessoryAbilities,isAccessory} from './accessories';
import {getEffectiveSetUpgradeLevel,canEquipItem} from './equipment';
import {blessingAbilities} from './fashion';
import {getConfiguredUpgrade,getUltimateAbilities,getActiveUltimateSockets} from './item-rules';
import {weaponBonusAbility} from './skill-awake';
import {resolveCanonicalParameter} from './stat-parameters';
import {getAdditionalStatAbilities,canReceiveAdditionalStat,validateAdditionalStat} from './additional-stat';
import {slots,type Ability,type CharacterBuild,type GameData,type Slot} from './model';

export type ModifierSourceType='base'|'allocated'|'item'|'normal-upgrade'|'set'|'set-upgrade'|'accessory'|'accessory-upgrade'|'ultimate-accessory'|'ultimate-weapon'|'ultimate-jewel'|'ultimate-rune'|'stat-awakening'|'weapon-bonus'|'piercing'|'fashion-blessing'|'pet'|'skill'|'buff'|'manual'|'other';
export type ModifierConfidence='verified'|'estimated'|'unsupported';
export interface StatModifier{parameter:string;rawParameter:string;value:number;operation:'flat'|'rate'|'set';sourceType:ModifierSourceType;sourceId?:string|number;sourceName?:string;slot?:Slot;confidence:ModifierConfidence;pvp?:boolean;pve?:boolean;rawAbility?:Ability;}

const modifier=(ability:Ability,sourceType:ModifierSourceType,meta:Partial<Omit<StatModifier,'parameter'|'rawParameter'|'value'|'operation'|'sourceType'|'confidence'>>={},confidence:ModifierConfidence='verified'):StatModifier=>({parameter:resolveCanonicalParameter(ability.parameter),rawParameter:ability.parameter,value:ability.set??ability.add??0,operation:ability.set!==undefined?'set':ability.rate?'rate':'flat',sourceType,confidence,pvp:ability.pvp,pve:ability.pve,rawAbility:ability,...meta});

export function collectCharacterModifiers(build:CharacterBuild,data:GameData):StatModifier[]{
 const out:StatModifier[]=[];
 for(const key of ['str','sta','dex','int'] as const){out.push({parameter:key,rawParameter:key,value:15,operation:'flat',sourceType:'base',sourceName:'Character base',confidence:'verified'},{parameter:key,rawParameter:key,value:build.baseStats[key]-15,operation:'flat',sourceType:'allocated',sourceName:'Allocated points',confidence:'verified'});}
 out.push(...build.bonuses.map(a=>modifier(a,'manual',{sourceName:'Manual override'},'estimated')));
 const ids:number[]=[],usedRunes=new Set<number>();
 for(const slot of slots){const gear=build.equipment[slot];if(!gear)continue;const item=catalogItem(data,gear.itemId);if(!item||(!build.theoretical&&(!canEquipItem(build,item,data,slot)||isAccessory(item)&&!canEquipAccessory(build.level,item,getConfiguredUpgrade(item,gear)))))continue;ids.push(item.id);const itemMeta={slot,sourceId:item.id,sourceName:item.name};
  const baseAbilities=isAccessory(item)?getAccessoryAbilities(item,getConfiguredUpgrade(item,gear)):item.abilities??[];
  out.push(...weaponBonusAbility({...build,equipment:{[slot]:gear}},data).map(a=>modifier(a,'weapon-bonus',{...itemMeta,sourceName:item.name+' Weapon Bonus'})));
  out.push(...baseAbilities.map(a=>modifier(a,isAccessory(item)?'accessory-upgrade':'item',itemMeta)));
  if(gear.ultimateWeapon){const config=gear.ultimateWeapon,active=getActiveUltimateSockets(item,gear);for(const socket of config.jewels.filter(x=>x.index<active)){const jewel=catalogItem(data,socket.content.itemId);out.push(...getUltimateAbilities(item,{...gear,ultimateWeapon:{...config,jewels:[socket],bonuses:{base:[]}}},data,usedRunes).map(a=>modifier(a,socket.content.kind==='rune'?'ultimate-rune':'ultimate-jewel',{...itemMeta,sourceId:socket.content.itemId,sourceName:jewel?.name??'Ultimate socket'},'verified')));}out.push(...getUltimateAbilities(item,{...gear,ultimateWeapon:{...config,jewels:[]}},data,usedRunes).map(a=>modifier(a,'ultimate-weapon',{...itemMeta,sourceName:item.name+' Ultimate bonus'},'verified')));}
  const additional=validateAdditionalStat(item,gear.additionalStat,data).length?[]:getAdditionalStatAbilities(gear.additionalStat,data),legacy=gear.additionalStat||!canReceiveAdditionalStat(item)?[]:gear.awake===null?[]:data.statawake[gear.awake]?.abilities??[];
  out.push(...(additional.length?additional:legacy).map(a=>modifier(a,'stat-awakening',{...itemMeta,sourceId:gear.additionalStat?.awakeId??gear.awake??undefined,sourceName:'Additional Stat'})));
  for(const cardId of gear.piercings){const card=catalogItem(data,cardId);if(card)out.push(...(card.abilities??[]).map(a=>modifier(a,'piercing',{slot,sourceId:card.id,sourceName:card.name})));}
  // The API snapshot has no authoritative Ultimate-accessory roll/socket table.
  // Preserve imported values as visible unsupported modifiers, never calculations.
  for(const a of gear.ultimate?.ultimateBonuses??[])out.push(modifier(a,'ultimate-accessory',itemMeta,'unsupported'));
  for(const jewel of gear.ultimate?.ultimateJewels??[])for(const a of jewel.abilities??[])out.push(modifier(a,'ultimate-accessory',{slot,sourceId:jewel.itemId,sourceName:'Imported Ultimate accessory jewel'},'unsupported'));
 }
 for(const slot of slots){const gear=build.equipment[slot],item=catalogItem(data,gear?.itemId);if(gear&&item&&(build.theoretical||canEquipItem(build,item,data,slot)))for(const a of blessingAbilities({...build,equipment:{[slot]:gear}},data.item,data.fashionBlessingRules??[]))out.push(modifier(a,'fashion-blessing',{slot,sourceId:item.id,sourceName:item.name+' blessing'}));}
 out.push(...calculateEquipmentSetBonuses(ids,data.equipset).map(a=>modifier(a,'set',{sourceName:'Equipment set'})));
 const effective=getEffectiveSetUpgradeLevel(build,data),setUpgrade=data.upgradelevelbonus.find(x=>x.upgradeLevel===effective);
 out.push(...(setUpgrade?.setAbilities??[]).map(a=>modifier(a,'set-upgrade',{sourceId:effective,sourceName:`Armor set +${effective}`})));
 const selfSkills=[...build.buffs.map(x=>({...x,sourceType:'buff' as const})),...build.support.buffSkills.filter(x=>catalogSkill(data,x.id)?.target==='currentplayer').map(x=>({...x,sourceType:'buff' as const})),...build.skills.filter(x=>catalogSkill(data,x.id)?.passive).map(x=>({...x,sourceType:'skill' as const}))];
 for(const selected of selfSkills){const skill=catalogSkill(data,selected.id);if(skill&&(selected.sourceType==='buff'&&build.buffs.some(x=>x.id===selected.id)||canUseSkillWithEquipment(skill,build,data)))out.push(...[...(skill.abilities??[]),...(skill.levels.find(x=>x.level===selected.level)?.abilities??[])].map(a=>modifier(a,selected.sourceType,{sourceId:skill.id,sourceName:skill.name})));}
 if(build.pet){const pet=data.raisedpet.find(x=>x.petItemId===build.pet!.id);const bonus=getRaisedPetBonus(build.pet,pet);if(!bonus.errors.length)out.push(modifier({parameter:bonus.parameter,rate:bonus.rate,add:bonus.total},'pet',{sourceId:pet!.petItemId,sourceName:'Raised Pet — '+(data.item.find(x=>x.id===pet!.petItemId)?.name??'#'+pet!.petItemId)}));}
 return out.filter(m=>build.mode==='pvp'?m.pvp!==false:m.pve!==false);
}

export function modifiersToAbilities(modifiers:StatModifier[]):Ability[]{return modifiers.filter(m=>!['base','allocated'].includes(m.sourceType)&&m.confidence!=='unsupported').map(m=>m.rawAbility&&m.parameter===m.rawParameter?m.rawAbility:{parameter:m.parameter,...(m.operation==='set'?{set:m.value}:{add:m.value,rate:m.operation==='rate'}),pvp:m.pvp,pve:m.pve});}

