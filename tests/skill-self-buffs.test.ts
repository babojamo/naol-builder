import {calculate} from '../combat/attack';
import {parseBuild} from '../lib/persistence';
import {setMaxPassives} from '../lib/skill-usage';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {collectCharacterModifiers} from '../lib/stat-modifiers';
import {
  analyzeSelfBuffSkill,
  auditSelfBuffSkills,
  getEligibleDamageSkills,
  getSelectableSelfBuffs,
  getSimulationSkillSelection,
  hasActiveSkillFamily,
  isPlayerFacingSelfBuffSkill,
  setSelfBuff,
  setSimulationSkill,
  skillFamilyRootId,
} from '../lib/skill-usage';
import {lineage,type CharacterBuild,type GameClass,type GameData,type Item,type Skill,type Target,type Upgrade} from '../lib/model';
import {maxSkillLevel} from '../lib/ringmaster-buffs';

function json<T>(name:string):T{
  return JSON.parse(readFileSync(join(process.cwd(),'data',name),'utf8')) as T;
}

const classes=json<GameClass[]>('class.json');
const items=json<Item[]>('item.json');
const skills=json<Skill[]>('skill.json');
const upgrades=json<Upgrade[]>('upgradelevelbonus.json');
const monsters=json<Target[]>('monster.json');

const data={
  class:classes,item:items,skill:skills,upgradelevelbonus:upgrades,monster:monsters,
  equipset:[],statawake:[],skillawake:{},raisedpet:[],dungeon:[],version:0,syncedAt:'test',
} as GameData;

function arcanistBuild():CharacterBuild{
  const arcanist=classes.find(row=>row.name==='Arcanist');
  assert.ok(arcanist,'Current data must contain Arcanist.');
  const classLineage=lineage(arcanist.id,data);
  const staff=items.find(item=>
    item.category==='weapon'
    &&item.subcategory==='staff'
    &&item.level<=190
    &&(!item.class||classLineage.includes(item.class))
  );
  assert.ok(staff,'Current data must contain an Arcanist-compatible staff.');
  const target=monsters[0]??{id:-1,name:'Target',level:1,hp:1,defense:0,dex:0,parry:0,rank:'normal',element:'none'};
  return {
    id:'self-buff-test',name:'Self Buff Test',version:3,schemaVersion:3,handPreference:'single-weapon',
    role:'damage',archetype:'test',support:{skillId:null,skillLevel:1,buffSkills:[],allyClassId:null,allyIncomingHealing:0},
    scoreWeights:{healing:0,buffPower:0,castSpeed:0,mpSustain:0,survivability:0},
    classId:arcanist.id,level:190,sex:'male',baseStats:{str:15,sta:15,dex:15,int:15},
    equipment:{rightHand:{itemId:staff.id,element:'fire',elementUpgrade:8,awake:null,piercings:[]}},
    pet:null,activeItems:[],skills:[],selfBuffs:[],simulationSkill:null,buffs:[],
    mode:'pve',purpose:'test',targetId:target.id,targetHealthPercent:100,opponent:target,
    attackType:'skill',theoretical:true,bonuses:[],
    coefficients:{attacksPerSecond:2,blockedMultiplier:.1,pvpMultiplier:.6,defenseWeight:1,statPointsPerLevel:2,elementScale:.01,hitBase:75,dexHitFactor:.2,levelHitFactor:1,leftHandMultiplier:1,leftHandFrequency:.5},
    metadata:{budget:'test',survival:0,demo:false,createdAt:'test',recommendations:[]},
  };
}

test('Arcanist Infusion is discoverable as a self buff and separate from the damage skill',()=>{
  const build=arcanistBuild();
  const infusion=skills.find(skill=>skill.id===12579)??skills.find(skill=>skill.inheritSkill===12579);
  assert.ok(infusion,'Current data must contain Infusion or an Infusion variation.');

  const selfBuffs=getSelectableSelfBuffs(build,data);
  assert.ok(selfBuffs.some(skill=>skill.id===infusion.id||skillFamilyRootId(skill,data)===12579),'Infusion family must appear in self buffs.');

  const damage=getEligibleDamageSkills(build,data)[0];
  assert.ok(damage,'Arcanist must have a compatible damage skill.');
  const withDamage=setSimulationSkill(build,damage,maxSkillLevel(damage),data);
  const withInfusion=setSelfBuff(withDamage,infusion,maxSkillLevel(infusion),data);

  assert.equal(getSimulationSkillSelection(withInfusion,data)?.id,damage.id,'Activating a self buff must not replace the simulated damage skill.');
  assert.ok(hasActiveSkillFamily(withInfusion,data,12579),'Infusion family must be active.');
});

