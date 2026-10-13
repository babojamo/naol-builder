import {catalogSkill} from './catalog-index';
import {compareDisplayName} from './catalog-sort';
import {maxSkillLevel} from './ringmaster-buffs';
import {canUseSkillWithEquipment} from './skill-weapons';
import {getWeaponParameterSupport} from './weapon-effects';
import {lineage,type Ability,type CharacterBuild,type GameData,type Skill,type SkillLevel} from './model';

export type SkillSelection={id:number;level:number};
export type SelfBuffCoverageStatus='supported'|'partial'|'recognized-unsupported';

export interface SelfBuffCoverage {
  skillId:number;
  skillName:string;
  familyRootId:number;
  status:SelfBuffCoverageStatus;
  directAbilities:number;
  supportedAbilities:number;
  unsupportedParameters:string[];
  unknownParameters:string[];
  specialMechanics:string[];
  notes:string[];
}

export interface SelfBuffFamily {
  rootId:number;
  rootName:string;
  skills:Skill[];
}

const specialSkillFields=[
  'pulseSkill','hymnSkill','triggerSkill','changeSkillIfHasBuff',
  'maxSkillStacks','stackAbilities','requiredHPThresholdRate',
  'fullChargeSkill','debuffSkill','buffSkill',
] as const;

const specialLevelFields=[
  'scalingParameters','synergies','gainedSkillStacks','consumedSkillStacks',
  'changeSkillIfHasBuff','requiredHPThresholdRate','pulseSkill','hymnSkill',
  'triggerSkill','stackAbilities',
] as const;

function hasMeaningfulValue(value:unknown){
  if(value===undefined||value===null||value===false)return false;
  if(Array.isArray(value))return value.length>0;
  if(typeof value==='object')return Object.keys(value as Record<string,unknown>).length>0;
  return true;
}

function rawFieldNames(value:unknown,keys:readonly string[]){
  if(!value||typeof value!=='object')return [];
  const record=value as Record<string,unknown>;
  return keys.filter(key=>hasMeaningfulValue(record[key]));
}

export function skillIsDamaging(skill:Skill){
  return !skill.passive&&skill.levels.some(level=>level.minAttack!==undefined||level.maxAttack!==undefined);
}

export function skillFamilyRootId(skillOrId:Skill|number,data:Pick<GameData,'skill'>){
  let id=typeof skillOrId==='number'?skillOrId:skillOrId.id;
  let current=typeof skillOrId==='number'?catalogSkill(data,skillOrId):skillOrId;
  const seen=new Set<number>();
  while(current?.inheritSkill&&!seen.has(current.id)){
    seen.add(current.id);
    id=current.inheritSkill;
    current=catalogSkill(data,current.inheritSkill);
  }
  return id;
}

export function getSimulationSkillSelection(build:CharacterBuild,data:Pick<GameData,'skill'>):SkillSelection|null{
  const explicit=build.simulationSkill;
  if(explicit){
    const skill=catalogSkill(data,explicit.id);
    if(skill&&skillIsDamaging(skill))return explicit;
  }
  // Schema-3 backwards compatibility: old builds kept the simulated attack as
  // the one non-passive entry in skills[].
  const legacy=build.skills.find(row=>{
    const skill=catalogSkill(data,row.id);
    return !!skill&&skillIsDamaging(skill);
  });
  return legacy??null;
}

export function getConfiguredSkillLevel(skillId:number,build:CharacterBuild,data:Pick<GameData,'skill'>){
  const simulation=getSimulationSkillSelection(build,data);
  if(simulation?.id===skillId)return simulation.level;
  const self=(build.selfBuffs??[]).find(row=>row.id===skillId);
  if(self)return self.level;
  const learned=build.skills.find(row=>row.id===skillId);
  if(learned)return learned.level;
  const external=build.buffs.find(row=>row.id===skillId);
  if(external)return external.level;
  const support=build.support.buffSkills.find(row=>row.id===skillId);
  return support?.level??null;
}

export function canSelectDamageSkill(skill:Skill,build:CharacterBuild,data:GameData){
  return skillIsDamaging(skill)
    &&(!skill.class||lineage(build.classId,data).includes(skill.class))
    &&skill.level<=build.level
    &&canUseSkillWithEquipment(skill,build,data);
}

