import {catalogItem,catalogSkill} from '../../lib/catalog-index';
import type {Ability,CharacterBuild,GameData,Skill,SkillLevel,Stats} from '../../lib/model';
import {getFlatAbility,getRateAbility} from '../../lib/stat-parameters';
export function upgradedSkillWeapon(min:number,max:number,factor:number,level:number){const extra=Math.floor(level**1.5);return {min:Math.floor(min*factor)+extra,max:Math.floor(max*factor)+extra};}
export type SkillScale={stat?:string;parameter:string;scale:number;add:boolean;maximum?:number;part?:string;pvp?:boolean;pve?:boolean};
export function scaleSkillStat(scale:number,value:number,levelIndex:number){const adjusted=Math.floor((scale*50-levelIndex)/5)/10;return Math.floor(adjusted*value+levelIndex*value/50);}
export function skillScalingValue(scale:SkillScale,stats:Stats,build:CharacterBuild,data:GameData,abilities:Ability[]){let value=0;if(scale.stat){value=scale.stat in stats?stats[scale.stat as keyof Stats]:getRateAbility(abilities,scale.stat);}else if(scale.part){const slot=scale.part==='righthandweapon'?'rightHand':scale.part==='shield'?'shield':scale.part==='lefthandweapon'?'leftHand':null,gear=slot?build.equipment[slot]:null,item=catalogItem(data,gear?.itemId);if(item)value=item.category==='weapon'?((item.minAttack??0)+(item.maxAttack??0))/2:((item.minDefense??0)+(item.maxDefense??0))/2;}return Math.min(scale.maximum??Infinity,value);}
export function calculateSkillPower(input:{weapon:{min:number;max:number};additionalSkillDamage:number;skill:Skill;level:SkillLevel;selectedLevel:number;stats:Stats;abilities:Ability[];family:string;build:CharacterBuild;data:GameData}){
 const {skill,level,build}=input;let index=input.selectedLevel-1;const parent=catalogSkill(input.data,skill.inheritSkill);if(parent?.masterVariations?.includes(skill.id))index=parent.levels.length-1;
 const scaling=(level.scalingParameters??[]) as SkillScale[],active=scaling.filter(x=>x.parameter==='attack'&&(build.mode==='pvp'?x.pvp!==false:x.pve!==false));
 const stat=active.filter(x=>x.add).reduce((n,x)=>n+scaleSkillStat(x.scale,skillScalingValue(x,input.stats,build,input.data,input.abilities),index),0),flat=getFlatAbility(input.abilities,'damage')+getFlatAbility(input.abilities,input.family+'attack');
 const power=(weapon:number,base:number)=>(weapon+(base+input.additionalSkillDamage)*5+stat-20)*(16+index)/13+flat;
 let min=power(input.weapon.min,level.minAttack??0),max=power(input.weapon.max,level.maxAttack??0);
 const synergies=(level.synergies??[]) as {parameter:string;skill:number;minLevel:number;add:boolean;scale:number;pvp?:boolean;pve?:boolean}[];
 for(const x of synergies){if(x.parameter!=='attack'||(build.mode==='pvp'?x.pvp===false:x.pve===false))continue;const selected=build.skills.find(s=>s.id===x.skill);if(selected&&selected.level>x.minLevel){const amount=(selected.level-x.minLevel)*x.scale/100;if(x.add){min+=amount;max+=amount;}else{min*=1+amount;max*=1+amount;}}}
 if(skill.magic){const magic=1+getRateAbility(input.abilities,'magicattack')/100;let type=String(skill.elementType??skill.element??'none');if(build.buffs.some(x=>x.id===12579)||build.support.buffSkills.some(x=>x.id===12579)){const weapon=build.equipment.rightHand;if(weapon&&weapon.element!=='none')type=weapon.element;}const mastery=['fire','water','wind','electricity','earth'].filter(x=>type.includes(x)).reduce((n,x)=>n+getRateAbility(input.abilities,x+'mastery'),0);min*=magic*(1+mastery/100);max*=magic*(1+mastery/100);}
 return {min,max,average:(min+max)/2,notes:active.some(x=>!x.add)?['Multiplicative skill-stat scaling is unsupported.']:[]};
}
