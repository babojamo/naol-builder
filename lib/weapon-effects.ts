import { catalogItem, catalogSkill } from './catalog-index';
import { getConfiguredItemAbilities } from './item-stat-ranges';
import { resolveCanonicalParameter } from './stat-parameters';

import type {
  Ability,
  CharacterBuild,
  GameData,
  Item,
  Slot,
} from './model';

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

export interface WeaponEffect {
  sourceItemId: number;
  sourceItemName: string;
  slot: Slot;

  type: WeaponEffectType;

  parameter?: string;
  value?: number;
  operation?: 'flat' | 'rate' | 'set';

  skillId?: number;
  skillName?: string;

  probability?: number;

  targetScope: WeaponEffectTargetScope;

  condition?: string;

  supported: boolean;
  confidence: WeaponEffectConfidence;

  note?: string;
}

function abilityValue(ability: Ability): number {
  return ability.set ?? ability.add ?? 0;
}

function abilityOperation(
  ability: Ability,
): 'flat' | 'rate' | 'set' {
  if (ability.set !== undefined) return 'set';
  return ability.rate ? 'rate' : 'flat';
}

/**
 * Known trigger semantics that are not expressible by the raw ability alone.
 *
 * Use SKILL IDS, never weapon names.
 */
const TRIGGER_SKILL_RULES: Record<
  number,
  {
    targetScope: WeaponEffectTargetScope;
    supported: boolean;
    confidence: WeaponEffectConfidence;
    note: string;
  }
> = {
  11389: {
    targetScope: 'surrounding-targets',
    supported: false,
    confidence: 'reference-backed',
    note:
      'Waterbomb is recognized as an AoE/surrounding-target proc. ' +
      'It is intentionally excluded from primary-target DPS until its ' +
      'complete proc damage semantics are implemented.',
  },
};

