import {lineage,type CharacterBuild,type GameData,type Skill} from './model';
import {maxSkillLevel} from './ringmaster-buffs';
import {compareDisplayName} from './catalog-sort';
import {canUseSkillWithEquipment} from './skill-weapons';
import {
  canSelectDamageSkill,
  getConfiguredSkillLevel,
  setSimulationSkill,
} from './skill-usage';

export function classProgression(classId:number,data:GameData){
  return lineage(classId,data).reverse().flatMap(id=>{
    const value=data.class.find(row=>row.id===id);
    return value?[value]:[];
  });
}

export function exactClassSkills(classId:number,data:GameData){
  return data.skill.filter(skill=>skill.class===classId).sort((a,b)=>compareDisplayName(a.name,b.name)||a.id-b.id);
}

export function getSkillTree(classId:number,data:GameData){
  const skills=exactClassSkills(classId,data);
  const variationIds=new Set(skills.flatMap(skill=>skill.masterVariations??[]));
  const normal=skills.filter(skill=>!skill.passive&&!variationIds.has(skill.id));
  const passives=skills.filter(skill=>skill.passive);
  const variations=data.skill.filter(skill=>variationIds.has(skill.id)).sort((a,b)=>compareDisplayName(a.name,b.name)||a.id-b.id);
  const positioned=normal.filter(skill=>skill.treePosition);
  const connections=positioned.flatMap(skill=>(skill.requirements??[]).flatMap(requirement=>{
    const from=positioned.find(candidate=>candidate.id===requirement.skill);
    return from?[{from:from.id,to:skill.id,level:requirement.level}]:[];
  }));
  return {skills,normal,passives,variations,connections};
}

export function skillPrerequisiteReview(skill:Skill,build:CharacterBuild,data:GameData){
  return (skill.requirements??[]).map(requirement=>({
    ...requirement,
    name:data.skill.find(candidate=>candidate.id===requirement.skill)?.name??`Skill #${requirement.skill}`,
    configuredLevel:getConfiguredSkillLevel(requirement.skill,build,data),
  }));
}

export function canSelectSimulationSkill(skill:Skill,build:CharacterBuild,data:GameData){
  return canSelectDamageSkill(skill,build,data);
}

export function selectSimulationSkill(build:CharacterBuild,skill:Skill,level:number,data:GameData):CharacterBuild{
  if(!skill.levels.some(row=>row.level===level)||level<1||level>maxSkillLevel(skill)){
    throw Error('Skill level is unavailable.');
  }
  return setSimulationSkill(build,skill,level,data);
}

// Kept for consumers that only need the old direct compatibility question.
export function skillWeaponAvailable(skill:Skill,build:CharacterBuild,data:GameData){
  return canUseSkillWithEquipment(skill,build,data);
}

