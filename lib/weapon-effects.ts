import { catalogItem, catalogSkill } from './catalog-index';
import { getAdditionalStatAbilities } from './additional-stat';
import { getConfiguredItemAbilities, getItemAbilityRange } from './item-stat-ranges';
import { getActiveUltimateSockets, getWeaponAttackUpgrade } from './item-rules';
import { resolveCanonicalParameter } from './stat-parameters';
import type { Ability, CharacterBuild, GameData, Item, Slot } from './model';

export type WeaponParameterSupportStatus =
  | 'sheet-supported'
  | 'combat-supported'
  | 'sheet+combat-supported'
  | 'conditional-supported'
  | 'trigger-supported'
  | 'recognized-unsupported'
  | 'unknown';

export type WeaponEffectType =
  | 'stat'
  | 'conditional-damage'
  | 'skill-specific'
  | 'trigger-skill'
  | 'proc'
  | 'unsupported';

export type WeaponEffectTargetScope =
  | 'self'
  | 'primary-target'
  | 'surrounding-targets'
  | 'all-targets'
  | 'unknown';

export type WeaponEffectConfidence =
  | 'verified'
  | 'reference-backed'
  | 'estimated'
  | 'unsupported';

export type WeaponAbilitySource =
  | 'item.abilities'
  | 'possibleRandomStats'
  | 'upgradeLevels';

export interface WeaponParameterSupport {
  parameter: string;
  status: WeaponParameterSupportStatus;
  appliedToSheet: boolean;
  appliedToCombat: boolean;
  conditional: boolean;
  trigger: boolean;
  supported: boolean;
  confidence: WeaponEffectConfidence;
  note: string;
}

export interface WeaponEffect {
  sourceItemId: number;
  sourceItemName: string;
  slot: Slot;
  source: string;
  abilityIndex?: number;

  type: WeaponEffectType;
  supportStatus: WeaponParameterSupportStatus;

  parameter?: string;
  value?: number;
  operation?: 'flat' | 'rate' | 'set';

  skillId?: number;
  skillName?: string;
  probability?: number;

  targetScope: WeaponEffectTargetScope;
  condition?: string;

  appliedToSheet: boolean;
  appliedToCombat: boolean;
  conditional: boolean;
  supported: boolean;
  confidence: WeaponEffectConfidence;
  note?: string;
}

export interface WeaponEffectInspectorRow {
  id: string;
  slot: 'rightHand' | 'leftHand';
  itemId: number;
  itemName: string;
  source:
    | 'base-attack'
    | 'attack-speed'
    | 'innate-element'
    | 'innate-element-attack'
    | 'upgrade'
    | 'element-upgrade'
    | 'intrinsic-fixed'
    | 'intrinsic-roll'
    | 'additional-skill-damage'
    | 'additional-stat'
    | 'weapon-bonus'
    | 'ultimate-random'
    | 'ultimate-plus6'
    | 'ultimate-plus10'
    | 'ultimate-jewel'
    | 'ultimate-rune'
    | 'conditional'
    | 'trigger';
  label: string;
  value: string;
  numericValue?: number;
  parameter?: string;
  skillId?: number;
  status: WeaponParameterSupportStatus;
  appliedToSheet: boolean;
  appliedToCombat: boolean;
  conditional: boolean;
  unsupported: boolean;
  note?: string;
}

/**
 * Current Flyff API parameter vocabulary pinned at the time of this coverage pass.
 * Do NOT replace this with a runtime import from ability-parameters.json: this list is
 * intentionally static so a newly introduced API parameter becomes `unknown` until
 * NAOL explicitly reviews and classifies it.
 */
