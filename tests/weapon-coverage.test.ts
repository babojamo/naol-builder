import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  auditWeaponEffects,
  getWeaponConditionalRate,
  getWeaponEffectInspectorRows,
  getWeaponParameterSupport,
  resolveWeaponEffects,
} from '../lib/weapon-effects';
import { getUltimateSocketRestrictions } from '../lib/item-rules';
import { getItemAbilityRange, initializeItemBaseStatRolls } from '../lib/item-stat-ranges';
import { resolveCanonicalParameter } from '../lib/stat-parameters';
import type { Ability, CharacterBuild, GameData, Item, Skill, Upgrade } from '../lib/model';

function json<T>(name:string):T{
  return JSON.parse(readFileSync(join(process.cwd(),'data',name),'utf8')) as T;
}

const data={
  item:json<Item[]>('item.json'),
  skill:json<Skill[]>('skill.json'),
  upgradelevelbonus:json<Upgrade[]>('upgradelevelbonus.json'),
  class:[],monster:[],equipset:[],statawake:[],skillawake:{},raisedpet:[],dungeon:[],version:0,syncedAt:'test',
} as GameData;

function minimalBuild(right?:Item,left?:Item):CharacterBuild{
  return {
    id:'weapon-coverage-test',name:'Weapon coverage',version:3,schemaVersion:3,handPreference:left?'dual-wield':'single-weapon',role:'damage',archetype:'test',
    support:{skillId:null,skillLevel:1,buffSkills:[],allyClassId:null,allyIncomingHealing:0},scoreWeights:{healing:0,buffPower:0,castSpeed:0,mpSustain:0,survivability:0},
    classId:1,level:190,sex:'male',baseStats:{str:15,sta:15,dex:15,int:15},equipment:{
      ...(right?{rightHand:{itemId:right.id,element:'none',elementUpgrade:0,awake:null,piercings:[]}}:{}),
      ...(left?{leftHand:{itemId:left.id,element:'none',elementUpgrade:0,awake:null,piercings:[]}}:{}),
    },pet:null,activeItems:[],skills:[],buffs:[],mode:'pve',purpose:'test',targetId:-1,targetHealthPercent:100,
    opponent:{id:-1,name:'Target',level:190,hp:1,defense:0,dex:0,parry:0,rank:'normal',element:'none'},attackType:'auto',theoretical:true,bonuses:[],
    coefficients:{attacksPerSecond:2,blockedMultiplier:.1,pvpMultiplier:.6,defenseWeight:1,statPointsPerLevel:2,elementScale:.01,hitBase:75,dexHitFactor:.2,levelHitFactor:1,leftHandMultiplier:1,leftHandFrequency:.5},
    metadata:{budget:'test',survival:0,demo:false,createdAt:'test',recommendations:[]},
  };
}

function findRoika(){
  const matches=data.item.filter(item=>item.category==='weapon'&&/roika/i.test(item.name)&&item.abilities?.some(a=>resolveCanonicalParameter(a.parameter)==='muranswrath'));
  return matches.sort((a,b)=>Number(b.rarity==='ultimate')-Number(a.rarity==='ultimate'))[0];
}
function findConch(){
  return data.item.find(item=>item.category==='weapon'&&/conch/i.test(item.name)&&item.abilities?.some(a=>resolveCanonicalParameter(a.parameter)==='skillchance'&&a.skill===11389));
}

test('every current weapon ability parameter has an explicit support classification',()=>{
  const audit=auditWeaponEffects(data);
  assert.ok(audit.uniqueParameters.length>0,'Expected current weapon parameters.');
  assert.equal(audit.unknown.length,0,'Unknown weapon effects:\n'+audit.unknown.map(x=>`${x.itemName} #${x.itemId} ${x.source} ${x.rawParameter}: ${JSON.stringify(x.ability)}`).join('\n'));
  for(const row of audit.uniqueParameters)assert.notEqual(row.status,'unknown',row.parameter+' must be explicitly classified');
});

test('every current item.triggerSkill is explicitly audited',()=>{
  const audit=auditWeaponEffects(data);
  const raw=data.item.filter(x=>x.category==='weapon').reduce((n,x)=>n+(x.triggerSkill?.length??0),0);
  assert.equal(audit.itemTriggerSkills.length,raw);
  for(const trigger of audit.itemTriggerSkills){
    assert.ok(trigger.itemId>0);
    assert.ok(trigger.itemName.length>0);
    assert.ok(trigger.skillId&&trigger.skillId>0);
    assert.ok(trigger.skillName.length>0);
    assert.equal(typeof trigger.supported,'boolean');
  }
});