test('Infusion direct stat effects enter the canonical modifier pipeline',()=>{
  const build=arcanistBuild();
  const infusion=skills.find(skill=>skill.id===12579)??skills.find(skill=>skill.inheritSkill===12579);
  assert.ok(infusion);
  const configured=setSelfBuff(build,infusion,maxSkillLevel(infusion),data);
  const modifiers=collectCharacterModifiers(configured,data).filter(modifier=>modifier.sourceType==='self-buff'&&modifier.sourceId===infusion.id);
  assert.ok(modifiers.length>0,'Infusion must produce self-buff modifiers.');
  assert.ok(modifiers.some(modifier=>modifier.parameter==='attack')||analyzeSelfBuffSkill(infusion,data).supportedAbilities>0,'Infusion must expose its direct supported effect(s).');
});

test('Infusion master variation activates the same semantic family',()=>{
  const build=arcanistBuild();
  const variation=skills.find(skill=>skill.inheritSkill===12579&&isPlayerFacingSelfBuffSkill(skill));
  if(!variation)return;
  const configured=setSelfBuff(build,variation,maxSkillLevel(variation),data);
  assert.equal(skillFamilyRootId(variation,data),12579);
  assert.equal(hasActiveSkillFamily(configured,data,12579),true);
});

test('all player-facing class self buffs receive an explicit coverage result',()=>{
  const audit=auditSelfBuffSkills(data);
  assert.ok(audit.totalCandidates>0);
  assert.equal(audit.rows.length,audit.totalCandidates);
  for(const row of audit.rows){
    assert.ok(['supported','partial','recognized-unsupported'].includes(row.status),`${row.className} / ${row.skillName} has no coverage classification.`);
  }
});

test('internal currentplayer helper skills without a class are not exposed as manual self buffs',()=>{
  const helpers=skills.filter(skill=>skill.target==='currentplayer'&&skill.class===undefined);
  assert.ok(helpers.length>0,'Expected current data to contain internal currentplayer helper skills.');
  for(const skill of helpers)assert.equal(isPlayerFacingSelfBuffSkill(skill),false,`${skill.name} should not be exposed as a manual self buff.`);
});

test('known cross-class self-buff examples are audited when present',()=>{
  const patterns=[
    /Infusion/i,
    /Toxic Fury/i,
    /Nen Overflow/i,
    /Critical Stab/i,
    /Kyrie Eleison/i,
    /Barrage/i,
  ];
  const audit=auditSelfBuffSkills(data);
  for(const pattern of patterns){
    const exists=skills.some(skill=>pattern.test(skill.name)&&isPlayerFacingSelfBuffSkill(skill));
    if(exists)assert.ok(audit.rows.some(row=>pattern.test(row.skillName)),`${pattern} must be included in self-buff audit.`);
  }
});
test('explicit skill and self buffs survive persistence; old attack selection survives Max Passives',()=>{
 const build=arcanistBuild(),damage=getEligibleDamageSkills(build,data)[0],infusion=skills.find(skill=>skill.id===12579)!;
 const configured=setSelfBuff(setSimulationSkill(build,damage,maxSkillLevel(damage),data),infusion,maxSkillLevel(infusion),data),loaded=parseBuild(JSON.parse(JSON.stringify(configured)),data);
 assert.deepEqual(loaded.simulationSkill,configured.simulationSkill);assert.deepEqual(loaded.selfBuffs,configured.selfBuffs);
 const legacy={...build,simulationSkill:null,skills:[{id:damage.id,level:maxSkillLevel(damage)}]};
 assert.equal(getSimulationSkillSelection(setMaxPassives(legacy,data),data)?.id,damage.id);
});
test('Infusion changes both effective element and final Attack without replacing the attack selection',()=>{
 const build=arcanistBuild(),damage=skills.find(skill=>skill.name==='Fire Strike')!,infusion=skills.find(skill=>skill.id===12579)!;
 build.equipment.rightHand!.element='water';
 const configured=setSimulationSkill(build,damage,maxSkillLevel(damage),data),before=calculate(configured,data),active=calculate(setSelfBuff(configured,infusion,maxSkillLevel(infusion),data),data);
 assert.equal(before.effectiveElement,'fire');assert.equal(active.effectiveElement,'water');
 assert.ok(active.stats.attack<before.stats.attack);
 assert.ok(active.stats.statDetails.attack.breakdown.some(row=>row.source==='Infusion'&&row.value<0));
 assert.equal(getSimulationSkillSelection(configured,data)?.id,damage.id);
});
test('explicit self buff migrated from legacy external buffs contributes only once',()=>{
 const build=arcanistBuild(),infusion=skills.find(skill=>skill.id===12579)!,level=maxSkillLevel(infusion);
 const active=setSelfBuff({...build,buffs:[{id:infusion.id,level}]},infusion,level,data),modifiers=collectCharacterModifiers(active,data).filter(row=>row.sourceId===infusion.id&&row.parameter==='attack');
 assert.equal(modifiers.length,1);assert.equal(modifiers[0].sourceType,'self-buff');
});

