# Element Attack, mastery, resistance and suit defense audit

2026-10-13 · Current main · existing production site · no preview.

## A. Attack calculation status

The canonical Attack equation is retained. Weapon upgrades scale weapon power; Attack percentages are summed and applied once before flat Attack. Armor set upgrade effects, intrinsic item rolls, fashion blessings, active items and buffs all enter the existing modifier pipeline. Integration tests verify a +3% change and a combined-source fixture with a configured intrinsic roll, upgraded weapon, armor set upgrade, flat Attack, fashion blessing, timed item and buff. Their contributions reach final sheet Attack and combat Attack exactly once.

## B. Element Attack bug and fix

Character Details previously created five fabricated stats from fireattack/waterattack/etc., which are not current API parameters. It now exposes one elementAttack value from the actual elementattack parameter, with the offensive weapon element resolved separately. An explicit weapon enchantment takes priority over the canonical item's inherent element.

The API records elementattack as a flat elemental-power value, although the requested Character Details presentation uses a percent label. It is not implemented as an extra generic percentage damage multiplier. Ordinary autos add it to the enchanted weapon's effective elemental level before the existing API relationship lookup. Physical skills add it once to the existing elemental flat damage term for enchanted weapons; inherently elemental weapons use their canonical item elemental flat term instead. Magic skills do not receive this physical elemental-power term. Weapon element upgrades are not added a second time.

The audit also removed an inconsistent early neutral return in the informational elementMultiplier helper: an unenchanted weapon may still face an elemental defender relationship. The actual generic auto pipeline already used that relationship. Inherent item elements now consistently select resistance for the helper and damage stage.

## C. Mastery calculation status

Character Details now exposes fireMastery, waterMastery, windMastery, electricityMastery and earthMastery, resolved through the existing canonical parameter families. These use rate abilities, matching the existing magic skill power calculation. No raw API abilities are mutated.

## D. All Elements Mastery behavior

allelementsmastery contributes once to every corresponding sheet mastery. A one-element spell with +10 All Elements Mastery gains 10% mastery power, not 50%. The existing magic formula remains unchanged and selects masteries by current API elementType. The reference sums applicable masteries for compound types; a fireearth fixture receives two applicable +10 contributions (20%), excluding Water Mastery. Infusion continues to use the enchanted weapon's applicable mastery.

## E. Resistance aggregation status

The five explicit resistance stats resolve their corresponding defense parameter plus the canonical allelementsdefense family. Rate amounts are percentage points, consistent with the audited reference's percentage stat lookup. Character-sheet resistance is not clamped at zero. A negative -14% remains visible and creates a 1.14 resistance damage factor. The final damage multiplier has a zero floor when resistance reaches/exceeds 100%, rather than turning damage negative.

## F. All Elements Defense behavior

All Elements Defense +10% contributes once to each of the five resistance stats. Fire Defense +5% plus All Elements Defense +10% produces Fire Resistance 15%. Source explanations list the individual and all-element effects separately without duplicating either.

## G. PvE resistance status

Monster resistFire/resistWater/resistWind/resistElectricity/resistEarth remain fractions from the synchronized API. Target explicitly documents this contract: 0.14 means 14%; -0.14 means -14%. A shared elementResistanceToMultiplier helper consumes fractions; resistancePercentToFraction is the explicit character-sheet boundary conversion. Regression fixtures confirm positive resistance reduces elemental damage and negative resistance increases it.

## H. PvP resistance bug and fix

opponentTarget previously copied HP, defense and other calculated stats but omitted elemental resistance. It now transfers all five calculated opponent resistances and divides percentage points by 100. These override stale manually configured Target resistance values when an opponentBuild is selected. Tests cover 14% to 0.14, negative -14% to -0.14, all five mappings, and actual PvP damage changes. No saved-build schema or database migration is required: Target already stores fractional resistances, and the change is a runtime projection.

## I. Suit element-defense behavior

Suit element and upgrade remain separate from resistance abilities. Character Details shows suit element, upgrade and the resolved standalone API elementDefense coefficient; at +10 the current row contains 8.95, displayed as coefficient 0.0895. This informational coefficient is not a Water/Fire/etc. resistance stat and is not the entire contextual relationship factor.

Generic physical auto attacks already use both offensive and defensive relationship factors from the existing elementFactors helper. The defender's suit element/upgrade selects the relationship against the attacking weapon; the level difference then selects the API row. Tests show a Fire +10 weapon changes damage against Water, Fire and Wind +10 suits, and changing suit upgrade changes the outcome. Suit selection alone does not add elemental resistance to the character sheet. An opponent build without a suit uses no defensive element rather than inheriting a stale manually selected Target element.

## J. Skill versus suit-element audit conclusion and order

The audited current Flyffulator reference calls its upgrade relationship routine for generic auto attacks. That routine initializes the defense factor used by auto defense. Magic and melee skill defense routines do not use that factor; skills instead use element resistance and the skill/weapon matching rule. Therefore no suit-upgrade relationship stage was added to skills based on assumption. Tests explicitly cover both magic and physical skills: suit element upgrades do not change their damage under this reference, while resistance does.