export const CURRENT_REVIEWED_API_PARAMETERS = new Set<string>([
  'str','dex','int','sta','speed','attackspeed','attackspeedrate','jumpheight','bowrange','def','parry','reflectdamage','rangedblock','meleeblock','magicdefense','electricitydefense','firedefense','winddefense','waterdefense','earthdefense','attack','hitrate','magicattack','swordattack','axeattack','knuckleattack','yoyoattack','bowattack','earthmastery','firemastery','watermastery','electricitymastery','windmastery','damage','criticalchance','elementattack','skillchance','attribute','maxhp','maxmp','maxfp','hprecovery','mprecovery','fprecovery','hprecoveryafterkill','mprecoveryafterkill','fprecoveryafterkill','decreasedmpconsumption','decreasedfpconsumption','minability','maxability','attributeimmunity','autohp','autohppvp','decreasedcastingtime','criticaldamage','skilldamage','hprestoration','criticalresist','healing','pvpdamagereduction','pvpdamage','pvedamage','penya','hp','mp','fp','allelementsdefense','allstats','attackandmaxhp','defenseandhitratedecrease','cure','movement','allelementsmastery','allrecovery','allrecoveryafterkill','decreasedfpandmpconsumption','removealldebuff','block','removedebuff','damageandstealhp','stealhp','explostdecreaseatrevival','cheerpoint','incomingdamage','spiritstrike','stealfp','exprate','droprate','fprecoveryautoattack','bleedandpoisonresist','pvedamagereduction','blockpenetration','damageoffload','incominghealing','multistrike','monsterexp','monsterexpanddrop','hppercentrecovery','expanddrop','allspeed','arcaneinsightchance','ripostereflexchance','bossmonsterdamage','flyspeed','explossreduction','reviverestorehp','reviverestoremp','reviverestorefp','addedvendordays','partyexp','guildartifactmaxhp','guildartifactdef','guildartifacthprecovery','hpfromnearbyguildartifact','decreasedcastingtimefromnearbyguildartifact','deffromnearbyguildartifact','attackfromnearbyguildartifact','attackspeedratefromnearbyguildartifact','pvpblock','pvpblockpenetration','pvpcriticaldamage','pvpcriticalchance','generalupgraderate','accessoryupgraderate','piercingrate','reloadexpstop','monsterpenya','skillrange','1v1skilldamage','upgraderate','alchemyrate','cookingrate','carpentryrate','smithingrate','pickuprange','pveincomingdamage','damagefromburned','damagefromwatered','damagefromshocked','damagefromsuffocated','maxshield','damageandstealmp','damageandstealfp','autoattackdamage','closedamage','fardamage','actionspeed','pittedcriticaldamage','traprange','auraeffect','asaldamage','tenacity','nenadditionalchance','nenhalfchance','yoyorange','rearinvisibledamage','damagefrompoisoned','damagevspoisoned','invisiblecleansechance','projectilespeed','disableeffect','weakeneffect','debuffduration','perdisabledebuffdamage','perweakendebuffdamage','damagetakenperdebuff','bossincomingdamage','hymncooldownreduction','hymndamagereduction','decreasedhpconsumption','recoverhponbleedingkill','lefthanddamage','lowhpdamagereduction','thirdjobcooldownreduction','damagetick','thirdjobskilldamage','muranswrath','ankousharvest','freedungeonentry','fwccoindrop','speedwithhymn','stealmp','samejewelenchant',
]);

const SHEET_AND_COMBAT = new Set<string>([
  'str','dex','int','sta',
  'attackspeed','attackspeedrate',
  'def','parry','rangedblock','meleeblock','magicdefense',
  'electricitydefense','firedefense','winddefense','waterdefense','earthdefense','allelementsdefense',
  'attack','hitrate','magicattack',
  'swordattack','axeattack','knuckleattack','yoyoattack','bowattack',
  'earthmastery','firemastery','watermastery','electricitymastery','windmastery','allelementsmastery',
  'damage','criticalchance','elementattack',
  'maxhp','maxmp','maxfp',
  'minability','maxability','decreasedcastingtime','criticaldamage','skilldamage','criticalresist',
  'pvpdamagereduction','pvpdamage','pvedamage','allstats','block','incomingdamage','spiritstrike',
  'pvedamagereduction','blockpenetration','allspeed','bossmonsterdamage','pvpblock','pvpblockpenetration',
]);

const SHEET_ONLY = new Set<string>([
  'speed','attribute','hprecovery','decreasedmpconsumption','hprestoration','healing','incominghealing','actionspeed','pveincomingdamage',
]);

