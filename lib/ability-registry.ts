import parameters from '../data/ability-parameters.json';import type {Ability} from './model';
export const officialAbilityParameters=new Set(parameters);
export type AbilityTotal={parameter:string;flat:number;rate:number;set?:number;official:boolean};
export function abilityTotals(abilities:Ability[]):AbilityTotal[]{const map=new Map<string,AbilityTotal>();for(const a of abilities){const t=map.get(a.parameter)??{parameter:a.parameter,flat:0,rate:0,official:officialAbilityParameters.has(a.parameter)};if(a.rate)t.rate+=a.add??0;else t.flat+=a.add??0;if(a.set!==undefined)t.set=a.set;map.set(a.parameter,t);}return [...map.values()];}
// Family discovery over the current API parameter vocabulary. Unrecognized
// abilities remain available to the inspector instead of being discarded.
export function isSupportAbility(parameter:string){return /heal|restoration|casting|mp|hymn|incomingdamage|damagereduction|speed|^int$|^sta$|^maxhp$|^def$/.test(parameter);}