export function getEligibleDamageSkills(build:CharacterBuild,data:GameData){
  const classes=new Set(lineage(build.classId,data));
  return data.skill
    .filter(skill=>skillIsDamaging(skill))
    .filter(skill=>!skill.class||classes.has(skill.class))
    .filter(skill=>skill.level<=build.level)
    .filter(skill=>canUseSkillWithEquipment(skill,build,data))
    .sort((a,b)=>{
      const ai=skillClassOrder(a,build,data),bi=skillClassOrder(b,build,data);
      return ai-bi||compareDisplayName(a.name,b.name)||a.id-b.id;
    });
}

function skillClassOrder(skill:Skill,build:CharacterBuild,data:GameData){
  const order=lineage(build.classId,data).reverse();
  const index=skill.class===undefined?-1:order.indexOf(skill.class);
  return index<0?999:index;
}

export function setSimulationSkill(build:CharacterBuild,skill:Skill,level:number,data:GameData):CharacterBuild{
  const max=maxSkillLevel(skill);
  if(!canSelectDamageSkill(skill,build,data)||!skill.levels.some(row=>row.level===level)||level<1||level>max){
    throw Error('Skill is unavailable for this character, weapon or level.');
  }
  return {
    ...build,
    attackType:'skill',
    simulationSkill:{id:skill.id,level},
    // Once the new explicit field is written, keep skills[] for learned/passive
    // configuration only. This removes the legacy overloaded attack entry.
    skills:build.skills.filter(row=>catalogSkill(data,row.id)?.passive),
  };
}

export function clearSimulationSkill(build:CharacterBuild,data:Pick<GameData,'skill'>):CharacterBuild{
  return {
    ...build,
    simulationSkill:null,
    skills:build.skills.filter(row=>catalogSkill(data,row.id)?.passive),
  };
}

export function isPlayerFacingSelfBuffSkill(skill:Skill){
  if(skill.passive||skill.debuff||skill.target!=='currentplayer'||skill.class===undefined||skillIsDamaging(skill))return false;
  // Require a lasting/direct effect or a known special mechanic. This excludes
  // most internal currentplayer helper skills that have no player-facing effect.
  const hasLevelEffect=skill.levels.some(level=>{
    const raw=level as SkillLevel&Record<string,unknown>;
    return (level.abilities?.length??0)>0
      ||Number(raw.duration??0)>0
      ||specialLevelFields.some(key=>hasMeaningfulValue(raw[key]));
  });
  const rawSkill=skill as Skill&Record<string,unknown>;
  return hasLevelEffect
    ||(skill.abilities?.length??0)>0
    ||specialSkillFields.some(key=>hasMeaningfulValue(rawSkill[key]));
}

export function canActivateSelfBuff(skill:Skill,build:CharacterBuild,data:GameData){
  return isPlayerFacingSelfBuffSkill(skill)
    &&!!skill.class
    &&lineage(build.classId,data).includes(skill.class)
    &&skill.level<=build.level
    &&canUseSkillWithEquipment(skill,build,data);
}

export function getSelectableSelfBuffs(build:CharacterBuild,data:GameData){
  return data.skill
    .filter(skill=>canActivateSelfBuff(skill,build,data))
    .sort((a,b)=>{
      const ar=skillFamilyRootId(a,data),br=skillFamilyRootId(b,data);
      const an=catalogSkill(data,ar)?.name??a.name,bn=catalogSkill(data,br)?.name??b.name;
      return compareDisplayName(an,bn)||compareDisplayName(a.name,b.name)||a.id-b.id;
    });
}

export function getSelfBuffFamilies(build:CharacterBuild,data:GameData):SelfBuffFamily[]{
  const groups=new Map<number,Skill[]>();
  for(const skill of getSelectableSelfBuffs(build,data)){
    const root=skillFamilyRootId(skill,data);
    const list=groups.get(root)??[];
    list.push(skill);
    groups.set(root,list);
  }
  return [...groups.entries()].map(([rootId,skills])=>{
    skills.sort((a,b)=>{
      if(a.id===rootId)return -1;
      if(b.id===rootId)return 1;
      return compareDisplayName(a.name,b.name)||a.id-b.id;
    });
    return {
      rootId,
      rootName:catalogSkill(data,rootId)?.name??skills[0]?.name??`Skill #${rootId}`,
      skills,
    };
  }).sort((a,b)=>compareDisplayName(a.rootName,b.rootName)||a.rootId-b.rootId);
}