const COMBAT_ONLY = new Set<string>([
  'pvpcriticaldamage','pvpcriticalchance','autoattackdamage','lefthanddamage','thirdjobskilldamage',
]);

const CONDITIONAL = new Set<string>(['muranswrath','ankousharvest']);
const TRIGGER = new Set<string>(['skillchance']);

function supportResult(
  parameter: string,
  status: WeaponParameterSupportStatus,
  note: string,
): WeaponParameterSupport {
  const sheet = status === 'sheet-supported' || status === 'sheet+combat-supported';
  const combat = status === 'combat-supported' || status === 'sheet+combat-supported' || status === 'conditional-supported';
  const conditional = status === 'conditional-supported';
  const trigger = status === 'trigger-supported';
  const supported = !['recognized-unsupported','unknown'].includes(status);
  const confidence: WeaponEffectConfidence = status === 'conditional-supported' || status === 'trigger-supported'
    ? 'reference-backed'
    : supported
      ? 'verified'
      : 'unsupported';
  return {parameter,status,appliedToSheet:sheet,appliedToCombat:combat,conditional,trigger,supported,confidence,note};
}

export function getWeaponParameterSupport(rawParameter: string): WeaponParameterSupport {
  const parameter = resolveCanonicalParameter(rawParameter);
  if (SHEET_AND_COMBAT.has(parameter)) return supportResult(parameter,'sheet+combat-supported','Explicitly consumed by the derived-stat and combat engines.');
  if (SHEET_ONLY.has(parameter)) return supportResult(parameter,'sheet-supported','Explicitly exposed by the derived/stat-support layer; it is not a direct outgoing-damage multiplier.');
  if (COMBAT_ONLY.has(parameter)) return supportResult(parameter,'combat-supported','Explicitly consumed by combat formulas but not treated as a general Character Details stat.');
  if (CONDITIONAL.has(parameter)) return supportResult(parameter,'conditional-supported','Explicit target-state conditional handled by the conditional damage stage.');
  if (TRIGGER.has(parameter)) return supportResult(parameter,'trigger-supported','The trigger parameter is decoded. Individual triggered-skill simulation can still be unsupported.');
  if (CURRENT_REVIEWED_API_PARAMETERS.has(parameter)) return supportResult(parameter,'recognized-unsupported','Known current Flyff API parameter, but NAOL has no verified calculation consumer for this mechanic yet.');
  return supportResult(parameter,'unknown','Parameter is not in the reviewed weapon/API support registry.');
}

function abilityValue(ability: Ability): number {
  return ability.set ?? ability.add ?? 0;
}

function abilityOperation(ability: Ability): 'flat' | 'rate' | 'set' {
  if (ability.set !== undefined) return 'set';
  return ability.rate ? 'rate' : 'flat';
}

const TRIGGER_SKILL_RULES: Record<number, {
  targetScope: WeaponEffectTargetScope;
  simulationSupported: boolean;
  confidence: WeaponEffectConfidence;
  note: string;
}> = {
  11389: {
    targetScope: 'surrounding-targets',
    simulationSupported: false,
    confidence: 'reference-backed',
    note: 'Waterbomb is recognized as an AoE/surrounding-target proc and is intentionally excluded from primary-target DPS until its full proc formula is verified.',
  },
};

/**
 * Flyffulator's reference Entity.getStat() sums item abilities from all equipped slots,
 * and its damage calculator reads Muran/Ankou through that aggregate. Until stronger
 * game evidence says otherwise, NAOL follows that reference-backed behavior for the
 * two weapon HP-threshold conditionals: right + left weapon values stack.
 */
export const CONDITIONAL_WEAPON_HAND_POLICY = {
  slots: ['rightHand','leftHand'] as const,
  mode: 'sum-equipped-weapons' as const,
  confidence: 'reference-backed' as const,
};