The modeled order is:

1. Generic auto: raw weapon power → elemental attack relationship → summed Attack rates → flat Attack → defense using the elemental defense relationship → elemental resistance → remaining hand/mode/damage stages.
2. Magic skill: skill power, magic power and applicable masteries → Attack/skill rates and flat Attack → magic defense → skill-element resistance → weapon/skill match → remaining hand/mode/damage stages.
3. Physical skill: skill power and Attack rates → physical defense → elemental flat term (weapon upgrade × 4 + elementattack, evaluated against weapon-element resistance) → skill-element resistance when the skill is elemental → weapon/skill match → remaining stages. This retains the reference's separate elemental flat-term evaluation and later skill resistance; it does not add elementattack twice.

Reference fidelity is estimated rather than independently calibrated to live game damage. The reference itself notes TODOs for additional special suit/inherent armor resistance calculations. Element stones/upcuts and unspecified special suit effects are not invented by this update.

Calculation Details now exposes weaponElement, weaponElementUpgrade, elementAttack, elementRelation, elementCoefficient, suitElement, suitElementUpgrade, suitDefenseApplied, elementDefenseCoefficient, targetResistance, resistanceMultiplier, afterResistance and weaponSkillMatchCoefficient, alongside the prior attack/defense stages. For skills, elementRelation describes skill versus weapon; for generic autos it describes weapon versus defender.

## K. Character Details and screenshot calibration

The ambiguous Elements panel is replaced by Element Offense and Element Defense. It shows one Element Attack, all five masteries and explicitly named resistance rows with percentage signs. Weapon and suit information are presented independently. Clicking calculated stats continues to show original modifier source names, including intrinsic Base Roll, buffs, sets and fashion.

Observed comparison aliases now accept Element Attack, element-specific Attack screenshot labels, all masteries, elemental Defense/Resistance names and Electric Resistance. The added schema-only reference fixture enumerates relevant character fields. No new complete matching elemental screenshot/build was supplied with this brief, so it deliberately has no invented observed totals. Existing supplied screenshots are not formula constants. Once observed values are entered into a matching build, each supported elemental field participates in the existing Observed versus Calculated comparison.

UI rendering is verified by component render tests. Interactive browser automation was unavailable in this environment; no manual browser interaction pass is claimed.

## L. Files changed

- lib/element-stats.ts: canonical elemental sheet values, offensive element resolution and suit information.
- combat/character.ts: elemental values, metadata and stat source mappings.
- combat/attack.ts: fractional opponent resistance projection, unified resistance usage and debug stages.
- combat/formulas/elements.ts: explicit resistance conversion/multiplier and weapon/skill match helper.
- lib/stat-parameters.ts; lib/model.ts: canonical parameter constants and Target unit documentation.
- components/CharacterDetails.tsx; components/DamageSummary.tsx: explicit elemental panels, percent formatting and string-valued calculation stages.
- lib/observed-stats.ts: screenshot comparison aliases.
- tests/element-stats.test.ts; tests/fixtures/element-character-details.json; scripts/test.mjs: new regression coverage.
- tests/combat-pipeline-parity.test.ts: existing PvP fixture now puts the intended Water Resistance on its actual opponent build, preserving the prior golden damage values.
- tests/combat.test.ts: informational element regression now checks the audited unenchanted defender relationship instead of the old helper's inconsistent neutral shortcut.
- docs/element-stats-audit.md: this report.

## M. Tests added

23 new cases cover the 17 requested areas, including five separate elemental spell regressions, compound mastery, combined Attack sources, explicit resistance units, negative PvE/PvP values, suit relationship comparisons, physical versus magic elemental-power applicability, UI percentage rendering, source explanations and calibration field mappings. Existing combat golden fixtures remain passing after the opponent fixture's resistance is represented on the correct source.

## N. npm test

318 passed, 0 failed.

## O. npm run typecheck

Passed with no TypeScript errors.

## P. npm run lint

Passed with 0 errors and the same 29 existing warnings; no new warnings.

## Q. npm run build

Passed across client, server and worker environments.

## Primary sources

- [Official Flyff Universe API](https://api.flyff.com/): raw parameters, monster resistance fields and upgradelevelbonus elementAttack/elementAttackStrong/elementDefense metadata.
- [Flyffulator damage reference](https://github.com/Frostiae/Flyffulator/blob/89116244b670930ac8633a99212b7f9727bb8c12/src/flyff/flyffdamagecalculator.js): generic auto relationship, skill defense, flat physical elemental term, resistance order, skill/weapon matching and applicable compound masteries.
- [Flyffulator entity reference](https://github.com/Frostiae/Flyffulator/blob/89116244b670930ac8633a99212b7f9727bb8c12/src/flyff/flyffentity.js#L972): monster fractional resistance and player percentage stat conversion.

Reference behavior was independently implemented; no GPL source was copied into NAOL.