export function activeSelfBuffSelections(build:CharacterBuild,data:Pick<GameData,'skill'>){
  const byFamily=new Map<number,SkillSelection>();
  for(const selected of build.selfBuffs??[]){
    const skill=catalogSkill(data,selected.id);
    if(!skill)continue;
    byFamily.set(skillFamilyRootId(skill,data),selected);
  }
  return [...byFamily.values()];
}

export function getActiveSelfBuffForFamily(build:CharacterBuild,data:Pick<GameData,'skill'>,rootId:number){
  return activeSelfBuffSelections(build,data).find(selected=>{
    const skill=catalogSkill(data,selected.id);
    return !!skill&&skillFamilyRootId(skill,data)===rootId;
  })??null;
}

function lockedIds(skill:Skill){
  const raw=skill as Skill&Record<string,unknown>;
  return Array.isArray(raw.lockedBy)?raw.lockedBy.filter(Number.isFinite).map(Number):[];
}

export function setSelfBuff(build:CharacterBuild,skill:Skill,level:number,data:GameData):CharacterBuild{
  if(!canActivateSelfBuff(skill,build,data)||!skill.levels.some(row=>row.level===level)){
    throw Error('Self buff is unavailable for this character, weapon or level.');
  }
  const root=skillFamilyRootId(skill,data);
  const incomingLocked=new Set(lockedIds(skill));
  const next=activeSelfBuffSelections(build,data).filter(selected=>{
    const existing=catalogSkill(data,selected.id);
    if(!existing)return false;
    if(skillFamilyRootId(existing,data)===root)return false;
    if(incomingLocked.has(existing.id))return false;
    if(lockedIds(existing).includes(skill.id))return false;
    return true;
  });
  next.push({id:skill.id,level});
  return {...build,selfBuffs:next};
}

export function removeSelfBuffFamily(build:CharacterBuild,data:Pick<GameData,'skill'>,rootId:number):CharacterBuild{
  return {
    ...build,
    selfBuffs:(build.selfBuffs??[]).filter(selected=>{
      const skill=catalogSkill(data,selected.id);
      return !skill||skillFamilyRootId(skill,data)!==rootId;
    }),
  };
}

export function hasActiveSkillFamily(build:CharacterBuild,data:Pick<GameData,'skill'>,familyRootId:number){
  const selections=[
    ...activeSelfBuffSelections(build,data),
    ...build.buffs,
    ...build.support.buffSkills,
  ];
  return selections.some(selected=>{
    const skill=catalogSkill(data,selected.id);
    return selected.id===familyRootId||!!skill&&skillFamilyRootId(skill,data)===familyRootId;
  });
}

export function skillLevelAbilities(skill:Skill,level:number):Ability[]{
  return [
    ...(skill.abilities??[]),
    ...(skill.levels.find(row=>row.level===level)?.abilities??[]),
  ];
}