function classifyAbility(
  item: Item,
  slot: 'rightHand' | 'leftHand',
  ability: Ability,
  data: GameData,
  abilityIndex?: number,
  source = 'item.abilities',
): WeaponEffect {
  const parameter = resolveCanonicalParameter(ability.parameter);
  const value = abilityValue(ability);
  const support = getWeaponParameterSupport(parameter);

  if (parameter === 'skillchance') {
    const skillId = ability.skill;
    const skill = skillId ? catalogSkill(data, skillId) : undefined;
    const rule = skillId ? TRIGGER_SKILL_RULES[skillId] : undefined;
    return {
      sourceItemId:item.id,sourceItemName:item.name,slot,source,abilityIndex,
      type: skillId ? 'trigger-skill' : 'unsupported',
      supportStatus:support.status,parameter,value,probability:value,operation:abilityOperation(ability),
      skillId,skillName:skill?.name ?? (skillId ? `Skill #${skillId}` : undefined),
      targetScope:rule?.targetScope ?? 'unknown',
      appliedToSheet:false,appliedToCombat:!!rule?.simulationSupported,conditional:false,
      supported:!!rule?.simulationSupported,
      confidence:rule?.confidence ?? 'unsupported',
      note:rule?.note ?? (skillId ? 'Triggered skill is recognized by ID, but its combat semantics are not implemented.' : 'skillchance has no canonical skill ID.'),
    };
  }

  if (parameter === 'muranswrath' || parameter === 'ankousharvest') {
    return {
      sourceItemId:item.id,sourceItemName:item.name,slot,source,abilityIndex,
      type:'conditional-damage',supportStatus:support.status,parameter,value,operation:abilityOperation(ability),
      targetScope:'primary-target',condition:parameter === 'muranswrath' ? 'target-hp-full' : 'target-hp-below-25',
      appliedToSheet:false,appliedToCombat:true,conditional:true,supported:true,confidence:'reference-backed',
      note:parameter === 'muranswrath' ? 'Active at exactly 100% target HP; halved in PvP.' : 'Active below 25% target HP; halved in PvP.',
    };
  }

  return {
    sourceItemId:item.id,sourceItemName:item.name,slot,source,abilityIndex,
    type:support.supported?'stat':'unsupported',supportStatus:support.status,parameter,value,operation:abilityOperation(ability),
    targetScope:support.appliedToSheet?'self':'primary-target',
    appliedToSheet:support.appliedToSheet,appliedToCombat:support.appliedToCombat,conditional:false,
    supported:support.supported,confidence:support.confidence,note:support.note,
  };
}

export function resolveWeaponEffects(
  build: CharacterBuild,
  data: GameData,
  slot: 'rightHand' | 'leftHand' = 'rightHand',
): WeaponEffect[] {
  const gear = build.equipment[slot];
  if (!gear) return [];
  const item = catalogItem(data, gear.itemId);
  if (!item || item.category !== 'weapon') return [];

  const effects = getConfiguredItemAbilities(item, gear).map((ability,index) => classifyAbility(item,slot,ability,data,index,'item.abilities'));

  if (typeof item.additionalSkillDamage === 'number' && item.additionalSkillDamage !== 0) {
    effects.push({
      sourceItemId:item.id,sourceItemName:item.name,slot,source:'additionalSkillDamage',type:'skill-specific',supportStatus:'combat-supported',
      parameter:'additionalSkillDamage',value:item.additionalSkillDamage,operation:'flat',targetScope:'primary-target',
      appliedToSheet:false,appliedToCombat:true,conditional:false,supported:true,confidence:'verified',
      note:'Consumed by the existing skill-power calculation.',
    });
  }

  for (const trigger of item.triggerSkill ?? []) {
    const skill = catalogSkill(data, trigger.skill);
    effects.push({
      sourceItemId:item.id,sourceItemName:item.name,slot,source:'item.triggerSkill',type:'trigger-skill',supportStatus:'recognized-unsupported',
      skillId:trigger.skill,skillName:skill?.name ?? `Skill #${trigger.skill}`,probability:typeof item.triggerSkillProbability === 'number' ? item.triggerSkillProbability : undefined,
      targetScope:trigger.onTarget?'primary-target':'unknown',appliedToSheet:false,appliedToCombat:false,conditional:false,supported:false,confidence:'unsupported',
      note:'Item triggerSkill is preserved and audited, but generic triggerSkill simulation is not implemented yet.',
    });
  }

  if (gear.weaponBonus) {
    if (gear.weaponBonus.type === 'skill') {
      effects.push({
        sourceItemId:item.id,sourceItemName:item.name,slot,source:'weaponBonus',type:'skill-specific',supportStatus:'combat-supported',
        skillId:gear.weaponBonus.skillId,skillName:catalogSkill(data,gear.weaponBonus.skillId)?.name,parameter:'skilldamage',value:gear.weaponBonus.value,
        targetScope:'primary-target',appliedToSheet:false,appliedToCombat:true,conditional:false,supported:true,confidence:'verified',
        note:'Applies only to the matching selected skill through the Weapon Bonus engine.',
      });
    } else {
      const support = getWeaponParameterSupport(gear.weaponBonus.parameter);
      effects.push({
        sourceItemId:item.id,sourceItemName:item.name,slot,source:'weaponBonus',type:support.supported?'stat':'unsupported',supportStatus:support.status,
        parameter:support.parameter,value:gear.weaponBonus.value,operation:'flat',targetScope:support.appliedToSheet?'self':'primary-target',
        appliedToSheet:support.appliedToSheet,appliedToCombat:support.appliedToCombat,conditional:support.conditional,supported:support.supported,confidence:support.confidence,note:support.note,
      });
    }
  }

  return effects;
}

