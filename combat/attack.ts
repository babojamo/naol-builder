import {buildSkillWeaponContext,resolveSkillWeaponRequirement} from '../lib/skill-weapons';
import {lineage} from '../lib/model';
import {resolveWeaponElement} from '../lib/element-stats';
import {catalogItem,catalogSkill} from '../lib/catalog-index';
import {isWeaponCompatibleWithSkills,getWeaponAttackUpgrade} from '../lib/item-rules';
import {abilities,percent,clamp,derive,type Derived} from './character';
import {mainHandSkillBonus} from '../lib/skill-awake';
import {
  getWeaponConditionalRate,
  getWeaponEffectInspectorRows,
  resolveWeaponEffects,
} from '../lib/weapon-effects';
import {getFlatAbility,getRateAbility} from '../lib/stat-parameters';
import {postDefenseDamage} from './formulas/attack-defense';
import {contextHitChance} from './formulas/hit';
import {criticalMultiplierRange,effectiveCriticalChance} from './formulas/critical';
import {effectiveBlock} from './formulas/block';
import {elementFactors,skillElementMultiplier,resolveEffectiveSkillElement,elementResistanceToMultiplier,resistancePercentToFraction,skillWeaponMatchCoefficient} from './formulas/elements';
import {modifyAttack} from './formulas/attack-modifiers';
import {finalizeDamage} from './formulas/damage-stages';
import {attackCycle,cycleDamage,offhandMultiplier} from './formulas/dual-wield';
import {getLevelDifferenceDamageMultiplier,modeDamageMultiplier} from './formulas/mode-modifiers';
import {effectivePlayerDefense,effectiveMonsterDefense} from './formulas/defense';
import {upgradedSkillWeapon,calculateSkillPower} from './formulas/skill-power';
import {weaponStatContribution} from './formulas/weapon-attack';
import type {CharacterBuild,Element,GameData,Target,Gear} from '../lib/model';
export const elements:Element[]=['none','fire','water','electricity','earth','wind'];
function autoElementFactors(b:CharacterBuild,t:Target,d:GameData,g:Gear|undefined){const element=resolveWeaponElement(catalogItem(d,g?.itemId),g),suit=b.opponentBuild?.equipment.suit,defenderElement=b.mode==='pvp'?(b.opponentBuild?suit?.element??'none':t.element):t.element,defenderUpgrade=b.mode==='pvp'?(suit?.elementUpgrade??0):1;if(element==='none'&&defenderElement==='none')return {relation:'none' as const,attack:1,defense:1};return elementFactors(element,defenderElement,g?.element&&g.element!=='none'?(g.elementUpgrade??0)+getFlatAbility(abilities(b,d),'elementattack'):0,defenderUpgrade,d.upgradelevelbonus);}
export function elementMultiplier(b:CharacterBuild,t:Target,d:GameData,hand?:Gear){const g=hand??b.equipment.rightHand;if(!g)return 1;const offensiveElement=resolveWeaponElement(catalogItem(d,g.itemId),g);const factors=autoElementFactors(b,t,d,g),resistance=Number(t[('resist'+offensiveElement[0].toUpperCase()+offensiveElement.slice(1)) as keyof Target]??0);return factors.attack*elementResistanceToMultiplier(resistance);}
export function hitProbability(s:Derived,b:CharacterBuild,t:Target){return contextHitChance({context:b.mode==='pvp'?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:t.level===-1?b.level:t.level,rating:s.dex,parry:t.parry,bonus:Math.max(0,s.hitRate-b.level-s.dex)}).probability;}
export function expectedDamage(normal:number,critical:number,hit:number,crit:number,block:number,blockedMultiplier:number){return hit*((1-crit)*normal+crit*critical)*((1-block)+block*blockedMultiplier);}
export function opponentTarget(b:CharacterBuild,d:GameData):Target{if(!b.opponentBuild)return b.opponent;const o=b.opponentBuild,s=derive(o,d);return {...b.opponent,name:o.name,level:o.level,hp:s.hp,defense:s.defense,magicDefense:s.magicDefense,dex:s.dex,parry:s.parry,block:s.block,criticalResist:s.critResist,pvpReduction:s.pvpReduction,minAttack:s.attackMin,maxAttack:s.attackMax,...Object.fromEntries(['fire','water','wind','electricity','earth'].map(element=>['resist'+element[0].toUpperCase()+element.slice(1),resistancePercentToFraction(s.values[element+'Resistance']??0)]))};}
export function calculate(b:CharacterBuild,d:GameData,override?:Target){
 const s=derive(b,d),a=abilities(b,d),t=override??(b.mode==='pvp'?opponentTarget(b,d):d.monster.find(x=>x.id===b.targetId)??d.monster[0]),pvp=b.mode==='pvp',targetLevel=t.level===-1?b.level:t.level;
 const targetHealthPercent=clamp(b.targetHealthPercent??100,0,100);
 const weaponEffects=[
  ...resolveWeaponEffects(b,d,'rightHand'),
  ...resolveWeaponEffects(b,d,'leftHand'),
 ];
 const weaponInspector=[
  ...getWeaponEffectInspectorRows(b,d,'rightHand'),
  ...getWeaponEffectInspectorRows(b,d,'leftHand'),
 ];
 // Reference-backed hand policy: Flyffulator's Entity.getStat() aggregates
 // equipped item abilities across both weapon slots, so Muran/Ankou values
 // from right + left weapons stack until stronger game evidence says otherwise.
 const muransWrathRate=getWeaponConditionalRate(b,d,'muranswrath');
 const ankousHarvestRate=getWeaponConditionalRate(b,d,'ankousharvest');
 const healthConditional={targetHealthPercent,muransWrathRate,ankousHarvestRate,pvp};
 const chosen=b.skills.find(x=>!catalogSkill(d,x.id)?.passive),skill=b.attackType==='skill'?catalogSkill(d,chosen?.id):undefined,sl=skill?.levels.find(x=>x.level===chosen?.level),skillUsable=!skill||!!sl&&(!skill.class||lineage(b.classId,d).includes(skill.class))&&skill.level<=b.level&&isWeaponCompatibleWithSkills(s.weapon,[skill],buildSkillWeaponContext(b,d)),wand=!skill&&s.weapon?.subcategory==='wand',magical=!!skill?.magic||wand;
 const targetAbilities=b.opponentBuild?abilities(b.opponentBuild,d):[];
 let defense=skill?.magic?Math.max(0,t.magicDefense??0):effectiveMonsterDefense(magical?t.magicDefense??t.defense:t.defense,!!skill||wand);
 if(pvp){if(b.opponentBuild){const ob=b.opponentBuild,os=derive(ob,d),oc=d.class.find(x=>x.id===ob.classId)!,oa=targetAbilities;defense=effectivePlayerDefense({level:ob.level,sta:os.sta,dex:os.dex,int:os.int,classDefense:oc.defense,magicSta:oc.magicDefenseStaFactor,magicInt:oc.magicDefenseIntFactor,equipment:os.armorDefense,flat:getFlatAbility(oa,magical?'magicdefense':'def'),rate:getRateAbility(oa,'def'),magic:magical,skill:!!skill,pvp});}else defense=Math.floor((magical?t.magicDefense??t.defense:t.defense)*.6);}
 const weaponElement=resolveWeaponElement(s.weapon,b.equipment.rightHand),infusion=b.buffs.some(x=>x.id===12579)||b.support.buffSkills.some(x=>x.id===12579),effectiveElement=skill?resolveEffectiveSkillElement(skill.element??'none',weaponElement,infusion):weaponElement;
 const resistance=(element:Element)=>Number(t[('resist'+element[0].toUpperCase()+element.slice(1)) as keyof Target]??0);
 const el=skill?skillElementMultiplier(effectiveElement,weaponElement,resistance(effectiveElement),false):elementMultiplier(b,t,d),levelMultiplier=getLevelDifferenceDamageMultiplier(b.level,targetLevel,pvp);
 const incoming=Math.max(-50,getRateAbility(targetAbilities,'incomingdamage')),reduction=pvp?Math.min(50,b.opponentBuild?getRateAbility(targetAbilities,'pvpdamagereduction'):t.pvpReduction??0):0;
 const mode=modeDamageMultiplier({pvp,pve:s.pve,pvpDamage:s.pvp,boss:s.boss,rank:t.rank,reduction,incoming,level:levelMultiplier});
 const skillFactor=skill?1+mainHandSkillBonus(b,skill,d)/100:1,damageBonus=skill?1:1+getRateAbility(a,'autoattackdamage')/100;
 const attackRate=getRateAbility(a,'attack'),skillRate=skill?getRateAbility(a,'skilldamage'):0,thirdJobRate=skill&&d.class.find(x=>x.id===skill.class)?.type==='specialist'?getRateAbility(a,'thirdjobskilldamage'):0;
 const magicDefenseRate=skill?.magic?getRateAbility(targetAbilities,'magicdefense'):0;
 let main={min:s.rightAttack.rawMin,max:s.rightAttack.rawMax},notes:string[]=[];
 const weapon=s.weapon,g=b.equipment.rightHand,attackUpgrade=getWeaponAttackUpgrade(weapon,g,d),effectiveUpgrade=attackUpgrade.upgradeLevel,up=attackUpgrade.row,weaponRange=upgradedSkillWeapon((weapon?.minAttack??1)+getFlatAbility(a,'minability'),(weapon?.maxAttack??2)+getFlatAbility(a,'maxability'),1+(up?.weaponAttack??0)/100,effectiveUpgrade);
 if(skill&&sl){const power=calculateSkillPower({weapon:weaponRange,additionalSkillDamage:Number(weapon?.additionalSkillDamage??0),skill,level:sl,selectedLevel:sl.level,stats:s,abilities:a,family:weapon?.subcategory??'hand',build:b,data:d});main=power;notes=power.notes;}
 else if(wand){const c=d.class.find(x=>x.id===b.classId)!;const extra=weaponStatContribution('wand',s,b.level,c.autoAttackFactors.wand,getFlatAbility(a,'wandattack'))+getFlatAbility(a,'damage');main={min:(weaponRange.min+extra)*.6,max:(weaponRange.max+extra)*.6};notes.push('Normal uncharged wand attacks; charging remains unsupported.');}
 const modifier=mode*skillFactor*damageBonus;
 const stages=(power:number,_element:number,hand:Gear|undefined)=>{
  // Generic autos apply upgrade element power before Attack rates; resistance is post-defense.
  const handElement=resolveWeaponElement(catalogItem(d,hand?.itemId),hand),autoFactors=autoElementFactors(b,t,d,hand),preElement=!skill&&!wand?autoFactors.attack:1;
  const modified=modifyAttack(!skill&&!wand?Math.floor(power*preElement):power,attackRate,getFlatAbility(a,'attack'),skillRate,thirdJobRate,pvp?0:getFlatAbility(a,'pvedamage'));
  const incomingMagic=modified.attack*(1-magicDefenseRate/100);
  const effectiveDefense=!skill&&!wand?Math.floor(defense*autoFactors.defense):defense;
  const postDefense=Math.max(0,postDefenseDamage(incomingMagic,effectiveDefense));
  const meleePower=hand?.element&&hand.element!=='none'?(hand.elementUpgrade??0)*4+getFlatAbility(a,'elementattack'):Number(catalogItem(d,hand?.itemId)?.elementAttack??0);
  const meleeElement=(!skill?.magic&&(skill||wand)&&postDefense>0&&handElement!=='none')?Math.floor(meleePower*elementResistanceToMultiplier(resistance(handElement))):0;
  const resistFactor=skill?(effectiveElement==='none'?1:elementResistanceToMultiplier(resistance(effectiveElement))):elementResistanceToMultiplier(resistance(handElement));
  const afterResistance=Math.floor((postDefense+meleeElement)*resistFactor);
  const match=skill?skillWeaponMatchCoefficient(effectiveElement,weaponElement):1;
  const afterElement=Math.floor(afterResistance*match);
  return {...modified,elementRelation:autoFactors.relation,resistance:skill?resistance(effectiveElement):resistance(handElement),resistanceMultiplier:resistFactor,weaponSkillMatchCoefficient:match,afterResistance,elementDefenseCoefficient:autoFactors.defense,preElement,effectiveDefense,incomingMagic,postDefense,meleeElement,afterElement,damage:skillUsable?afterElement:0};
 };
 if(skill&&resolveSkillWeaponRequirement(skill.weapon).status==='unsupported')notes.push('Unrecognized skill weapon requirement; check Data Health.');
 const rightMin=stages(main.min,el,g),rightMax=stages(main.max,el,g);
 const handFactor=(pvp?.6:1)*skillFactor*damageBonus*levelMultiplier,modeRate=pvp?s.pvp:s.pve,bossRate=!pvp&&['giant','boss','worldboss'].includes(t.rank)?s.boss:0;
 const finishSnapshot=(value:number)=>finalizeDamage(value,modeRate,incoming,bossRate,reduction,healthConditional).final;
 // HP thresholds affect snapshots; sustained DPS excludes them until HP progression is simulated.
 const finishSustained=(value:number)=>finalizeDamage(value,modeRate,incoming,bossRate,reduction).final;
 const rightNormalMin=Math.floor(rightMin.damage*handFactor),rightNormalMax=Math.floor(rightMax.damage*handFactor),leftElement=elementMultiplier(b,t,d,b.equipment.leftHand),leftFactor=offhandMultiplier(getRateAbility(a,'lefthanddamage')),leftNormalMin=s.leftAttack?Math.floor(stages(s.leftAttack.rawMin,leftElement,b.equipment.leftHand).damage*handFactor*leftFactor):0,leftNormalMax=s.leftAttack?Math.floor(stages(s.leftAttack.rawMax,leftElement,b.equipment.leftHand).damage*handFactor*leftFactor):0;
 const cycle=attackCycle(!skill&&!!s.leftAttack),averageCycle=(right:number,left:number,finisher:(value:number)=>number)=>cycle.reduce((n,x)=>n+finisher(cycleDamage(x,right,left)),0)/cycle.length,normalMin=averageCycle(rightNormalMin,leftNormalMin,finishSnapshot),normalMax=averageCycle(rightNormalMax,leftNormalMax,finishSnapshot),normal=(normalMin+normalMax)/2;
 const criticalRange=criticalMultiplierRange({attackerLevel:b.level,defenderLevel:targetLevel,attackerPlayer:true,defenderPlayer:pvp,bonus:getRateAbility(a,'criticaldamage'),pvpBonus:pvp?getRateAbility(a,'pvpcriticaldamage'):0,wand});
 const rightCriticalMin=Math.floor(rightMin.damage*criticalRange.min*handFactor),rightCriticalMax=Math.floor(rightMax.damage*criticalRange.max*handFactor),leftCriticalMin=s.leftAttack?Math.floor(stages(s.leftAttack.rawMin,leftElement,b.equipment.leftHand).damage*criticalRange.min*handFactor*leftFactor):0,leftCriticalMax=s.leftAttack?Math.floor(stages(s.leftAttack.rawMax,leftElement,b.equipment.leftHand).damage*criticalRange.max*handFactor*leftFactor):0;
 const criticalMin=averageCycle(rightCriticalMin,leftCriticalMin,finishSnapshot),criticalMax=averageCycle(rightCriticalMax,leftCriticalMax,finishSnapshot),critical=(criticalMin+criticalMax)/2;
 const sustainedNormalMin=averageCycle(rightNormalMin,leftNormalMin,finishSustained),sustainedNormalMax=averageCycle(rightNormalMax,leftNormalMax,finishSustained),sustainedNormal=(sustainedNormalMin+sustainedNormalMax)/2;
 const sustainedCriticalMin=averageCycle(rightCriticalMin,leftCriticalMin,finishSustained),sustainedCriticalMax=averageCycle(rightCriticalMax,leftCriticalMax,finishSustained),sustainedCritical=(sustainedCriticalMin+sustainedCriticalMax)/2;
 const cycleRanges=cycle.map(event=>({normalMin:finishSnapshot(cycleDamage(event,rightNormalMin,leftNormalMin)),normalMax:finishSnapshot(cycleDamage(event,rightNormalMax,leftNormalMax)),criticalMin:finishSnapshot(cycleDamage(event,rightCriticalMin,leftCriticalMin)),criticalMax:finishSnapshot(cycleDamage(event,rightCriticalMax,leftCriticalMax))}));
 const hit=skill||wand?1:contextHitChance({context:pvp?'player-player':'player-monster',attackerLevel:b.level,defenderLevel:targetLevel,rating:s.dex,parry:t.parry,bonus:getRateAbility(a,'hitrate')}).probability,crit=skill?0:effectiveCriticalChance(s.crit,t.criticalResist??0,pvp?getRateAbility(a,'pvpcriticalchance'):0);
 const ob=b.opponentBuild,oa=ob?abilities(ob,d):[],oc=ob?d.class.find(x=>x.id===ob.classId):undefined;
 const blockContext={defenderPlayer:pvp,defenderLevel:targetLevel,attackerLevel:b.level,defenderDex:t.dex,attackerDex:s.dex,classFactor:oc?.block??0,generic:ob?getRateAbility(oa,'block'):t.block??0,melee:ob?getRateAbility(oa,'meleeblock')-getRateAbility(oa,'block'):0,ranged:ob?getRateAbility(oa,'rangedblock')-getRateAbility(oa,'block'):0,pvpBlock:ob?getRateAbility(oa,'pvpblock'):0,penetration:s.blockPen,pvpPenetration:s.pvpBlockPen,pvp,attackerRank:'player',rangedAttack:['bow','yoyo','wand'].includes(weapon?.subcategory??''),parry:t.parry};
 const blockResult=effectiveBlock(blockContext),block=skill||wand?0:blockResult.probability,blockedMultiplier=blockResult.damageMultiplier,expected=expectedDamage(normal,critical,hit,crit,block,blockedMultiplier),connected=hit?expected/hit:0;
 const sustainedExpected=expectedDamage(sustainedNormal,sustainedCritical,hit,crit,block,blockedMultiplier);
 const interval=skill?Math.max(.25,Number(pvp?sl?.cooldownPVP??sl?.cooldown??0:sl?.cooldown??0),Number(sl?.casting??0)*(1-clamp(percent(0,'decreasedcastingtime',a),0,90)/100)):1/s.internalAttackSpeed,sustained=sustainedExpected/interval,dpsFor=(duration:number)=>Math.floor(duration/interval)*sustainedExpected/duration;
 const damageStageDebug=finalizeDamage(rightNormalMin,modeRate,incoming,bossRate,reduction,healthConditional);
 return {openingExpected:expected,sustainedExpected,weaponEffects,weaponInspector,skillUsable,skillStatus:skillUsable?'usable':'unusable',stats:s,target:t,effectiveElement,rightNormalMin,rightNormalMax,leftNormalMin,leftNormalMax,leftFraction:0,cycle,cycleRanges,normalMin,normalMax,normal,criticalMin,criticalMax,critical,criticalRange,connected,expected,hit,miss:1-hit,crit,rawCriticalChance:s.crit/100,block,effectiveMeleeBlock:skill||wand?0:effectiveBlock({...blockContext,rangedAttack:false}).probability,effectiveRangedBlock:skill||wand?0:effectiveBlock({...blockContext,rangedAttack:true}).probability,blockedMultiplier,element:el,modifier,defense,interval,dps:sustained,burst:dpsFor(5),dpsFor,ttk:sustained>0?t.hp/sustained:Infinity,notes,calculationStages:{targetHealthPercent,muranWrathRaw:muransWrathRate,muranWrathEffective:damageStageDebug.muransWrathRate,ankousHarvestRaw:ankousHarvestRate,ankousHarvestEffective:damageStageDebug.ankousHarvestRate,afterHealthConditional:damageStageDebug.afterHealthConditional,weaponElement,weaponElementUpgrade:g?.element!=='none'?g?.elementUpgrade??0:0,elementAttack:getFlatAbility(a,'elementattack'),elementRelation:skill?elementFactors(effectiveElement,weaponElement,0,0,d.upgradelevelbonus).relation:rightMin.elementRelation,elementCoefficient:el,suitElement:b.opponentBuild?.equipment.suit?.element??'none',suitElementUpgrade:b.opponentBuild?.equipment.suit?.elementUpgrade??0,suitDefenseApplied:!skill&&!wand?'auto relationship':'not applied by skill reference',elementDefenseCoefficient:!skill&&!wand?rightMin.elementDefenseCoefficient:1,targetResistance:rightMin.resistance,resistanceMultiplier:rightMin.resistanceMultiplier,afterResistance:rightMin.afterResistance,weaponSkillMatchCoefficient:rightMin.weaponSkillMatchCoefficient,weaponMin:weaponRange.min,weaponMax:weaponRange.max,basePowerMin:main.min,basePowerMax:main.max,attackRate,skillRate,thirdJobRate,combinedAttackRate:rightMin.combinedRate,ratedAttackMin:rightMin.rated,flatAttack:rightMin.flatAttack,pveFlat:rightMin.pveFlat,attackBeforeDefense:rightMin.attack,magicDefenseRate,incomingMagicAttack:rightMin.incomingMagic,defense,effectiveDefenseMin:rightMin.effectiveDefense,postDefenseMin:rightMin.postDefense,postDefenseMax:rightMax.postDefense,meleeElement:rightMin.meleeElement,afterElement:rightMin.afterElement,levelMultiplier,mode,modeRate,skillFactor,damageBonus,element:el,autoElementPower:rightMin.preElement,offhand:leftFactor,incomingRate:incoming,bossRate,reductionRate:reduction,handFactor,afterMode:damageStageDebug.afterMode,afterIncoming:damageStageDebug.afterIncoming,afterBoss:damageStageDebug.afterBoss,finalExpected:expected},probabilities:{miss:1-hit,normal:hit*(1-crit)*(1-block),critical:hit*crit*(1-block),blocked:hit*(1-crit)*block,blockedCritical:hit*crit*block}};
}
export type Combat=ReturnType<typeof calculate>;
