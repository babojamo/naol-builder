# Formula assumptions and sources

Source of official fields: [Flyff Universe OpenAPI 1.9.5](https://api.flyff.com), inspected October 12, 2026. Captured game data version: 37.

No full combat equation is claimed to be officially verified unless the API actually supplies it. Mathematical invariants are tested; this is not validation against in-game damage logs. Formula metadata lives in combat/sources.ts and is displayed in Calculation Details. The confidence applies to the described input or assumption, not to every combined result.

## HP / MP / FP

Source: official-api · Confidence: high · Status: verified official

Class maxHP, maxMP and maxFP strings are evaluated with level and derived stats. Flat and rate bonus stacking order is an approximation.

## Equipment & upgrades

Source: official-api · Confidence: high · Status: verified official

Base attack/defense, upgrade percentages, abilities and set membership come from the API. Their final stacking order remains inferred.

## Attack / defense

Source: inferred · Confidence: low · Status: experimental

Weapon attack × 2 + class autoAttackFactor × primary stat + level × 2, then weapon upgrade and attack abilities. Defense = armor + STA × class defense + level. Offhand weapon damage cycle is not implemented.

## Hit probability

Source: experimental · Confidence: low · Status: experimental

Clamp(hitBase + (attacker hitRate − target DEX − target parry) × dexHitFactor + level difference × levelHitFactor, 5%, 96%). Attacker base hit rating = level + DEX. Defaults: 75, 0.2, 1.

## Critical / attack speed / block

Source: inferred · Confidence: low · Status: experimental

Crit = floor(DEX / 10) × class critical + bonuses. Critical multiplier starts at 200%. Speed = class attackSpeed + DEX × 0.1 + bonuses, capped at 100. Base block = DEX × class block / 10. These equations have not been validated.

## Element modifier

Source: experimental · Confidence: low · Status: experimental

1 + API elementAttack × elementScale × (1 − API resistance). Default elementScale = 0.01. Resistance units and strong/same-element mechanics are unverified. elementAttackStrong is retained but not applied.

## PvE / PvP / bosses

Source: experimental · Confidence: low · Status: experimental

Percentage bonuses are additive. PvP multiplier defaults to 0.6 followed by opponent reduction. Boss bonus applies to giant, boss, worldboss. Unknown monster block defaults to zero. PvP crit resistance and block penetration subtract percentage points.

## Expected damage

Source: inferred · Confidence: medium · Status: experimental

Hit, crit and block are assumed independent. Five mutually exclusive event probabilities sum to one. Probability-weighted damage includes misses and blocked criticals. Blocked damage defaults to 10%.

## DPS / TTK

Source: inferred · Confidence: low · Status: experimental

Auto attack rate = attacksPerSecond × speed / 100. Burst counts floor(duration / interval) attacks. Sustained is expected damage / interval. TTK = HP / DPS; does not model regeneration, immunity, movement or resource exhaustion.

## Single skills / buffs

Source: experimental · Confidence: low · Status: experimental

API skill min/max attack is added to estimated attack, then target defense and modifiers. Skill levels without explicit level fields use array index + 1. API skill-awakening options are validated by weapon type and rarity, with an experimental 1 + awakening / 100 multiplier. No scaling, synergies, combo, conditional damage multipliers, resources or rotations. Buff flat/rate abilities are supported; duration and external caster stats are not.

## Recommendation / score

Source: experimental · Confidence: low · Status: experimental

Stages filter class, gender, level and rarity; score top 15 base-value candidates per slot. DPS score = estimated DPS. Balanced = DPS × sqrt(HP). Tank = HP × (1 + DEF / 1000). Budgets have no price data. Stat budget defaults to 2 points per level.

## Verification still needed

Collect in-game tests at several levels, weapon types and stat allocations with controlled buffs. Compare connected normal min/max, crit frequency, hit/miss counts, blocks, attack intervals and PvP reductions separately. Replace one isolated assumption at a time with independently tested research. Do not tune coefficients just to fit one screenshot.

The API has no standalone ability endpoint; Ability is an embedded schema on items, sets and skills. Weapons and armor are item categories; elemental upgrade coefficients are in upgradelevelbonus and monster resistances are on Monster. statAwake and skillAwake have distinct formats and are normalized separately. API skill level arrays may omit a level field; index + 1 is used. Unknown abilities are preserved in raw catalogs but only explicitly supported parameters enter calculations.

Gear compatibility uses class ancestry, API level and sex requirements. Piercing card slot type uses official English descriptions, with a conservative four-slot MVP cap. Raised-pet values are individual indices, not a complete tier-combination model. Point budget is configurable and defaults to 2 points/level; quest/stat rewards and rebirth systems are not included.