function effectToInspector(effect: WeaponEffect): WeaponEffectInspectorRow {
  const source: WeaponEffectInspectorRow['source'] = effect.source === 'item.abilities'
    ? effect.conditional ? 'conditional' : effect.type === 'trigger-skill' || effect.type === 'unsupported' && effect.parameter === 'skillchance' ? 'trigger' : effect.abilityIndex !== undefined ? 'intrinsic-fixed' : 'intrinsic-fixed'
    : effect.source === 'additionalSkillDamage' ? 'additional-skill-damage'
      : effect.source === 'weaponBonus' ? 'weapon-bonus'
        : effect.source === 'item.triggerSkill' ? 'trigger'
          : 'intrinsic-fixed';
  return {
    id:`${effect.slot}:${effect.source}:${effect.sourceItemId}:${effect.abilityIndex ?? effect.skillId ?? effect.parameter ?? 'effect'}`,
    slot:effect.slot as 'rightHand'|'leftHand',itemId:effect.sourceItemId,itemName:effect.sourceItemName,source,
    label:effect.skillName ?? effect.parameter ?? effect.type,
    value:effect.probability !== undefined ? `${effect.probability}% chance` : effect.value !== undefined ? String(effect.value) : 'Configured',
    numericValue:effect.value,parameter:effect.parameter,skillId:effect.skillId,
    status:effect.supportStatus==='unknown'?'unknown':effect.supported ? effect.supportStatus : 'recognized-unsupported',
    appliedToSheet:effect.appliedToSheet,appliedToCombat:effect.appliedToCombat,conditional:effect.conditional,unsupported:!effect.supported,note:effect.note,
  };
}

function abilityInspectorRow(
  slot:'rightHand'|'leftHand', weapon:Item, source:WeaponEffectInspectorRow['source'], label:string, ability:Ability, suffix:string, data:GameData,
):WeaponEffectInspectorRow {
  const support=getWeaponParameterSupport(ability.parameter),value=abilityValue(ability);
  if(support.trigger){
    const rule=ability.skill?TRIGGER_SKILL_RULES[ability.skill]:undefined;
    return {id:`${slot}:${source}:${weapon.id}:${suffix}`,slot,itemId:weapon.id,itemName:weapon.name,source,label,value:`${value}% chance`,numericValue:value,parameter:support.parameter,skillId:ability.skill,status:rule?.simulationSupported?'trigger-supported':'recognized-unsupported',appliedToSheet:false,appliedToCombat:!!rule?.simulationSupported,conditional:false,unsupported:!rule?.simulationSupported,note:rule?.note??(ability.skill?`Triggered skill ${catalogSkill(data,ability.skill)?.name??'#'+ability.skill} is recognized but not simulated.`:'skillchance has no canonical skill ID.')};
  }
  return {id:`${slot}:${source}:${weapon.id}:${suffix}`,slot,itemId:weapon.id,itemName:weapon.name,source,label,value:String(value),numericValue:value,parameter:support.parameter,status:support.status,appliedToSheet:support.appliedToSheet,appliedToCombat:support.appliedToCombat,conditional:support.conditional,unsupported:!support.supported,note:support.note};
}

