import {bossMonsterRanks} from '../../lib/monster-selection';
const levelPenalties=[1,1,.98,.95,.91,.87,.81,.75,.67,.59,.51,.42,.32,.22,.12,.01];
export function getLevelDifferenceDamageMultiplier(attackerLevel:number,defenderLevel:number,pvp=false){return pvp?1:levelPenalties[Math.min(15,Math.max(0,Math.floor(defenderLevel-attackerLevel)))];}
export function modeDamageMultiplier(input:{pvp:boolean;pve:number;pvpDamage:number;boss:number;rank:string;reduction:number;incoming:number;level:number}){return (input.pvp?.6:1)*(1+(input.pvp?input.pvpDamage:input.pve)/100)*(input.pvp?1:1+(bossMonsterRanks.has(input.rank)?input.boss:0)/100)*Math.max(0,1-input.reduction/100)*(1+input.incoming/100)*input.level;}
