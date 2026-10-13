# Character Element Defense audit — 2026-10-13

## Existing implementation and root cause

Element resistance and contextual combat defense already have calculations. The separate Character-window Element Defense has no verified formula or mapped effect ID in the available sources. Previously only the suit information carried an unsupported display placeholder; Character Details had no independent five-element defense outputs or Data Health diagnostic. A missing verified formula, rather than a demonstrated omitted +5 modifier, remains the blocker.

## Existing Element Resistance implementation

Known `firedefense`, `waterdefense`, `winddefense`, `earthdefense`, `electricitydefense` and `allelementsdefense` abilities feed percentage-point resistance. The suit adds ±2 × upgrade level using the shared strong/weak relationship registry. These inputs continue unchanged. They are not treated as unsupported Character Defense IDs.

## Confirmed behavior and reference build

The [provided build](https://naol-builder.lokwensio.com/build/d8b91a09-ba82-4b7e-99b3-adbfcd5eb0f1), read through its shared-build API, is a level-189 Arcanist with suit item 45802, normal upgrade +8 and Fire element +7. It contains no recorded observed Element Defense value. The sanitized configuration fixture demonstrates Water Resistance −14%, Wind Resistance +14% and a separate raw combat upgrade fraction 0.0642. The previous user-reported Fire +7 → 5% calibration observation remains intact in the original suit fixture; it is not evidence of a general formula by itself.

## Located data sources and relevant identifiers

- Current official `/upgradelevelbonus` endpoint: +7 `elementDefense` is 6.42, consumed as a combat coefficient, not Character-window Defense.
- [Official October 23, 2025 note](https://universe.flyff.com/news/minorfixesoct232025): display separates resistance and defense; no numerical Character-window equation is supplied.
- Pinned [Flyffulator entity](https://github.com/Frostiae/Flyffulator/blob/89116244b670930ac8633a99212b7f9727bb8c12/src/flyff/flyffentity.js) and [damage calculator](https://github.com/Frostiae/Flyffulator/blob/89116244b670930ac8633a99212b7f9727bb8c12/src/flyff/flyffdamagecalculator.js): suit relationship resistance and combat upgrade defense are separate. No inspected Character-window display transformation establishes the reported 5%.
- Repository class, item, skill, set, awakening, upgrade and raised-pet data were recursively searched for elemental-defense/resistance parameters. Located defense-named ability IDs are the six resistance IDs above, across item/skill payloads. Weapon, cloak, fashion, accessories and temporary items remain part of the same item/effect inventory. No additional Character Defense ID or job-specific formula was identified.

## Character Element Defense source and formula/table

**Confirmed:** the official combat upgrade field and the separate display distinction.

**Reference-backed:** suit strong/weak resistance ±2 per element level.

**Unknown:** the source(s) and exact Character-window Element Defense formula. It is not proven to originate exclusively from suit element level, normal armor upgrade, class, equipment, skills or a combination. No formula or lookup table is implemented for the reported 5%. No per-job or screenshot-specific rule is introduced.

## Models, calculation and UI changes

`CharacterElementDefenseValues` represents fire/water/wind/electricity/earth independently as nullable values. `calculateCharacterElementDefense(build, data)` is a pure extension point with full character/effect context, an unsupported status, reason and invalid-input diagnostics. The central character engine exposes five separate `*ElementDefense` values and explanation records. All remain null until verified mechanics are available. Unknown is not rendered as zero.

Character Details renders independent Fire/Water/Wind/Electricity/Earth Defense rows with unavailable/unsupported explanations. Existing resistance and combat coefficient displays remain separate. Existing observed `Fire Defense` aliases already point to the independent defense key and never overwrite resistance.

Data Health gains `character_element_defense_diagnostics`: missing formula, located resistance IDs, unmapped elemental effects, resistance source inventory and count of separate combat upgrade rows. Known resistance effects are excluded from missing-Defense warnings. No new game effect IDs or duplicate effect-support registry were invented.

## Skill details UI

The advanced tree starts without an inspected skill or reserved detail column. Clicking a card toggles its detail panel; × and mouse/keyboard class-tab changes close it. Mobile has one column even when details are open. Existing simulation, self-buff and passive actions and formulas are unchanged.

## Files changed

New `lib/character-element-defense.ts`, `components/ElementDefenseHealth.tsx`, `tests/character-element-defense.test.ts`, reference configuration fixture and this document. Updated `combat/character.ts`, `components/CharacterDetails.tsx`, `components/DataHealth.tsx`, `app/api/sync/route.ts`, `components/SkillTreeEditor.tsx`, `app/globals.css`, test runner and the existing tree-render test. No saved-build schema or database migration is required.

## Tests and remaining gaps

Regressions cover the linked Fire +7 build, all five elements at +1/+7/+10, no suit, +0, invalid level/element, missing item, combined equipment/manual/passive resistance, unknown effects and initial tree layout. Numerical defense outputs are deliberately not asserted without verified evidence. Existing combat, equipment and resistance regressions continue to protect calculations.

Interactive click-through could not run because browser automation failed to initialize with a kernel-assets path error. Initial UI is tested by rendered components; toggle/close/tab handlers were reviewed. The missing Character-window formula remains explicitly unsupported. A verified table or reproducible controlled observations that isolate individual sources are needed before assigning a numerical defense value.

Validation: 401/401 tests passed; typecheck and production build passed. Lint passed with 0 errors and 26 existing warnings. Initial skill-tree rendering and the linked-build elemental outputs were verified in automated tests. The unknown formula is intentionally not claimed as implemented.