export function getWeaponEffectInspectorRows(
  build:CharacterBuild,
  data:GameData,
  slot:'rightHand'|'leftHand'='rightHand',
):WeaponEffectInspectorRow[]{
  const gear=build.equipment[slot];
  if(!gear)return [];
  const item=catalogItem(data,gear.itemId);
  if(!item||item.category!=='weapon')return [];
  const rows:WeaponEffectInspectorRow[]=[];

  if(Number.isFinite(item.minAttack)||Number.isFinite(item.maxAttack))rows.push({id:`${slot}:base-attack:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'base-attack',label:'Base Attack',value:`${item.minAttack??0}–${item.maxAttack??item.minAttack??0}`,status:'sheet+combat-supported',appliedToSheet:true,appliedToCombat:true,conditional:false,unsupported:false,note:'Canonical weapon base attack range.'});
  if(Number.isFinite(item.attackSpeedValue))rows.push({id:`${slot}:attack-speed:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'attack-speed',label:'Weapon Attack Speed Coefficient',value:String(item.attackSpeedValue),numericValue:item.attackSpeedValue,status:'sheet+combat-supported',appliedToSheet:true,appliedToCombat:true,conditional:false,unsupported:false,note:'Used by the attack-speed formula.'});
  if(item.element&&item.element!=='none')rows.push({id:`${slot}:innate-element:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'innate-element',label:'Innate Element',value:item.element,status:'combat-supported',appliedToSheet:false,appliedToCombat:true,conditional:false,unsupported:false,note:'Resolved as the weapon offensive element when no configured override replaces it.'});
  const innateElementAttack=Number(item.elementAttack??0);if(Number.isFinite(innateElementAttack)&&innateElementAttack!==0)rows.push({id:`${slot}:innate-element-attack:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'innate-element-attack',label:'Innate Element Attack',value:String(innateElementAttack),numericValue:innateElementAttack,parameter:'elementattack',status:'combat-supported',appliedToSheet:false,appliedToCombat:true,conditional:false,unsupported:false,note:'Consumed by elemental combat when the weapon has innate elemental attack.'});

  const upgrade=getWeaponAttackUpgrade(item,gear,data);if(upgrade.upgradeLevel>0)rows.push({id:`${slot}:upgrade:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'upgrade',label:item.rarity==='ultimate'||gear.ultimateWeapon?`Ultimate weapon attack +${gear.ultimateWeapon?.ultimateUpgrade??0}`:`Normal weapon upgrade +${upgrade.upgradeLevel}`,value:`${upgrade.weaponAttack}% weapon attack (API row ${upgrade.upgradeLevel})`,numericValue:upgrade.weaponAttack,status:'sheet+combat-supported',appliedToSheet:true,appliedToCombat:true,conditional:false,unsupported:false,note:'Applied exactly once through upgradelevelbonus.'});
  if(gear.element&&gear.element!=='none'&&(gear.elementUpgrade??0)>0)rows.push({id:`${slot}:element-upgrade:${item.id}`,slot,itemId:item.id,itemName:item.name,source:'element-upgrade',label:'Weapon Element Upgrade',value:`${gear.element} +${gear.elementUpgrade}`,numericValue:gear.elementUpgrade,status:'combat-supported',appliedToSheet:false,appliedToCombat:true,conditional:false,unsupported:false,note:'Handled by elemental combat; not a generic Attack % modifier.'});

  for(const effect of resolveWeaponEffects(build,data,slot)){
    const row=effectToInspector(effect);
    if(effect.source==='item.abilities'&&effect.abilityIndex!==undefined&&row.source==='intrinsic-fixed'&&getItemAbilityRange(item,effect.abilityIndex))row.source='intrinsic-roll';
    rows.push(row);
  }

  for(const [index,ability] of getAdditionalStatAbilities(gear.additionalStat,data).entries())rows.push(abilityInspectorRow(slot,item,'additional-stat','Additional Stat',ability,String(index),data));

  const ultimate=gear.ultimateWeapon;
  if(ultimate){
    const addBonus=(source:WeaponEffectInspectorRow['source'],label:string,bonus:{parameter:string;value:number;rate:boolean}|null|undefined,suffix:string,requiredUltimateLevel=0)=>{if(!bonus)return;const row=abilityInspectorRow(slot,item,source,label,{parameter:bonus.parameter,add:bonus.value,rate:bonus.rate},suffix,data);if(ultimate.ultimateUpgrade<requiredUltimateLevel){row.status='recognized-unsupported';row.appliedToSheet=false;row.appliedToCombat=false;row.conditional=false;row.unsupported=true;row.note=`Configured bonus is inactive until Ultimate +${requiredUltimateLevel}.`;}rows.push(row);};
    ultimate.bonuses.base.forEach((bonus,index)=>addBonus('ultimate-random',`Ultimate Bonus ${index+1}`,bonus,String(index)));
    addBonus('ultimate-plus6','Ultimate +6 Bonus',ultimate.bonuses.plus6,'plus6',6);
    addBonus('ultimate-plus10','Ultimate +10 Bonus',ultimate.bonuses.plus10,'plus10',10);
    const active=getActiveUltimateSockets(item,gear);
    for(const socket of ultimate.jewels){
      const content=catalogItem(data,socket.content.itemId),isActive=socket.index<active,source=socket.content.kind==='rune'?'ultimate-rune':'ultimate-jewel';
      if(!content){rows.push({id:`${slot}:${source}:${socket.index}:missing`,slot,itemId:item.id,itemName:item.name,source,label:`Ultimate socket ${socket.index+1}`,value:`Missing item #${socket.content.itemId}`,status:'recognized-unsupported',appliedToSheet:false,appliedToCombat:false,conditional:false,unsupported:true,note:'Configured socket content is missing from the synchronized catalog.'});continue;}
      if(!(content.abilities?.length)){rows.push({id:`${slot}:${source}:${socket.index}:${content.id}`,slot,itemId:item.id,itemName:item.name,source,label:content.name,value:isActive?'Active':'Inactive',status:'recognized-unsupported',appliedToSheet:false,appliedToCombat:false,conditional:false,unsupported:true,note:isActive?'Socket item has no projected ability payload.':'Socket is not active at the current Ultimate level.'});continue;}
      content.abilities.forEach((ability,index)=>{const row=abilityInspectorRow(slot,item,source,content.name,ability,`${socket.index}:${content.id}:${index}`,data);if(!isActive){row.status='recognized-unsupported';row.appliedToSheet=false;row.appliedToCombat=false;row.unsupported=true;row.note='Socket is configured but inactive at the current Ultimate level.';}rows.push(row);});
    }
  }

  return rows;
}

