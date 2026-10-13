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

Weapon-family-specific offsets, class autoAttackFactors and level factors produce a min/max range. Bow also uses STR. API upgrade coefficients and the upgrade-level power term are applied once per hand. Target-effective defense is calculated for physical auto, skill, wand and magic contexts; nonlinear attack/defense interpolation replaces direct subtraction. Character sheet defense remains a separately labeled estimate.

## Hit probability

Source: experimental · Confidence: low · Status: experimental

Hit is based on attacker rating / (rating + defender parry), with separate player→monster, monster→player and PvP level factors. Final hit probability is bounded to 20–96%. Player parry starts at floor(DEX / 2) plus bonuses. Legacy calibration fields remain loadable but no longer drive production hit calculations.

## Critical / attack speed / block

Source: inferred · Confidence: low · Status: experimental

Crit uses final DEX and class critical. Target Critical Resist scales that chance. Critical multipliers have context-dependent ranges sampled by Monte Carlo and averaged analytically. Attack speed uses class speed, API weapon attackSpeedValue, DEX, level, a nonlinear conversion and discrete progression, followed by attack speed/rate bonuses. Display is internal speed × 50. Sheet block and target-effective block are distinct; effective block includes DEX/level/class, attack family, rank, discrete outcome bounds and multiplicative penetration. Game timing/calibration fixtures are still required.

## Element modifier

Source: experimental · Confidence: low · Status: experimental

A centralized none/same/weak/strong relationship matrix uses API elementAttack, elementAttackStrong and elementDefense upgrade rows. Skills use their element, mastery families, target resistance and weapon/skill matching. Infusion only changes element when explicitly configured active. Legacy elementScale is retained for saved-build compatibility and does not drive production formulas.

## PvE / PvP / bosses

Source: experimental · Confidence: low · Status: experimental

Flat PvE damage is separated from percentage PvE damage. Mode bonuses, boss bonuses, incoming damage and reduction stages remain distinct. PvP uses the reference 0.6 attack factor and the current official 50% reduction cap. PvE level-gap penalties apply at +2 through +15 and do not apply in PvP. Boss ranks beyond the reference giant rank retain NAOL's estimated boss/worldboss classification pending fixtures.

## Expected damage

Source: inferred · Confidence: medium · Status: experimental

Hit, crit and block are assumed independent. Mutually exclusive probabilities sum to one. Player-defender blocked damage uses 20% in PvE and 30% in PvP; monster blocked damage uses 20%. Context critical ranges and the same deterministic attack event cycle are used by both expected and sampled results.

## DPS / TTK

Source: inferred · Confidence: low · Status: experimental

Auto attack interval uses the converted internal attack speed. Dual wield follows main/off/main/both events, with offhand factor 0.75 + lefthanddamage / 100. Expected damage averages a complete cycle. TTK = HP / DPS; exact animation cadence, regeneration, immunity, movement and resource exhaustion still require controlled timing fixtures.

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

Each hand has an independent base attack range, normal upgrade and offensive element. All applicable equipment abilities feed character stats. `lefthanddamage` changes only the left-hand attack contribution. Primary auto-attack metrics use the independently implemented main/off/main/both event cycle. Legacy leftHandFrequency and leftHandMultiplier fields remain loadable but do not control the production cycle. Exact Blade/Slayer animation timing still needs calibration. Single skills use the main hand. Monte Carlo and deterministic expected damage share the event sequence.

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

## Additional Equipment Stat

`/statawake` supplies naturally occurring combinations and minimum item levels. Weapon and armor eligibility excludes shields until a current authoritative rule confirms them. Dropped and unknown sources reference canonical API entries; Stat Scroll mode replaces the previous result with one STR/STA/DEX/INT line of +1 through +4. Additional Stat, Weapon Bonus, Ultimate bonuses, jewels/runes, and Fashion Blessings remain independent sources. Legacy `awake` indices remain readable and migrate to source `unknown` when synchronized data is available.

## FLYFFULATOR PARITY REVIEW

