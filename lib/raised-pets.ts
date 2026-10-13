import type {RaisedPetConfig,RaisedPetData,RaisedPetTier} from './model';

export const RAISED_PET_TIERS=[{id:'F',maxLevel:1},{id:'E',maxLevel:2},{id:'D',maxLevel:3},{id:'C',maxLevel:4},{id:'B',maxLevel:5},{id:'A',maxLevel:7},{id:'S',maxLevel:9}] as const;
export const LEGACY_PET_WARNING='Legacy Raised Pet used the old single-level model. Tier rolls need review.';
export function isRaisedPetTier(value:unknown):value is RaisedPetTier{return RAISED_PET_TIERS.some(x=>x.id===value);}
export function reachedPetTiers(tier:RaisedPetTier){const index=RAISED_PET_TIERS.findIndex(x=>x.id===tier);return index<0?[]:RAISED_PET_TIERS.slice(0,index+1);}
export function createRaisedPet(id:number):RaisedPetConfig{return {id,tier:'F',levels:{F:1}};}
export function changeRaisedPetTier(config:RaisedPetConfig,tier:RaisedPetTier,defaultNewLevels=true):RaisedPetConfig{const levels={...config.levels},previous=new Set(reachedPetTiers(config.tier).map(x=>x.id));for(const row of reachedPetTiers(tier))if(defaultNewLevels&&!previous.has(row.id)&&levels[row.id]===undefined)levels[row.id]=1;return {...config,tier,levels};}
export function presetRaisedPet(config:RaisedPetConfig,preset:'perfect'|'minimum'):RaisedPetConfig{const levels={...config.levels};for(const row of reachedPetTiers(config.tier))levels[row.id]=preset==='perfect'?row.maxLevel:1;return {...config,levels};}
export function validateRaisedPet(config:RaisedPetConfig,petData:RaisedPetData|undefined):string[]{
 const errors:string[]=[];if(!petData||petData.petItemId!==config.id||!petData.parameter||!petData.values?.length)return ['Raised Pet is unavailable or has no stat bonus.'];
 if(!isRaisedPetTier(config.tier))return ['Raised Pet current tier is invalid.'];
 for(const row of reachedPetTiers(config.tier)){const level=config.levels?.[row.id];if(level===undefined){errors.push('Raised Pet '+row.id+' tier level needs review.');continue;}if(!Number.isInteger(level)||level<1||level>row.maxLevel){errors.push('Raised Pet '+row.id+' tier level must be 1–'+row.maxLevel+'.');continue;}if(!Number.isFinite(petData.values[level-1]))errors.push('Raised Pet '+row.id+' tier level has no API stat value.');}return errors;
}
export function getRaisedPetBonus(config:RaisedPetConfig,petData:RaisedPetData|undefined){const errors=validateRaisedPet(config,petData),tiers: {tier:RaisedPetTier;level:number;value:number}[]=[];
 if(isRaisedPetTier(config.tier))for(const row of reachedPetTiers(config.tier)){const level=config.levels?.[row.id];if(level!==undefined&&Number.isInteger(level)&&level>=1&&level<=row.maxLevel&&Number.isFinite(petData?.values?.[level-1]))tiers.push({tier:row.id,level,value:petData!.values![level-1]});}
 return {parameter:petData?.parameter??'',rate:petData?.rate??false,total:errors.length?0:tiers.reduce((sum,x)=>sum+x.value,0),tiers,errors};
}
/** The old index contained no history. Preserve it for review, without inventing higher rolls. */
export function migrateLegacyRaisedPet(pet:{id:number;level:number}):RaisedPetConfig{return {...createRaisedPet(pet.id),legacyLevelIndex:pet.level};}