export function getWeaponConditionalRate(build:CharacterBuild,data:GameData,parameter:'muranswrath'|'ankousharvest'){
  const canonical=resolveCanonicalParameter(parameter);
  return CONDITIONAL_WEAPON_HAND_POLICY.slots.flatMap(slot=>getWeaponEffectInspectorRows(build,data,slot)).filter(row=>row.parameter===canonical&&row.conditional&&!row.unsupported).reduce((sum,row)=>sum+(row.numericValue??0),0);
}

type ParameterOccurrence={itemId:number;itemName:string;parameter:string;rawParameter:string;source:WeaponAbilitySource;ability:Ability};
export interface WeaponParameterAuditRow{parameter:string;status:WeaponParameterSupportStatus;count:number;sources:WeaponAbilitySource[];exampleItems:{id:number;name:string}[];}
export interface WeaponTriggerAuditRow{itemId:number;itemName:string;source:'skillchance'|'item.triggerSkill';skillId:number|null;skillName:string;probability:number|null;targetScope:WeaponEffectTargetScope;supported:boolean;status:'trigger-supported'|'recognized-unsupported';note:string;}

function weaponParameterOccurrences(data:GameData):ParameterOccurrence[]{
  const out:ParameterOccurrence[]=[];
  for(const item of data.item){if(item.category!=='weapon')continue;
    const add=(ability:Ability,source:WeaponAbilitySource)=>out.push({itemId:item.id,itemName:item.name,parameter:resolveCanonicalParameter(ability.parameter),rawParameter:ability.parameter,source,ability});
    for(const ability of item.abilities??[])add(ability,'item.abilities');
    for(const ability of item.possibleRandomStats??[])add(ability,'possibleRandomStats');
    for(const level of item.upgradeLevels??[])for(const ability of level.abilities??[])add(ability,'upgradeLevels');
  }
  return out;
}