function classifyAbility(
  item: Item,
  slot: Slot,
  ability: Ability,
  data: GameData,
): WeaponEffect {
  const parameter = resolveCanonicalParameter(ability.parameter);
  const value = abilityValue(ability);

  if (parameter === 'muranswrath') {
    return {
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'conditional-damage',
      parameter,
      value,
      operation: abilityOperation(ability),
      targetScope: 'primary-target',
      condition: 'target-hp-full',
      supported: true,
      confidence: 'reference-backed',
      note: 'Active only while the target is at exactly 100% HP.',
    };
  }

  if (parameter === 'ankousharvest') {
    return {
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'conditional-damage',
      parameter,
      value,
      operation: abilityOperation(ability),
      targetScope: 'primary-target',
      condition: 'target-hp-below-25',
      supported: true,
      confidence: 'reference-backed',
      note: 'Active only while the target is below 25% HP.',
    };
  }

  if (parameter === 'skillchance') {
    const skillId = ability.skill;
    const skill = skillId
      ? catalogSkill(data, skillId)
      : undefined;

    if (!skillId) {
      return {
        sourceItemId: item.id,
        sourceItemName: item.name,
        slot,
        type: 'unsupported',
        parameter,
        value,
        operation: abilityOperation(ability),
        targetScope: 'unknown',
        supported: false,
        confidence: 'unsupported',
        note:
          'skillchance exists but does not contain a canonical skill ID.',
      };
    }

    const knownRule = TRIGGER_SKILL_RULES[skillId];

    return {
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'trigger-skill',
      parameter,
      value,
      probability: value,
      operation: abilityOperation(ability),
      skillId,
      skillName: skill?.name ?? `Skill #${skillId}`,
      targetScope: knownRule?.targetScope ?? 'unknown',
      supported: knownRule?.supported ?? false,
      confidence: knownRule?.confidence ?? 'unsupported',
      note:
        knownRule?.note ??
        'Triggered skill is recognized, but its combat semantics are not implemented yet.',
    };
  }

  /*
   * Ordinary abilities continue through the existing StatModifier engine.
   * Do NOT apply them again here.
   */
  return {
    sourceItemId: item.id,
    sourceItemName: item.name,
    slot,
    type: 'stat',
    parameter,
    value,
    operation: abilityOperation(ability),
    targetScope: 'self',
    supported: true,
    confidence: 'verified',
    note: 'Routed through the canonical StatModifier pipeline.',
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

  if (!item || item.category !== 'weapon') {
    return [];
  }

  const effects = getConfiguredItemAbilities(item, gear).map(
    ability => classifyAbility(item, slot, ability, data),
  );

  if (
    typeof item.additionalSkillDamage === 'number' &&
    item.additionalSkillDamage !== 0
  ) {
    effects.push({
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'skill-specific',
      parameter: 'additionalSkillDamage',
      value: item.additionalSkillDamage,
      operation: 'flat',
      targetScope: 'primary-target',
      supported: true,
      confidence: 'verified',
      note:
        'Consumed by the existing skill-power calculation.',
    });
  }

  for (const trigger of item.triggerSkill ?? []) {
    const skill = catalogSkill(data, trigger.skill);

    effects.push({
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'trigger-skill',
      skillId: trigger.skill,
      skillName: skill?.name ?? `Skill #${trigger.skill}`,
      probability:
        typeof item.triggerSkillProbability === 'number'
          ? item.triggerSkillProbability
          : undefined,
      targetScope: trigger.onTarget
        ? 'primary-target'
        : 'unknown',
      supported: false,
      confidence: 'unsupported',
      note:
        'Item triggerSkill was recognized. Trigger simulation is not yet implemented.',
    });
  }

  if (gear.weaponBonus) {
    effects.push({
      sourceItemId: item.id,
      sourceItemName: item.name,
      slot,
      type: 'skill-specific',
      skillId:
        gear.weaponBonus.type === 'skill'
          ? gear.weaponBonus.skillId
          : undefined,
      skillName:
        gear.weaponBonus.type === 'skill'
          ? catalogSkill(
              data,
              gear.weaponBonus.skillId,
            )?.name
          : undefined,
      parameter:
        gear.weaponBonus.type === 'parameter'
          ? gear.weaponBonus.parameter
          : 'skilldamage',
      value: gear.weaponBonus.value,
      targetScope: 'primary-target',
      supported: true,
      confidence: 'verified',
      note:
        gear.weaponBonus.type === 'skill'
          ? 'Applies only to the matching skill.'
          : 'Parameter Weapon Bonus.',
    });
  }

  return effects;
}

export function auditWeaponEffects(data: GameData) {
  const weapons = data.item.filter(
    item => item.category === 'weapon',
  );

  const parameterCounts = new Map<string, number>();
  const skillChanceIds = new Map<number, number>();

  for (const weapon of weapons) {
    for (const ability of weapon.abilities ?? []) {
      const parameter =
        resolveCanonicalParameter(ability.parameter);

      parameterCounts.set(
        parameter,
        (parameterCounts.get(parameter) ?? 0) + 1,
      );

      if (
        parameter === 'skillchance' &&
        ability.skill
      ) {
        skillChanceIds.set(
          ability.skill,
          (skillChanceIds.get(ability.skill) ?? 0) + 1,
        );
      }
    }
  }

  return {
    totalWeapons: weapons.length,

    parameters: [...parameterCounts.entries()]
      .map(([parameter, count]) => ({
        parameter,
        count,
      }))
      .sort((a, b) =>
        a.parameter.localeCompare(b.parameter),
      ),

    skillChanceSkills: [...skillChanceIds.entries()]
      .map(([skillId, count]) => ({
        skillId,
        skillName:
          catalogSkill(data, skillId)?.name ??
          `Skill #${skillId}`,
        count,
        status:
          skillId in TRIGGER_SKILL_RULES
            ? 'recognized'
            : 'recognized-unsupported',
      }))
      .sort((a, b) =>
        a.skillName.localeCompare(b.skillName),
      ),
  };
}