test("actual Roika weapon data routes every intrinsic ability and Muran's Wrath",()=>{
  const roika=findRoika();
  assert.ok(roika,"Current data must contain a Roika weapon with Muran's Wrath.");
  const build=minimalBuild(roika);
  const gear=build.equipment.rightHand!;
  gear.baseStatRolls=initializeItemBaseStatRolls(roika,'maximum');
  gear.element='fire';gear.elementUpgrade=8;
  gear.additionalStat={source:'stat-scroll',abilities:[{parameter:'int',add:3}]};
  if(roika.rarity==='ultimate'||roika.ultimateConvertible)gear.ultimateWeapon={ultimateUpgrade:6,jewels:[],bonuses:{base:[]}};
  const electricShock=data.skill.find(skill=>/electric\s*shock/i.test(skill.name));
  if(electricShock)gear.weaponBonus={type:'skill',skillId:electricShock.id,value:23};

  const effects=resolveWeaponEffects(build,data,'rightHand');
  for(let index=0;index<(roika.abilities?.length??0);index++){
    const effect=effects.find(x=>x.source==='item.abilities'&&x.abilityIndex===index);
    assert.ok(effect,`Roika intrinsic ability line ${index} disappeared.`);
    assert.notEqual(effect.supportStatus,'unknown',`Roika line ${index} has unknown parameter ${roika.abilities?.[index]?.parameter}`);
    const range=getItemAbilityRange(roika,index);
    if(range)assert.equal(effect.value,range.max,`Configured Roika range ${range.ability.parameter} must use the selected maximum roll.`);
  }
  const muran=effects.find(x=>x.parameter==='muranswrath');
  assert.ok(muran);
  assert.equal(muran.type,'conditional-damage');
  assert.equal(muran.supported,true);
  assert.equal(muran.appliedToCombat,true);

  const inspector=getWeaponEffectInspectorRows(build,data,'rightHand');
  for(const source of ['base-attack','element-upgrade','additional-stat'] as const)assert.ok(inspector.some(row=>row.source===source),`Roika inspector is missing ${source}`);
  assert.ok(inspector.some(row=>row.source==='conditional'&&row.parameter==='muranswrath'));
  if(gear.ultimateWeapon)assert.ok(inspector.some(row=>row.source==='upgrade'));
  if(electricShock)assert.ok(inspector.some(row=>row.source==='weapon-bonus'&&row.skillId===electricShock.id));
});

test('actual Roika inspector exposes configured Ultimate, Additional Stat, Weapon Bonus, Jewel and Rune sources',()=>{
  const roika=findRoika();
  assert.ok(roika);
  const random=(roika.possibleRandomStats??[]).filter(a=>Number.isFinite(a.add));
  assert.ok(random.length>0,'Roika must expose possibleRandomStats for Ultimate random bonuses.');
  const asBonus=(ability:Ability)=>({parameter:ability.parameter,value:ability.add!,rate:!!ability.rate});
  const jewel=data.item.find(item=>item.subcategory==='ultimatejewel'&&getUltimateSocketRestrictions(item).kind==='jewel'&&(item.abilities?.length??0)>0);
  const rune=data.item.find(item=>['ultimatejewel','ultimaterune'].includes(item.subcategory??'')&&getUltimateSocketRestrictions(item).kind==='rune'&&(item.abilities?.length??0)>0);
  assert.ok(jewel,'Current data must contain an Ultimate Jewel with abilities.');
  assert.ok(rune,'Current data must contain an Ultimate Rune with abilities.');
  const electricShock=data.skill.find(skill=>/electric\s*shock/i.test(skill.name));
  assert.ok(electricShock,'Current data must contain Electric Shock.');
  const build=minimalBuild(roika),gear=build.equipment.rightHand!;
  gear.baseStatRolls=initializeItemBaseStatRolls(roika,'maximum');
  gear.element='fire';gear.elementUpgrade=8;
  gear.additionalStat={source:'stat-scroll',abilities:[{parameter:'int',add:3}]};
  gear.weaponBonus={type:'skill',skillId:electricShock.id,value:23};
  gear.ultimateWeapon={ultimateUpgrade:10,jewels:[{index:0,content:{kind:'jewel',itemId:jewel.id,tier:jewel.tier}},{index:1,content:{kind:'rune',itemId:rune.id}}],bonuses:{base:[asBonus(random[0]),asBonus(random[1]??random[0])],plus6:asBonus(random[2]??random[0]),plus10:asBonus(random[3]??random[0])}};
  const rows=getWeaponEffectInspectorRows(build,data,'rightHand'),sources=new Set(rows.map(row=>row.source));
  for(const source of ['base-attack','upgrade','element-upgrade','additional-stat','weapon-bonus','ultimate-random','ultimate-plus6','ultimate-plus10','ultimate-jewel','ultimate-rune','conditional'] as const)assert.ok(sources.has(source),`Roika inspector is missing ${source}`);
  for(const row of rows){assert.equal(typeof row.appliedToSheet,'boolean');assert.equal(typeof row.appliedToCombat,'boolean');assert.equal(typeof row.conditional,'boolean');assert.equal(typeof row.unsupported,'boolean');}
});