export function auditWeaponEffects(data:GameData){
  const weapons=data.item.filter(item=>item.category==='weapon'),occurrences=weaponParameterOccurrences(data),map=new Map<string,WeaponParameterAuditRow>(),unknown:ParameterOccurrence[]=[];
  for(const occurrence of occurrences){const support=getWeaponParameterSupport(occurrence.parameter);let row=map.get(support.parameter);if(!row){row={parameter:support.parameter,status:support.status,count:0,sources:[],exampleItems:[]};map.set(support.parameter,row);}row.count++;if(!row.sources.includes(occurrence.source))row.sources.push(occurrence.source);if(!row.exampleItems.some(item=>item.id===occurrence.itemId)&&row.exampleItems.length<8)row.exampleItems.push({id:occurrence.itemId,name:occurrence.itemName});if(support.status==='unknown')unknown.push(occurrence);}
  const uniqueParameters=[...map.values()].sort((a,b)=>a.parameter.localeCompare(b.parameter));
  const fullySupported=uniqueParameters.filter(row=>['sheet-supported','combat-supported','sheet+combat-supported'].includes(row.status));
  const conditionalSupported=uniqueParameters.filter(row=>row.status==='conditional-supported');
  const triggerSupported=uniqueParameters.filter(row=>row.status==='trigger-supported');
  const recognizedUnsupported=uniqueParameters.filter(row=>row.status==='recognized-unsupported');

  const skillChanceTriggers:WeaponTriggerAuditRow[]=[];
  for(const occurrence of occurrences.filter(row=>row.parameter==='skillchance')){const skillId=occurrence.ability.skill??null,rule=skillId?TRIGGER_SKILL_RULES[skillId]:undefined;skillChanceTriggers.push({itemId:occurrence.itemId,itemName:occurrence.itemName,source:'skillchance',skillId,skillName:skillId?(catalogSkill(data,skillId)?.name??`Skill #${skillId}`):'Missing skill ID',probability:Number.isFinite(occurrence.ability.add)?occurrence.ability.add!:null,targetScope:rule?.targetScope??'unknown',supported:!!rule?.simulationSupported,status:rule?.simulationSupported?'trigger-supported':'recognized-unsupported',note:rule?.note??'Trigger skill semantics are not implemented.'});}

  const itemTriggerSkills:WeaponTriggerAuditRow[]=[];
  for(const item of weapons)for(const trigger of item.triggerSkill??[]){const skill=catalogSkill(data,trigger.skill);itemTriggerSkills.push({itemId:item.id,itemName:item.name,source:'item.triggerSkill',skillId:trigger.skill,skillName:skill?.name??`Skill #${trigger.skill}`,probability:Number.isFinite(item.triggerSkillProbability)?item.triggerSkillProbability!:null,targetScope:trigger.onTarget?'primary-target':'unknown',supported:false,status:'recognized-unsupported',note:'item.triggerSkill is preserved and audited; generic trigger simulation is not implemented.'});}

  return {
    registryVersion:'2026-10-13',
    conditionalHandPolicy:CONDITIONAL_WEAPON_HAND_POLICY,
    totalWeapons:weapons.length,
    uniqueParameters,
    fullySupported,
    conditionalSupported,
    triggerSupported,
    recognizedUnsupported,
    unknown,
    skillChanceTriggers,
    itemTriggerSkills,
  };
}