export function analyzeSelfBuffSkill(skill:Skill,data:Pick<GameData,'skill'>,level=maxSkillLevel(skill)):SelfBuffCoverage{
  const abilities=skillLevelAbilities(skill,level);
  const barrage=skillFamilyRootId(skill,data)===24775;
  const supports=abilities.map(ability=>({ability,support:barrage&&['pvemultistrike','pvpmultistrike'].includes(ability.parameter)?{...getWeaponParameterSupport(ability.parameter),status:'combat-supported' as const,appliedToCombat:true}:getWeaponParameterSupport(ability.parameter)}));
  const unknownParameters=[...new Set(supports.filter(row=>row.support.status==='unknown').map(row=>row.support.parameter))];
  const unsupportedParameters=[...new Set(supports.filter(row=>row.support.status==='recognized-unsupported'||row.support.trigger).map(row=>row.support.parameter))];
  const supportedAbilities=supports.filter(row=>row.support.appliedToSheet||row.support.appliedToCombat||row.support.conditional).length;

  const skillRaw=skill as Skill&Record<string,unknown>;
  const levelRaw=skill.levels.find(row=>row.level===level) as (SkillLevel&Record<string,unknown>)|undefined;
  const specialMechanics=[
    ...rawFieldNames(skillRaw,specialSkillFields),
    ...rawFieldNames(levelRaw,specialLevelFields),
  ].filter((value,index,array)=>array.indexOf(value)===index);

  const root=skillFamilyRootId(skill,data);
  // Infusion has a verified special combat consumer in combat/attack.ts:
  // while active, elemental skills use the applied weapon element.
  const supportedSpecial=root===12579;
  const notes:string[]=[];
  if(barrage)notes.push('Barrage is estimated as one equal-damage extra bow arrow per proc in sustained throughput; no recursive procs. Proc damage equivalence remains uncalibrated.');
  if(supportedSpecial)notes.push('Infusion weapon-element override is modeled by the combat engine.');
  if(unknownParameters.length)notes.push('Unknown ability parameters: '+unknownParameters.join(', ')+'.');
  if(unsupportedParameters.length)notes.push('Recognized but not calculated directly: '+unsupportedParameters.join(', ')+'.');
  if(specialMechanics.length)notes.push('Additional API mechanics need review: '+specialMechanics.join(', ')+'.');

  let status:SelfBuffCoverageStatus;
  if(supportedAbilities===0&&!supportedSpecial)status='recognized-unsupported';
  else if(barrage||unknownParameters.length||unsupportedParameters.length||specialMechanics.length)status='partial';
  else status='supported';

  return {
    skillId:skill.id,
    skillName:skill.name,
    familyRootId:root,
    status,
    directAbilities:abilities.length,
    supportedAbilities,
    unsupportedParameters,
    unknownParameters,
    specialMechanics,
    notes,
  };
}

export function getEligiblePassiveSkills(build:CharacterBuild,data:GameData){
  const classes=new Set(lineage(build.classId,data));
  return data.skill
    .filter(skill=>skill.passive&&!!skill.class&&classes.has(skill.class)&&skill.level<=build.level)
    .filter(skill=>canUseSkillWithEquipment(skill,build,data))
    .sort((a,b)=>skillClassOrder(a,build,data)-skillClassOrder(b,build,data)||compareDisplayName(a.name,b.name)||a.id-b.id);
}

export function setMaxPassives(build:CharacterBuild,data:GameData):CharacterBuild{
  const passives=getEligiblePassiveSkills(build,data).map(skill=>({id:skill.id,level:maxSkillLevel(skill)}));
  return {
    ...build,
    simulationSkill:getSimulationSkillSelection(build,data),
    skills:passives,
  };
}

export function clearPassives(build:CharacterBuild,data:Pick<GameData,'skill'>):CharacterBuild{
  return {
    ...build,
    skills:build.skills.filter(row=>!catalogSkill(data,row.id)?.passive),
  };
}

export function auditSelfBuffSkills(data:GameData){
  const candidates=data.skill.filter(isPlayerFacingSelfBuffSkill);
  const rows=candidates.map(skill=>{
    const coverage=analyzeSelfBuffSkill(skill,data,maxSkillLevel(skill));
    return {
      classId:skill.class!,
      className:data.class.find(row=>row.id===skill.class)?.name??`Class #${skill.class}`,
      weapon:skill.weapon??null,
      target:skill.target,
      ...coverage,
    };
  }).sort((a,b)=>compareDisplayName(a.className,b.className)||compareDisplayName(a.skillName,b.skillName)||a.skillId-b.skillId);

  const unknown=rows.filter(row=>row.unknownParameters.length);
  const partial=rows.filter(row=>row.status==='partial');
  const unsupported=rows.filter(row=>row.status==='recognized-unsupported');
  const supported=rows.filter(row=>row.status==='supported');
  const byClass=[...new Set(rows.map(row=>row.classId))].map(classId=>{
    const classRows=rows.filter(row=>row.classId===classId);
    return {
      classId,
      className:classRows[0]?.className??`Class #${classId}`,
      total:classRows.length,
      supported:classRows.filter(row=>row.status==='supported').length,
      partial:classRows.filter(row=>row.status==='partial').length,
      unsupported:classRows.filter(row=>row.status==='recognized-unsupported').length,
    };
  }).sort((a,b)=>compareDisplayName(a.className,b.className)||a.classId-b.classId);

  return {
    totalCandidates:rows.length,
    supported,
    partial,
    unsupported,
    unknown,
    rows,
    byClass,
  };
}
