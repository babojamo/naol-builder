import {canActivateSelfBuff,getActiveSelfBuffForFamily} from '../../lib/skill-usage';
import {catalogSkill} from '../../lib/catalog-index';
import type {CharacterBuild,GameData} from '../../lib/model';

/** Barrage's API description specifies double arrows. No recursive proc or generic multistrike behavior is inferred. */
export function barrageExtraAttackChance(build:CharacterBuild,data:GameData,weaponFamily:string){
 if(build.attackType!=='auto'||weaponFamily!=='bow')return 0;
 const selection=getActiveSelfBuffForFamily(build,data,24775);
 const skill=catalogSkill(data,selection?.id);
 if(!selection||!skill||!canActivateSelfBuff(skill,build,data))return 0;
 const parameter=build.mode==='pvp'?'pvpmultistrike':'pvemultistrike';
 const abilities=skill.levels.find(row=>row.level===selection.level)?.abilities??[];
 const chance=abilities.filter(row=>row.parameter===parameter&&row.rate).reduce((sum,row)=>sum+(row.add??0),0)/100;
 return Math.min(1,Math.max(0,chance));
}
