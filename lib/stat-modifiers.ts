import {activeSelfBuffSelections} from './skill-usage';
import {getWeaponParameterSupport} from './weapon-effects';
import {getConfiguredItemAbilities,getItemAbilityRange} from './item-stat-ranges';
import {canUseActiveItem,getActiveItemAbilities} from './active-items';
import {canUseSkillWithEquipment} from './skill-weapons';
import {getRaisedPetBonus} from './raised-pets';
import {catalogItem,catalogSkill} from './catalog-index';
import {calculateEquipmentSetBonuses,equipmentSetPieceCount,canEquipAccessory,getAccessoryAbilities,isAccessory} from './accessories';
import {getEffectiveSetUpgradeLevel,canEquipItem} from './equipment';
import {blessingAbilities} from './fashion';
import {getConfiguredUpgrade,getUltimateAbilities,getActiveUltimateSockets} from './item-rules';
import {weaponBonusAbility} from './skill-awake';
import {resolveCanonicalParameter} from './stat-parameters';
import {getAdditionalStatAbilities,canReceiveAdditionalStat,validateAdditionalStat} from './additional-stat';
import {slots,type Ability,type CharacterBuild,type GameData,type Slot} from './model';

export type ModifierSourceType='base'|'allocated'|'item'|'item-base-roll'|'normal-upgrade'|'set'|'set-upgrade'|'accessory'|'accessory-upgrade'|'ultimate-accessory'|'ultimate-weapon'|'ultimate-jewel'|'ultimate-rune'|'stat-awakening'|'weapon-bonus'|'piercing'|'fashion-blessing'|'active-item'|'pet'|'skill'|'self-buff'|'buff'|'manual'|'other';
export type ModifierConfidence='verified'|'estimated'|'unsupported';
export interface StatModifier{parameter:string;rawParameter:string;value:number;operation:'flat'|'rate'|'set';sourceType:ModifierSourceType;sourceId?:string|number;sourceName?:string;slot?:Slot;sourceIndex?:number;sourceDetail?:string;confidence:ModifierConfidence;pvp?:boolean;pve?:boolean;rawAbility?:Ability;}

const modifier=(ability:Ability,sourceType:ModifierSourceType,meta:Partial<Omit<StatModifier,'parameter'|'rawParameter'|'value'|'operation'|'sourceType'|'confidence'>>={},confidence:ModifierConfidence='verified'):StatModifier=>({parameter:resolveCanonicalParameter(ability.parameter),rawParameter:ability.parameter,value:ability.set??ability.add??0,operation:ability.set!==undefined?'set':ability.rate?'rate':'flat',sourceType,confidence,pvp:ability.pvp,pve:ability.pve,rawAbility:ability,...meta});