test('actual Conch data resolves configurable Waterbomb skillchance without inflating primary-target DPS',()=>{
  const conch=findConch();
  assert.ok(conch,'Current data must contain a Conch weapon with skillchance skill 11389.');
  const index=conch.abilities!.findIndex(a=>resolveCanonicalParameter(a.parameter)==='skillchance'&&a.skill===11389);
  assert.ok(index>=0);
  const range=getItemAbilityRange(conch,index);
  assert.ok(range,'Conch Waterbomb chance must remain a configurable intrinsic range.');
  const build=minimalBuild(conch);
  build.equipment.rightHand!.baseStatRolls=[{abilityIndex:index,value:range.max}];
  const effect=resolveWeaponEffects(build,data,'rightHand').find(x=>x.abilityIndex===index);
  assert.ok(effect);
  assert.equal(effect.skillId,11389);
  assert.match(effect.skillName??'',/water\s*bomb/i);
  assert.equal(effect.probability,range.max);
  assert.equal(effect.targetScope,'surrounding-targets');
  assert.equal(effect.supported,false);
  assert.equal(effect.appliedToCombat,false);
});

test('reference-backed conditional hand policy sums right and left equipped weapons',()=>{
  const right={id:900001,name:'Right Muran',description:'',category:'weapon',subcategory:'sword',icon:'',level:1,rarity:'test',element:'none',abilities:[{parameter:'muranswrath',add:10,rate:true}]} as Item;
  const left={id:900002,name:'Left Muran',description:'',category:'weapon',subcategory:'sword',icon:'',level:1,rarity:'test',element:'none',abilities:[{parameter:'muranswrath',add:7,rate:true}]} as Item;
  const local={...data,item:[...data.item,right,left]} as GameData;
  assert.equal(getWeaponConditionalRate(minimalBuild(right),local,'muranswrath'),10);
  const leftOnly=minimalBuild(undefined,left);
  assert.equal(getWeaponConditionalRate(leftOnly,local,'muranswrath'),7);
  assert.equal(getWeaponConditionalRate(minimalBuild(right,left),local,'muranswrath'),17);
});

test('weapon inspector covers every meaningful current equipped-weapon property',()=>{
  for(const item of data.item.filter(x=>x.category==='weapon')){
    const build=minimalBuild(item),rows=getWeaponEffectInspectorRows(build,data,'rightHand');
    if(Number.isFinite(item.minAttack)||Number.isFinite(item.maxAttack))assert.ok(rows.some(row=>row.source==='base-attack'),`${item.name}: base attack disappeared`);
    if(Number.isFinite(item.attackSpeedValue))assert.ok(rows.some(row=>row.source==='attack-speed'),`${item.name}: attack speed disappeared`);
    for(let index=0;index<(item.abilities?.length??0);index++)assert.ok(rows.some(row=>row.id.includes(`:${index}`)||row.source==='conditional'||row.source==='trigger'),`${item.name}: ability line ${index} disappeared`);
    if((item.additionalSkillDamage??0)!==0)assert.ok(rows.some(row=>row.source==='additional-skill-damage'),`${item.name}: additionalSkillDamage disappeared`);
    if(item.triggerSkill?.length)assert.ok(rows.filter(row=>row.source==='trigger').length>=item.triggerSkill.length,`${item.name}: triggerSkill disappeared`);
  }
});

test('registry never claims an unknown parameter is verified',()=>{
  const support=getWeaponParameterSupport('future_weapon_mechanic_xyz');
  assert.equal(support.status,'unknown');
  assert.equal(support.supported,false);
  assert.equal(support.confidence,'unsupported');
});
