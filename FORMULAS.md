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

Weapon attack × 2 + class autoAttackFactor × primary stat + level × 2, then weapon upgrade and attack abilities. Defense = armor + STA × class defense + level. Each hand contributes independently; attack-cycle timing remains an explicit estimate.

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

API skill min/max attack is added to estimated attack, then target defense and modifiers. Skill levels without explicit level fields use array index + 1. API skill-awakening options are validated by weapon type and rarity, with an experimental 1 + awakening / 100 multiplier. Support additive scaling and durations are implemented where supplied. General damage-skill scaling, conditional effects, synergies and rotations remain limited.

## Recommendation / score

Source: experimental · Confidence: low · Status: experimental

Stages filter class, gender, level and rarity; score top 15 base-value candidates per slot. Role scores now dispatch to Damage, Support, Tank and Hybrid normalization; see the schema-2 section. Budgets have no price data. Stat budget defaults to 2 points per level.

## Verification still needed

Collect in-game tests at several levels, weapon types and stat allocations with controlled buffs. Compare connected normal min/max, crit frequency, hit/miss counts, blocks, attack intervals and PvP reductions separately. Replace one isolated assumption at a time with independently tested research. Do not tune coefficients just to fit one screenshot.

The API has no standalone ability endpoint; Ability is an embedded schema on items, sets and skills. Weapons and armor are item categories; elemental upgrade coefficients are in upgradelevelbonus and monster resistances are on Monster. statAwake and skillAwake have distinct formats and are normalized separately. API skill level arrays may omit a level field; index + 1 is used. Unknown abilities are preserved in raw catalogs but only explicitly supported parameters enter calculations.

Gear compatibility uses class ancestry, API level and sex requirements. Piercing card slot type uses official English descriptions, with a conservative four-slot MVP cap. Raised-pet values are individual indices, not a complete tier-combination model. Point budget is configurable and defaults to 2 points/level; quest/stat rewards and rebirth systems are not included.

## Role and equipment revision (schema 2)