export function collectCharacterModifiers(build:CharacterBuild,data:GameData):StatModifier[]{
 const out:StatModifier[]=[];
 for(const key of ['str','sta','dex','int'] as const){out.push({parameter:key,rawParameter:key,value:15,operation:'flat',sourceType:'base',sourceName:'Character base',confidence:'verified'},{parameter:key,rawParameter:key,value:build.baseStats[key]-15,operation:'flat',sourceType:'allocated',sourceName:'Allocated points',confidence:'verified'});}
 out.push(...build.bonuses.map(a=>modifier(a,'manual',{sourceName:'Manual override'},'estimated')));
 for(const itemId of new Set((build.activeItems??[]).map(x=>x.itemId))){const item=catalogItem(data,itemId);if(item&&canUseActiveItem(item,build,data))out.push(...getActiveItemAbilities(item).map(a=>modifier(a,'active-item',{sourceId:item.id,sourceName:item.name})));}
 const ids:number[]=[],usedRunes=new Set<number>();
 for(const slot of slots){const gear=build.equipment[slot];if(!gear)continue;const item=catalogItem(data,gear.itemId);if(!item||(!build.theoretical&&(!canEquipItem(build,item,data,slot)||isAccessory(item)&&!canEquipAccessory(build.level,item,getConfiguredUpgrade(item,gear)))))continue;ids.push(item.id);const itemMeta={slot,sourceId:item.id,sourceName:item.name};
  const baseAbilities=isAccessory(item)?getAccessoryAbilities(item,getConfiguredUpgrade(item,gear)):getConfiguredItemAbilities(item,gear);
  out.push(...weaponBonusAbility({...build,equipment:{[slot]:gear}},data).map(a=>modifier(a,'weapon-bonus',{...itemMeta,sourceName:item.name+' Weapon Bonus'})));
  out.push(...baseAbilities.map((a,index)=>{const rolled=!isAccessory(item)&&!!getItemAbilityRange(item,index)&&gear.baseStatRolls?.some(x=>x.abilityIndex===index);return modifier(a,isAccessory(item)?'accessory-upgrade':rolled?'item-base-roll':'item',{...itemMeta,sourceName:rolled?item.name+' — Base Roll':item.name});}));
  if(gear.ultimateWeapon){const config=gear.ultimateWeapon,active=getActiveUltimateSockets(item,gear);for(const socket of config.jewels.filter(x=>x.index<active)){const jewel=catalogItem(data,socket.content.itemId);out.push(...getUltimateAbilities(item,{...gear,ultimateWeapon:{...config,jewels:[socket],bonuses:{base:[]}}},data,usedRunes).map(a=>modifier(a,socket.content.kind==='rune'?'ultimate-rune':'ultimate-jewel',{...itemMeta,sourceId:socket.content.itemId,sourceIndex:socket.index,sourceName:jewel?.name??'Ultimate socket'},'verified')));}out.push(...getUltimateAbilities(item,{...gear,ultimateWeapon:{...config,jewels:[]}},data,usedRunes).map(a=>modifier(a,'ultimate-weapon',{...itemMeta,sourceName:item.name+' Ultimate bonus'},'verified')));}
  const additional=validateAdditionalStat(item,gear.additionalStat,data).length?[]:getAdditionalStatAbilities(gear.additionalStat,data),legacy=gear.additionalStat||!canReceiveAdditionalStat(item)?[]:gear.awake===null?[]:data.statawake[gear.awake]?.abilities??[];
  out.push(...(additional.length?additional:legacy).map(a=>modifier(a,'stat-awakening',{...itemMeta,sourceId:gear.additionalStat?.awakeId??gear.awake??undefined,sourceName:'Additional Stat'})));
  for(const [sourceIndex,cardId] of gear.piercings.entries()){const card=catalogItem(data,cardId);if(card)out.push(...(card.abilities??[]).map(a=>modifier(a,'piercing',{slot,sourceIndex,sourceId:card.id,sourceName:card.name})));}
  // The API snapshot has no authoritative Ultimate-accessory roll/socket table.
  // Preserve imported values as visible unsupported modifiers, never calculations.
  for(const a of gear.ultimate?.ultimateBonuses??[])out.push(modifier(a,'ultimate-accessory',itemMeta,'unsupported'));
  for(const jewel of gear.ultimate?.ultimateJewels??[])for(const a of jewel.abilities??[])out.push(modifier(a,'ultimate-accessory',{slot,sourceId:jewel.itemId,sourceName:'Imported Ultimate accessory jewel'},'unsupported'));
 }
 for(const slot of slots){const gear=build.equipment[slot],item=catalogItem(data,gear?.itemId);if(gear&&item&&(build.theoretical||canEquipItem(build,item,data,slot)))for(const [sourceIndex,line] of (gear.fashionBlessings??[]).slice(0,2).entries())for(const a of blessingAbilities({...build,equipment:{[slot]:{...gear,fashionBlessings:[line]}}},data.item,data.fashionBlessingRules??[]))out.push(modifier(a,'fashion-blessing',{slot,sourceId:item.id,sourceIndex,sourceName:item.name+' blessing',sourceDetail:line.source==='goddess'?'Blessing of Goddess':line.source==='demon'?'Blessing of Demon':'Blessing source unverified'}));}
 for(const set of data.equipset)out.push(...calculateEquipmentSetBonuses(ids,[set]).map(a=>modifier(a,'set',{sourceId:set.id,sourceName:set.name,sourceDetail:equipmentSetPieceCount(ids,set.parts)+' pieces'})));
 const effective=getEffectiveSetUpgradeLevel(build,data),setUpgrade=data.upgradelevelbonus.find(x=>x.upgradeLevel===effective);
 out.push(...(setUpgrade?.setAbilities??[]).map(a=>modifier(a,'set-upgrade',{sourceId:effective,sourceName:`Armor set +${effective}`})));
 const selfBuffs=activeSelfBuffSelections(build,data);
const activeSelfIds=new Set(selfBuffs.map(row=>row.id));

const selfSkills=[
  // Preserve legacy/imported external buffs, but never count the same skill
  // twice when it has been migrated to explicit selfBuffs[].
  ...build.buffs
    .filter(row=>!activeSelfIds.has(row.id))
    .map(row=>({...row,sourceType:'buff' as const})),
  ...build.support.buffSkills
    .filter(row=>catalogSkill(data,row.id)?.target==='currentplayer')
    .map(row=>({...row,sourceType:'buff' as const})),
  ...selfBuffs.map(row=>({...row,sourceType:'self-buff' as const})),
  ...build.skills
    .filter(row=>catalogSkill(data,row.id)?.passive)
    .map(row=>({...row,sourceType:'skill' as const})),
];

for(const selected of selfSkills){
  const skill=catalogSkill(data,selected.id);
  if(!skill)continue;

  const externalLegacy=selected.sourceType==='buff'&&build.buffs.some(row=>row.id===selected.id);
  if(!externalLegacy&&!canUseSkillWithEquipment(skill,build,data))continue;

  const abilities=[
    ...(skill.abilities??[]),
    ...(skill.levels.find(row=>row.level===selected.level)?.abilities??[]),
  ];

  for(const ability of abilities){
    let confidence:'verified'|'unsupported'='verified';

    if(selected.sourceType==='self-buff'){
      const support=getWeaponParameterSupport(ability.parameter);
      // Reuse the current explicit stat/combat consumer registry. A trigger,
      // unknown parameter or recognized-but-unimplemented mechanic must not
      // silently become a normal stat modifier.
      if(
        support.status==='unknown'
        ||support.status==='recognized-unsupported'
        ||support.trigger
      )confidence='unsupported';
    }

    out.push(modifier(
      ability,
      selected.sourceType,
      {sourceId:skill.id,sourceName:skill.name},
      confidence,
    ));
  }
}
 if(build.pet){const pet=data.raisedpet.find(x=>x.petItemId===build.pet!.id);const bonus=getRaisedPetBonus(build.pet,pet);if(!bonus.errors.length)out.push(modifier({parameter:bonus.parameter,rate:bonus.rate,add:bonus.total},'pet',{sourceId:pet!.petItemId,sourceName:'Raised Pet — '+(data.item.find(x=>x.id===pet!.petItemId)?.name??'#'+pet!.petItemId)}));}
 return out.filter(m=>build.mode==='pvp'?m.pvp!==false:m.pve!==false);
}

export function modifiersToAbilities(modifiers:StatModifier[]):Ability[]{return modifiers.filter(m=>!['base','allocated'].includes(m.sourceType)&&m.confidence!=='unsupported').map(m=>m.rawAbility&&m.parameter===m.rawParameter?m.rawAbility:{parameter:m.parameter,...(m.operation==='set'?{set:m.value}:{add:m.value,rate:m.operation==='rate'}),pvp:m.pvp,pve:m.pve,skill:m.rawAbility?.skill});}

