import {catalogSkill} from '../lib/catalog-index';
import {isWeaponCompatibleWithSkills,getConfiguredUpgrade} from '../lib/item-rules';
import {abilities,percent,clamp,derive,type Derived} from './character';
import {mainHandSkillBonus} from '../lib/skill-awake';
import {getFlatAbility,getRateAbility} from '../lib/stat-parameters';
import {postDefenseDamage} from './formulas/attack-defense';
import {contextHitChance} from './formulas/hit';
import {criticalMultiplierRange,effectiveCriticalChance} from './formulas/critical';
import {effectiveBlock} from './formulas/block';
import {elementFactors,skillElementMultiplier,resolveEffectiveSkillElement} from './formulas/elements';
import {modifyAttack} from './formulas/attack-modifiers';
import {finalizeDamage} from './formulas/damage-stages';
import {attackCycle,cycleDamage,offhandMultiplier} from './formulas/dual-wield';
import {getLevelDifferenceDamageMultiplier,modeDamageMultiplier} from './formulas/mode-modifiers';
import {effectivePlayerDefense,effectiveMonsterDefense} from './formulas/defense';
import {upgradedSkillWeapon,calculateSkillPower} from './formulas/skill-power';
import {weaponStatContribution} from './formulas/weapon-attack';
import type {CharacterBuild,Element,GameData,Target,Gear} from '../lib/model';
export const elements:Element[]=['none','fire','water','electricity','earth','wind'];
function autoElementFactors(b:CharacterBuild,t:Target,d:GameData,g:Gear|undefined){const element=g?.element??'none',suit=b.opponentBuild?.equipment.suit,defenderElement=b.mode==='pvp'?(suit?.element??t.element):t.element,defenderUpgrade=b.mode==='pvp'?(suit?.elementUpgrade??0):1;if(element==='none'&&defenderElement==='none')return {attack:1,defense:1};return elementFactors(element,defenderElement,element==='none'?0:(g?.elementUpgrade??0)+getFlatAbility(abilities(b,d),'elementattack'),defenderUpgrade,d.upgradelevelbonus);}
export function elementMultiplier(b:CharacterBuild,t:Target,d:GameData,hand?:Gear){const g=hand??b.equipment.rightHand;if(!g||g.element==='none'||g.elementUpgrade===0)return 1;const factors=autoElementFactors(b,t,d,g),resistance=Number(t[('resist'+g.element[0].toUpperCase()+g.element.slice(1)) as keyof Target]??0);return factors.attack*Math.max(0,1-resistance);}
export function hitProbability(s:Derived,b:CharacterBuild,t:Target){return contextHitChance({context:b.mode==='pvp'?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:t.level===-1?b.level:t.level,rating:s.dex,parry:t.parry,bonus:Math.max(0,s.hitRate-b.level-s.dex)}).probability;}
export function expectedDamage(normal:number,critical:number,hit:number,crit:number,block:number,blockedMultiplier:number){return hit*((1-crit)*normal+crit*critical)*((1-block)+block*blockedMultiplier);}
export function opponentTarget(b:CharacterBuild,d:GameData):Target{if(!b.opponentBuild)return b.opponent;const o=b.opponentBuild,s=derive(o,d);return {...b.opponent,name:o.name,level:o.level,hp:s.hp,defense:s.defense,magicDefense:s.magicDefense,dex:s.dex,parry:s.parry,block:s.block,criticalResist:s.critResist,pvpReduction:s.pvpReduction,minAttack:s.attackMin,maxAttack:s.attackMax};}
export function calculate(b:CharacterBuild,d:GameData,override?:Target){
 const s=derive(b,d),a=abilities(b,d),t=override??(b.mode==='pvp'?opponentTarget(b,d):d.monster.find(x=>x.id===b.targetId)??d.monster[0]),pvp=b.mode==='pvp',targetLevel=t.level===-1?b.level:t.level;
 const chosen=b.skills.find(x=>!catalogSkill(d,x.id)?.passive),skill=b.attackType==='skill'?catalogSkill(d,chosen?.id):undefined,sl=skill?.levels.find(x=>x.level===chosen?.level),skillUsable=!skill||isWeaponCompatibleWithSkills(s.weapon,[skill]),wand=!skill&&s.weapon?.subcategory==='wand',magical=!!skill?.magic||wand;
 const targetAbilities=b.opponentBuild?abilities(b.opponentBuild,d):[];
 let defense=skill?.magic?Math.max(0,t.magicDefense??0):effectiveMonsterDefense(magical?t.magicDefense??t.defense:t.defense,!!skill||wand);
 if(pvp){if(b.opponentBuild){const ob=b.opponentBuild,os=derive(ob,d),oc=d.class.find(x=>x.id===ob.classId)!,oa=targetAbilities;defense=effectivePlayerDefense({level:ob.level,sta:os.sta,dex:os.dex,int:os.int,classDefense:oc.defense,magicSta:oc.magicDefenseStaFactor,magicInt:oc.magicDefenseIntFactor,equipment:os.armorDefense,flat:getFlatAbility(oa,magical?'magicdefense':'def'),rate:getRateAbility(oa,'def'),magic:magical,skill:!!skill,pvp});}else defense=Math.floor((magical?t.magicDefense??t.defense:t.defense)*.6);}
 const weaponElement=b.equipment.rightHand?.element!=='none'?b.equipment.rightHand?.element??'none':s.weapon?.element??'none',infusion=b.buffs.some(x=>x.id===12579)||b.support.buffSkills.some(x=>x.id===12579),effectiveElement=skill?resolveEffectiveSkillElement(skill.element??'none',weaponElement,infusion):weaponElement;
 const resistance=(element:Element)=>Number(t[('resist'+element[0].toUpperCase()+element.slice(1)) as keyof Target]??0);
 const el=skill?skillElementMultiplier(effectiveElement,weaponElement,resistance(effectiveElement),false):elementMultiplier(b,t,d),levelMultiplier=getLevelDifferenceDamageMultiplier(b.level,targetLevel,pvp);
 const incoming=Math.max(-50,getRateAbility(targetAbilities,'incomingdamage')),reduction=pvp?Math.min(50,b.opponentBuild?getRateAbility(targetAbilities,'pvpdamagereduction'):t.pvpReduction??0):0;
 const mode=modeDamageMultiplier({pvp,pve:s.pve,pvpDamage:s.pvp,boss:s.boss,rank:t.rank,reduction,incoming,level:levelMultiplier});
 const skillFactor=skill?1+mainHandSkillBonus(b,skill,d)/100:1,damageBonus=skill?1:1+getRateAbility(a,'autoattackdamage')/100;
 const attackRate=getRateAbility(a,'attack'),skillRate=skill?getRateAbility(a,'skilldamage'):0,thirdJobRate=skill&&d.class.find(x=>x.id===skill.class)?.type==='specialist'?getRateAbility(a,'thirdjobskilldamage'):0;
 const magicDefenseRate=skill?.magic?getRateAbility(targetAbilities,'magicdefense'):0;
 let main={min:s.rightAttack.rawMin,max:s.rightAttack.rawMax},notes:string[]=[];
 const weapon=s.weapon,g=b.equipment.rightHand,upgrade=weapon&&g?getConfiguredUpgrade(weapon,g):0,effectiveUpgrade=g?.ultimateWeapon||weapon?.rarity==='ultimate'?upgrade+10:upgrade,up=d.upgradelevelbonus.find(x=>x.upgradeLevel===effectiveUpgrade),weaponRange=upgradedSkillWeapon((weapon?.minAttack??1)+getFlatAbility(a,'minability'),(weapon?.maxAttack??2)+getFlatAbility(a,'maxability'),1+(up?.weaponAttack??0)/100,effectiveUpgrade);
 if(skill&&sl){const power=calculateSkillPower({weapon:weaponRange,additionalSkillDamage:Number(weapon?.additionalSkillDamage??0),skill,level:sl,selectedLevel:sl.level,stats:s,abilities:a,family:weapon?.subcategory??'hand',build:b,data:d});main=power;notes=power.notes;}
 else if(wand){const c=d.class.find(x=>x.id===b.classId)!;const extra=weaponStatContribution('wand',s,b.level,c.autoAttackFactors.wand,getFlatAbility(a,'wandattack'))+getFlatAbility(a,'damage');main={min:(weaponRange.min+extra)*.6,max:(weaponRange.max+extra)*.6};notes.push('Normal uncharged wand attacks; charging remains unsupported.');}
 const modifier=mode*skillFactor*damageBonus;
 const stages=(power:number,element:number,hand:Gear|undefined)=>{
  // Generic autos apply upgrade element power before Attack rates; resistance is post-defense.
  const autoFactors=autoElementFactors(b,t,d,hand),preElement=!skill&&!wand?autoFactors.attack:1;
  const modified=modifyAttack(!skill&&!wand?Math.floor(power*preElement):power,attackRate,getFlatAbility(a,'attack'),skillRate,thirdJobRate,pvp?0:getFlatAbility(a,'pvedamage'));
  const incomingMagic=modified.attack*(1-magicDefenseRate/100);
  const effectiveDefense=!skill&&!wand?Math.floor(defense*autoFactors.defense):defense;
  const postDefense=Math.max(0,postDefenseDamage(incomingMagic,effectiveDefense));
  const meleeElement=(!skill?.magic&&(skill||wand)&&postDefense>0&&hand?.element!=='none')?Math.floor(((hand?.elementUpgrade??0)*4+getFlatAbility(a,'elementattack'))*(1-resistance(hand?.element??'none'))):0;
  const resistFactor=skill?(effectiveElement==='none'?1:Math.max(0,1-resistance(effectiveElement))):Math.max(0,1-resistance(hand?.element??'none'));
  const afterResistance=Math.floor((postDefense+meleeElement)*resistFactor);
  const match=skill&&resistFactor?element/resistFactor:1;
  const afterElement=Math.floor(afterResistance*match);
  return {...modified,preElement,effectiveDefense,incomingMagic,postDefense,meleeElement,afterElement,damage:skillUsable?afterElement:0};
 };
 const rightMin=stages(main.min,el,g),rightMax=stages(main.max,el,g);
 const handFactor=(pvp?.6:1)*skillFactor*damageBonus*levelMultiplier,modeRate=pvp?s.pvp:s.pve,bossRate=!pvp&&['giant','boss','worldboss'].includes(t.rank)?s.boss:0;
 const finish=(value:number)=>finalizeDamage(value,modeRate,incoming,bossRate,reduction).final;
 const rightNormalMin=Math.floor(rightMin.damage*handFactor),rightNormalMax=Math.floor(rightMax.damage*handFactor),leftElement=elementMultiplier(b,t,d,b.equipment.leftHand),leftFactor=offhandMultiplier(getRateAbility(a,'lefthanddamage')),leftNormalMin=s.leftAttack?Math.floor(stages(s.leftAttack.rawMin,leftElement,b.equipment.leftHand).damage*handFactor*leftFactor):0,leftNormalMax=s.leftAttack?Math.floor(stages(s.leftAttack.rawMax,leftElement,b.equipment.leftHand).damage*handFactor*leftFactor):0;
 const cycle=attackCycle(!skill&&!!s.leftAttack),averageCycle=(right:number,left:number)=>cycle.reduce((n,x)=>n+finish(cycleDamage(x,right,left)),0)/cycle.length,normalMin=averageCycle(rightNormalMin,leftNormalMin),normalMax=averageCycle(rightNormalMax,leftNormalMax),normal=(normalMin+normalMax)/2;
 const criticalRange=criticalMultiplierRange({attackerLevel:b.level,defenderLevel:targetLevel,attackerPlayer:true,defenderPlayer:pvp,bonus:getRateAbility(a,'criticaldamage'),pvpBonus:pvp?getRateAbility(a,'pvpcriticaldamage'):0,wand});
 const rightCriticalMin=Math.floor(rightMin.damage*criticalRange.min*handFactor),rightCriticalMax=Math.floor(rightMax.damage*criticalRange.max*handFactor),leftCriticalMin=s.leftAttack?Math.floor(stages(s.leftAttack.rawMin,leftElement,b.equipment.leftHand).damage*criticalRange.min*handFactor*leftFactor):0,leftCriticalMax=s.leftAttack?Math.floor(stages(s.leftAttack.rawMax,leftElement,b.equipment.leftHand).damage*criticalRange.max*handFactor*leftFactor):0;
 const criticalMin=averageCycle(rightCriticalMin,leftCriticalMin),criticalMax=averageCycle(rightCriticalMax,leftCriticalMax),critical=(criticalMin+criticalMax)/2;
 const cycleRanges=cycle.map(event=>({normalMin:finish(cycleDamage(event,rightNormalMin,leftNormalMin)),normalMax:finish(cycleDamage(event,rightNormalMax,leftNormalMax)),criticalMin:finish(cycleDamage(event,rightCriticalMin,leftCriticalMin)),criticalMax:finish(cycleDamage(event,rightCriticalMax,leftCriticalMax))}));
 const hit=skill||wand?1:contextHitChance({context:pvp?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:targetLevel,rating:s.dex,parry:t.parry,bonus:getRateAbility(a,'hitrate')}).probability,crit=skill?0:effectiveCriticalChance(s.crit,t.criticalResist??0,pvp?getRateAbility(a,'pvpcriticalchance'):0);
 const ob=b.opponentBuild,oa=ob?abilities(ob,d):[],oc=ob?d.class.find(x=>x.id===ob.classId):undefined;
 const blockContext={defenderPlayer:pvp,defenderLevel:targetLevel,attackerLevel:b.level,defenderDex:t.dex,attackerDex:s.dex,classFactor:oc?.block??0,generic:ob?getRateAbility(oa,'block'):t.block??0,melee:ob?getRateAbility(oa,'meleeblock')-getRateAbility(oa,'block'):0,ranged:ob?getRateAbility(oa,'rangedblock')-getRateAbility(oa,'block'):0,pvpBlock:ob?getRateAbility(oa,'pvpblock'):0,penetration:s.blockPen,pvpPenetration:s.pvpBlockPen,pvp,attackerRank:'player',rangedAttack:['bow','yoyo','wand'].includes(weapon?.subcategory??''),parry:t.parry};
 const blockResult=effectiveBlock(blockContext),block=skill||wand?0:blockResult.probability,blockedMultiplier=blockResult.damageMultiplier,expected=expectedDamage(normal,critical,hit,crit,block,blockedMultiplier),connected=hit?expected/hit:0;
 const interval=skill?Math.max(.25,Number(pvp?sl?.cooldownPVP??sl?.cooldown??0:sl?.cooldown??0),Number(sl?.casting??0)*(1-clamp(percent(0,'decreasedcastingtime',a),0,90)/100)):1/s.internalAttackSpeed,sustained=expected/interval,dpsFor=(duration:number)=>Math.floor(duration/interval)*expected/duration;
 return {skillUsable,skillStatus:skillUsable?'usable':'unusable',stats:s,target:t,effectiveElement,rightNormalMin,rightNormalMax,leftNormalMin,leftNormalMax,leftFraction:0,cycle,cycleRanges,normalMin,normalMax,normal,criticalMin,criticalMax,critical,criticalRange,connected,expected,hit,miss:1-hit,crit,rawCriticalChance:s.crit/100,block,effectiveMeleeBlock:skill||wand?0:effectiveBlock({...blockContext,rangedAttack:false}).probability,effectiveRangedBlock:skill||wand?0:effectiveBlock({...blockContext,rangedAttack:true}).probability,blockedMultiplier,element:el,modifier,defense,interval,dps:sustained,burst:dpsFor(5),dpsFor,ttk:sustained>0?t.hp/sustained:Infinity,notes,calculationStages:{weaponMin:weaponRange.min,weaponMax:weaponRange.max,basePowerMin:main.min,basePowerMax:main.max,attackRate,skillRate,thirdJobRate,combinedAttackRate:rightMin.combinedRate,ratedAttackMin:rightMin.rated,flatAttack:rightMin.flatAttack,pveFlat:rightMin.pveFlat,attackBeforeDefense:rightMin.attack,magicDefenseRate,incomingMagicAttack:rightMin.incomingMagic,defense,effectiveDefenseMin:rightMin.effectiveDefense,postDefenseMin:rightMin.postDefense,postDefenseMax:rightMax.postDefense,meleeElement:rightMin.meleeElement,afterElement:rightMin.afterElement,levelMultiplier,mode,modeRate,skillFactor,damageBonus,element:el,autoElementPower:rightMin.preElement,offhand:leftFactor,incomingRate:incoming,bossRate,reductionRate:reduction,handFactor,afterMode:finalizeDamage(rightNormalMin,modeRate,incoming,bossRate,reduction).afterMode,afterIncoming:finalizeDamage(rightNormalMin,modeRate,incoming,bossRate,reduction).afterIncoming,afterBoss:finalizeDamage(rightNormalMin,modeRate,incoming,bossRate,reduction).afterBoss,finalExpected:expected},probabilities:{miss:1-hit,normal:hit*(1-crit)*(1-block),critical:hit*crit*(1-block),blocked:hit*(1-crit)*block,blockedCritical:hit*crit*block}};
}
export type Combat=ReturnType<typeof calculate>;