Reference repository: https://github.com/Frostiae/Flyffulator . Pinned commit: `89116244b670930ac8633a99212b7f9727bb8c12`. Audited 2026-10-13. Equations were independently implemented in NAOL TypeScript; no GPL source files/functions were copied. The detailed mapping, current-rule conflicts and remaining calibration work are in `docs/flyffulator-calculation-audit.md`. A reference algorithm alone is labeled Estimated, not Verified Official or Reference-Validated.

Current Ultimate evidence: [Muran’s Awakening](https://universe.flyff.com/news/muransawakeningexpansion) specifies one jewel slot per upgrade, and the [February 5 patch](https://universe.flyff.com/news/patchnote020526) confirms Curtana’s ten slots. The reference’s seven-slot family behavior conflicts with the broad current official statement; NAOL retains official one-per-upgrade behavior and documents the discrepancy rather than silently importing that exception. The [August 11 patch](https://universe.flyff.com/index.php/news/patchnote081126) sets the current maximum PvP damage reduction to 50%.

## Final character stat engine

Every modifier is normalized before calculation with a canonical parameter, raw API parameter, value, operation (`flat`, `rate`, or `set`), source type, source identity, equipment slot, applicability, and confidence. Legacy `bossdamage` and `attributeattack` inputs remain readable, while calculations use the API names `bossmonsterdamage` and `attribute`.

Primary stats retain base, allocated, equipment, upgrade, accessory, awakening, piercing, Ultimate, fashion, pet, skill, buff, manual, and residual formula buckets. Negative values are preserved. Final stat details expose formula IDs, source rows, and confidence. Official class HP/MP/FP expression inputs are marked verified; their combined stacking order and combat outputs remain estimated where the game does not publish an authoritative formula.

Displayed Speed and Action Speed use a 100% baseline plus their bonuses. Attack Speed remains the separate class/DEX combat rate and is capped by the existing model. Block starts once from the class DEX coefficient plus generic block; melee, ranged, and PvP block then add their own API parameters independently.

Observed screenshot values never replace calculated values. The UI shows observed, calculated, absolute difference, percentage difference, and possible missing sources. Calibration fixtures are class-scoped and never mutate defaults globally. Ultimate accessory rolls remain unsupported until authoritative API tables exist and therefore do not enter totals.

## Suit Element Resistance and Element Defense (2026-10-13)

**Element Resistance — estimated, reference-backed:** ability-derived `firedefense`, `waterdefense`, `winddefense`, `electricitydefense`, `earthdefense` and `allelementsdefense` remain percentage points. The suit additionally supplies +2 × element upgrade level against its strong element and −2 × level against its weak element. One registry in `lib/elements.ts` serves both sheet and combat relationships. All-elements abilities enter once; negative totals remain negative. The suit adjustment is added only to the sheet projection, never to the shared Ability[] list. An opponent build projects these totals to target fractions by dividing by 100. Thus suit upgrades can affect skill damage through resistance even though the auto-attack coefficient stage is not applied to skills.

**Suit Element Defense — separate combat data:** `upgradelevelbonus.elementDefense` remains consumed by the existing relationship calculation in `elementFactors`; no additional ability is injected. Current official +7 row is 6.42, represented as fraction 0.0642 in `combatDefenseCoefficient`, and displayed as 6.42% with an explicit combat label. The contextual combat factor depends on both sides' elements/upgrades and is not necessarily the raw +7 value.

**Character-window Element Defense — unsupported display formula:** the reported Fire +7 observation is 5%, preserved in `tests/fixtures/suit-element-calibration.json`. Neither the current API, official display-separation patch note nor inspected reference establishes the transformation to 5%. The UI therefore says Unavailable / Calibration required. We do not round 6.42 into an invented game display or map an observed Fire Defense label to Fire Resistance.

Sources: [official upgrade rows](https://api.flyff.com/upgradelevelbonus), [official display-separation note](https://universe.flyff.com/news/minorfixesoct232025), [reference suit adjustment](https://github.com/Frostiae/Flyffulator/blob/89116244b670930ac8633a99212b7f9727bb8c12/src/flyff/flyffentity.js#L1524). The reference was audited, not copied. This section supersedes the earlier audit's omission of suit sheet resistance and its resulting claim that suit upgrade levels cannot affect skill damage.