Published piercing capacity and separate card families are documented by the [official Flyff Universe developer note](https://cdn-universe.flyff.com/site/FlyffUniverse_Devnote_Piercing.pdf): five sockets for a one-hand weapon or shield, ten for two-hand weapons. Suit cards use a separate four-slot system as specified. The API lacks an item-level eligibility flag, so historical exceptions are marked unverified.

Class weapon/shield eligibility uses API category/subcategory/class/level/sex metadata and ancestry. Blade/Slayer dual-wield capability is a manually maintained class rule. Compatible shields can be selected through an explicit hand preference; no class gains dual wield just because it has a one-handed weapon. Armor normal upgrade caps and suit-only armor capabilities follow the supplied game rules.

Each hand has an independent base attack range, normal upgrade and offensive element. All applicable equipment abilities feed character stats. `lefthanddamage` changes only the left-hand attack contribution. Primary auto-attack metrics assume an alternating cycle with configurable leftHandFrequency (default 0.5) and leftHandMultiplier (default 1). This cycle is experimental, not a verified reproduction of Blade/Slayer attack timing. Single skills use the main hand. Monte Carlo samples the same hand mixture as deterministic expected damage.

Armor set upgrade = minimum normal upgrade of four valid pieces. Missing/incompatible/out-of-range pieces yield no upgrade-set bonus. API setAbilities are applied at that level. The original illustrative armor glow is independent of Suit element and follows the first normal-upgrade level that has API setAbilities. Suit elementDefense is shown as a coefficient; no unsupported defensive elemental equation is applied.

Heal uses a compatible API support skill's `hp` ability and supported additive `scalingParameters` (including INT and maximum caps). Outgoing `healing` and explicit ally incoming-healing percentages multiply that amount; their stacking order is labeled estimated. Caster incominghealing and hprestoration do not increase outgoing Heal. Cast time uses API casting multiplied by estimated cast reduction; cooldown, duration and MP cost are supplied by skill level data when available. MP cost reduction changes casts available from the full MP reserve. Regeneration is excluded because its base cadence/formula is not known. Unsupported multiplicative/part-dependent scaling and synergies produce warnings.

Outgoing buff values and duration use documented additive caster-stat scaling. Self-targeted effects are marked and basic API abilities apply to the caster; conditional activation/stacking remains unverified. Hymn parameters are retained and displayed, without inventing a rotation or conditional cooldown formula.

SupportScore includes no DPS or weapon-attack term. Its five normalized components are weighted by user-configurable weights: healing 30, buff power 25, cast speed 15, MP reserve 15, survivability 15. Normalization references are heuristic calibration points, not official ratings. Buff power aggregates parameters with different units and is explicitly heuristic. DamageScore uses normalized DPS; TankScore uses HP/reduction/defense durability; HybridScore equally blends DamageScore with SupportScore or TankScore depending on archetype.

## API jewelry and performance profiles

Jewelry remains in five independent canonical equipment slots to preserve schema 2 saves. `getAccessories` exposes a typed `EquippedAccessory` view with `upgradeLevel`; no duplicate mutable state is introduced. Requirements come from the selected `upgradeLevels` entry, including +0. Sparse or future upgrade tables are supported. Non-upgradeable jewelry falls back to item level. Selected abilities are complete snapshots, applied once; Demol's `damage` ability enters modeled attack. Set parts are a multiset: each valid equipped instance consumes one occurrence of its API item ID. Illegal normal gear is excluded from ability and set totals; invalid normal equipment withholds the Build Score. Theoretical builds keep configured gear and show their warnings.

Ultimate bonuses/jewels are optional per-slot persisted configuration. This snapshot exposes no authoritative accessory socket/roll table, so unverified imported rolls are preserved but not applied. The UI shows exact requirements, explicit highest-wearable repairs, locked future levels, role-aware sorting, and a Future Build optimizer. No production requirement table is maintained manually.

`performance/` owns 16 profile definitions, detection suggestions, priorities and metric confidence. Selected archetype/mode provide defaults. Manual focus, custom pins, action selection, target count and hybrid weights persist independently. Heuristic detection is qualitative and never overwrites manual focus. `visualization/` resolves original SVG actions independently of calculation. Reduced-motion preferences disable action animation.

Burst metrics are total expected damage in 3 or 5 seconds, not window DPS. Area skills report per-enemy and combined damage separately; configured uniform targets are capped by API `maxTargets` when supplied. Non-area attacks hit one target. Damage uses a single repeating action; additive API attack stat scaling and cast-time reduction are supported. Conditional scaling, synergy, multi-action rotations, resource exhaustion and exact animation timing remain experimental. MP reserve excludes undocumented regeneration and potion assumptions.

Tank results are target-specific experimental estimates. Incoming normal damage subtracts modeled defense and applies configured reduction. Critical/block weighting uses manual enemy critical characteristics and the configurable blocked multiplier. API target min/max attack is required; attack rate must be measured and explicitly entered. Missing data yields Unavailable. No universal verified effective HP or healer-sustainable claim is made; elemental defense, skills and berserk are excluded. Full PvP opponents are schema-validated builds with the same accessory rules.

Scores follow profile objectives: long-fight damage, weighted 3s/5s totals, combined area damage, configured support weights, or target survival (when timing is available). Hybrid objectives use configurable damage/support/tank weights. The support survival floor is the user's survival preference multiplied by 100 HP, a declared NAOL heuristic. Tank scoring falls back to the labeled durability heuristic when survival data is missing. NAOL Build Profile indicators and buff-effect indices are heuristic normalizations, never official ratings or fabricated party damage increases.

## Item capabilities and schema 3

`lib/item-rules.ts` resolves the upgrade model from API category, rarity, progressive levels and ultimateConvertible. No item-name upgrade parsing is used. Fixed jewelry has no upgrade state or control; normal levels are current bonus rows up to the documented +10 ceiling. Native Ultimate rarity selects Ultimate state, and convertible normal items permit an explicitly configured converted stage. Only one attack-upgrade bonus row is applied. Ultimate row indexing at 10 + Ultimate level remains an experimental mapping, not a verified combat formula.

Ultimate weapon sockets activate one per Ultimate level, capped at ten. Choices remain stored when inactive and their effects are excluded. Jewels come from actual ultimatejewel items, including minimumTargetItemLevel. Each variant's actual item ID and API abilities determine its effects; no tiers are invented from item names. Duplicate regular jewels model successfully attached gear with no random failures, following the official Muran's Awakening patch. Runes are centrally distinguished from jewels and once-only API descriptions impose the rune restriction. Base bonus slots and +6/+10 bonuses are separate; values must be in the weapon's possibleRandomStats ranges. Missing roll tables remain unavailable.

Equipability uses exact API required-class ancestry, sex, level and hand rules. Build compatibility adds archetype weapon preference and active skill weapon requirements. The Scepter of Disorder's Magician requirement is unchanged; an Arcanist can see it under All Equipable, while staff-required skill damage is unusable and zero. Quick Builder and optimizer filter compatible candidates before scoring. Skill mismatch remains unusable even in theoretical mode.

Schema 3 replaces generic upgrades with normalUpgrade, accessoryUpgrade or ultimateWeapon.ultimateUpgrade. Fixed-item legacy upgrades are discarded with a migration explanation; original equipment remains in migration metadata and browser backups. A generated compact seed item-rule index supports migration before class catalogs load; server migrations receive current synchronized data. Both version 1 and 2 saves migrate. Source references: https://api.flyff.com/ and https://universe.flyff.com/news/muransawakeningexpansion.
