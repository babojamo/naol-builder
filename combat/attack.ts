import {catalogSkill} from '../lib/catalog-index';
import {isWeaponCompatibleWithSkills,getConfiguredUpgrade} from '../lib/item-rules';
import {abilities,percent,clamp,derive,type Derived} from './character';
import {mainHandSkillBonus} from '../lib/skill-awake';
import {getFlatAbility,getRateAbility} from '../lib/stat-parameters';
import {postDefenseDamage} from './formulas/attack-defense';
import {contextHitChance} from './formulas/hit';
import {criticalMultiplierRange,effectiveCriticalChance} from './formulas/critical';
import {effectiveBlock} from './formulas/block';
import {elementFactors,skillElementMultiplier} from './formulas/elements';
import {attackCycle,cycleDamage,offhandMultiplier} from './formulas/dual-wield';
import {getLevelDifferenceDamageMultiplier,modeDamageMultiplier} from './formulas/mode-modifiers';
import {effectivePlayerDefense,effectiveMonsterDefense} from './formulas/defense';
import {upgradedSkillWeapon,calculateSkillPower} from './formulas/skill-power';
import {weaponStatContribution} from './formulas/weapon-attack';
import type {CharacterBuild,Element,GameData,Target,Gear} from '../lib/model';
export const elements:Element[]=['none','fire','water','electricity','earth','wind'];
export function elementMultiplier(b:CharacterBuild,t:Target,d:GameData,hand?:Gear){const g=hand??b.equipment.rightHand;if(!g||g.element==='none'||g.elementUpgrade===0)return 1;const factors=elementFactors(g.element,t.element,g.elementUpgrade+getFlatAbility(abilities(b,d),'elementattack'),t.element==='none'?0:1,d.upgradelevelbonus);const resistance=Number(t[('resist'+g.element[0].toUpperCase()+g.element.slice(1)) as keyof Target]??0);return factors.attack*Math.max(0,1-resistance);}
export function hitProbability(s:Derived,b:CharacterBuild,t:Target){return contextHitChance({context:b.mode==='pvp'?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:t.level===-1?b.level:t.level,rating:s.dex,parry:t.parry,bonus:Math.max(0,s.hitRate-b.level-s.dex)}).probability;}
export function expectedDamage(normal:number,critical:number,hit:number,crit:number,block:number,blockedMultiplier:number){return hit*((1-crit)*normal+crit*critical)*((1-block)+block*blockedMultiplier);}
export function opponentTarget(b:CharacterBuild,d:GameData):Target{if(!b.opponentBuild)return b.opponent;const o=b.opponentBuild,s=derive(o,d);return {...b.opponent,name:o.name,level:o.level,hp:s.hp,defense:s.defense,magicDefense:s.magicDefense,dex:s.dex,parry:s.parry,block:s.block,criticalResist:s.critResist,pvpReduction:s.pvpReduction,minAttack:s.attackMin,maxAttack:s.attackMax};}
export function calculate(b:CharacterBuild,d:GameData,override?:Target){
 const s=derive(b,d),a=abilities(b,d),t=override??(b.mode==='pvp'?opponentTarget(b,d):d.monster.find(x=>x.id===b.targetId)??d.monster[0]),pvp=b.mode==='pvp',targetLevel=t.level===-1?b.level:t.level;
 const chosen=b.skills.find(x=>!catalogSkill(d,x.id)?.passive),skill=b.attackType==='skill'?catalogSkill(d,chosen?.id):undefined,sl=skill?.levels.find(x=>x.level===chosen?.level),skillUsable=!skill||isWeaponCompatibleWithSkills(s.weapon,[skill]),wand=!skill&&s.weapon?.subcategory==='wand',magical=!!skill?.magic||wand;
 let defense=effectiveMonsterDefense(magical?t.magicDefense??t.defense:t.defense,!!skill||wand);
 if(pvp){if(b.opponentBuild){const ob=b.opponentBuild,os=derive(ob,d),oc=d.class.find(x=>x.id===ob.classId)!,oa=abilities(ob,d);defense=effectivePlayerDefense({level:ob.level,sta:os.sta,dex:os.dex,int:os.int,classDefense:oc.defense,magicSta:oc.magicDefenseStaFactor,magicInt:oc.magicDefenseIntFactor,equipment:os.armorDefense,flat:getFlatAbility(oa,magical?'magicdefense':'def'),rate:getRateAbility(oa,magical?'magicdefense':'def'),magic:magical,skill:!!skill,pvp});}else defense=(magical?t.magicDefense??t.defense:t.defense)*.6;}
 const el=skill?skillElementMultiplier(skill.element??'none',b.equipment.rightHand?.element??s.weapon?.element??'none',Number(t[('resist'+(skill.element??'none')[0].toUpperCase()+(skill.element??'none').slice(1)) as keyof Target]??0),b.buffs.some(x=>x.id===12579)||b.support.buffSkills.some(x=>x.id===12579)):elementMultiplier(b,t,d),levelMultiplier=getLevelDifferenceDamageMultiplier(b.level,targetLevel,pvp);
 const mode=modeDamageMultiplier({pvp,pve:s.pve,pvpDamage:s.pvp,boss:s.boss,rank:t.rank,reduction:pvp?Math.min(50,t.pvpReduction??0):0,incoming:0,level:levelMultiplier});
 const skillFactor=skill?1+mainHandSkillBonus(b,skill,d)/100:1,damageBonus=skill?(1+getRateAbility(a,'skilldamage')/100)*(1+(d.class.find(x=>x.id===skill.class)?.type==='specialist'?getRateAbility(a,'thirdjobskilldamage'):0)/100):1+getRateAbility(a,'autoattackdamage')/100;
 let main={min:s.rightAttack.min,max:s.rightAttack.max},notes:string[]=[];
 const weapon=s.weapon,g=b.equipment.rightHand,upgrade=weapon&&g?getConfiguredUpgrade(weapon,g):0,effectiveUpgrade=g?.ultimateWeapon||weapon?.rarity==='ultimate'?upgrade+10:upgrade,up=d.upgradelevelbonus.find(x=>x.upgradeLevel===effectiveUpgrade),weaponRange=upgradedSkillWeapon((weapon?.minAttack??1)+getFlatAbility(a,'minability'),(weapon?.maxAttack??2)+getFlatAbility(a,'maxability'),1+(up?.weaponAttack??0)/100,effectiveUpgrade);
 if(skill&&sl){const power=calculateSkillPower({weapon:weaponRange,additionalSkillDamage:Number(weapon?.additionalSkillDamage??0),skill,level:sl,selectedLevel:sl.level,stats:s,abilities:a,family:weapon?.subcategory??'hand',build:b,data:d});main=power;notes=power.notes;}
 else if(wand){const c=d.class.find(x=>x.id===b.classId)!;const extra=weaponStatContribution('wand',s,b.level,c.autoAttackFactors.wand,getFlatAbility(a,'wandattack'))+getFlatAbility(a,'damage');main={min:(weaponRange.min+extra)*.6,max:(weaponRange.max+extra)*.6};notes.push('Normal uncharged wand attacks; charging remains unsupported.');}
 const modifier=mode*skillFactor*damageBonus;
 const damage=(attack:number,element:number)=>skillUsable?Math.max(0,postDefenseDamage(attack*element+(pvp?0:getFlatAbility(a,'pvedamage')),defense))*modifier:0;
 const rightNormalMin=damage(main.min,el),rightNormalMax=damage(main.max,el),leftElement=elementMultiplier(b,t,d,b.equipment.leftHand),leftFactor=offhandMultiplier(getRateAbility(a,'lefthanddamage')),leftNormalMin=s.leftAttack?damage(s.leftAttack.min,leftElement)*leftFactor:0,leftNormalMax=s.leftAttack?damage(s.leftAttack.max,leftElement)*leftFactor:0;
 const cycle=attackCycle(!skill&&!!s.leftAttack),normalMin=cycle.reduce((n,x)=>n+cycleDamage(x,rightNormalMin,leftNormalMin),0)/cycle.length,normalMax=cycle.reduce((n,x)=>n+cycleDamage(x,rightNormalMax,leftNormalMax),0)/cycle.length,normal=(normalMin+normalMax)/2;
 const criticalRange=criticalMultiplierRange({attackerLevel:b.level,defenderLevel:targetLevel,attackerPlayer:true,defenderPlayer:pvp,bonus:getRateAbility(a,'criticaldamage'),pvpBonus:pvp?getRateAbility(a,'pvpcriticaldamage'):0,wand});
 const criticalMin=normalMin*criticalRange.min,criticalMax=normalMax*criticalRange.max,critical=normal*criticalRange.average;
 const hit=contextHitChance({context:pvp?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:targetLevel,rating:s.dex,parry:t.parry,bonus:getRateAbility(a,'hitrate')}).probability,crit=skill?0:effectiveCriticalChance(s.crit,t.criticalResist??0,pvp?getRateAbility(a,'pvpcriticalchance'):0);
 const ob=b.opponentBuild,oa=ob?abilities(ob,d):[],oc=ob?d.class.find(x=>x.id===ob.classId):undefined;
 const blockContext={defenderPlayer:pvp,defenderLevel:targetLevel,attackerLevel:b.level,defenderDex:t.dex,attackerDex:s.dex,classFactor:oc?.block??0,generic:ob?getRateAbility(oa,'block'):t.block??0,melee:ob?getRateAbility(oa,'meleeblock')-getRateAbility(oa,'block'):0,ranged:ob?getRateAbility(oa,'rangedblock')-getRateAbility(oa,'block'):0,pvpBlock:ob?getRateAbility(oa,'pvpblock'):0,penetration:s.blockPen,pvpPenetration:s.pvpBlockPen,pvp,attackerRank:'player',rangedAttack:['bow','yoyo','wand'].includes(weapon?.subcategory??''),parry:t.parry};
 const blockResult=effectiveBlock(blockContext),block=skill?0:blockResult.probability,blockedMultiplier=blockResult.damageMultiplier,expected=expectedDamage(normal,critical,hit,crit,block,blockedMultiplier),connected=hit?expected/hit:0;
 const interval=skill?Math.max(.25,Number(pvp?sl?.cooldownPVP??sl?.cooldown??0:sl?.cooldown??0),Number(sl?.casting??0)*(1-clamp(percent(0,'decreasedcastingtime',a),0,90)/100)):1/s.internalAttackSpeed,sustained=expected/interval,dpsFor=(duration:number)=>Math.floor(duration/interval)*expected/duration;
 return {skillUsable,skillStatus:skillUsable?'usable':'unusable',stats:s,target:t,rightNormalMin,rightNormalMax,leftNormalMin,leftNormalMax,leftFraction:0,cycle,normalMin,normalMax,normal,criticalMin,criticalMax,critical,criticalRange,connected,expected,hit,miss:1-hit,crit,rawCriticalChance:s.crit/100,block,effectiveMeleeBlock:effectiveBlock({...blockContext,rangedAttack:false}).probability,effectiveRangedBlock:effectiveBlock({...blockContext,rangedAttack:true}).probability,blockedMultiplier,element:el,modifier,defense,interval,dps:sustained,burst:dpsFor(5),dpsFor,ttk:sustained>0?t.hp/sustained:Infinity,notes,calculationStages:{defense,levelMultiplier,mode,skillFactor,damageBonus,element:el,offhand:leftFactor},probabilities:{miss:1-hit,normal:hit*(1-crit)*(1-block),critical:hit*crit*(1-block),blocked:hit*(1-crit)*block,blockedCritical:hit*crit*block}};
}
export type Combat=ReturnType<typeof calculate>;
