# PvE auto-attack throughput audit — 2026-10-14

Reference: build `d3e81801-598d-4db9-95b3-7503eaaf2869`, level 190 Crackshooter, Dragon's Rain, target monster **49835**. The public saved payload currently says PvP; the quoted output reproduces exactly after selecting PvE, without modifying the saved build. Source data is production catalog version 37.

## Reproduction and explanation

| Metric | Before | After |
|---|---:|---:|
| Displayed Attack Speed | 100% | 100% |
| Estimated base cycle steps/sec | 2 | 2 |
| Expected arrows/step | 1 | 1.4 |
| Attempted damage events/sec | 2 | 2.8 |
| Effective hit probability | 96% | 96% |
| Effective hits/sec | 1.92 | 2.688 |
| Sustained damage per connected arrow | 141,236.64 | 141,236.64 |
| Sustained DPS | 271,174.3488 | 379,644.08832 |

The displayed connected snapshot is **162,421.44**, and the critical snapshot is **169,189**. These include Dragon's Rain's full-health Muran's Wrath (+15%). Sustained DPS deliberately excludes full-health/lower-health effects until health progression is modeled. Dividing DPS by the opening hit therefore does **not** recover the attack cadence.

The exact factorization is:

`141,236.64 × 2 cycle steps/sec × 1.4 arrows/step × .96 = 379,644.08832 DPS`

Connected event damage already includes critical chance/range, block probability/damage, defense, elemental relationship/resistance, level gap, auto-attack bonus and applicable PvE/target modifiers. Multiplying these modifiers or hit probability again would double count them.

## Implemented model

- `combat/formulas/cadence.ts` separates cycle timing, attempted damage events and effective connected hits. The combat result and computed performance metric registry expose both hit frequencies. They are visible in the performance dashboard and Damage Lab with fractional precision.
- The default cycle interval retains the existing internal-speed conversion, explicitly labeled **uncalibrated**. This scalar is not proof of client animation duration. No invented class/weapon timing constants are supplied.
- Optional measured **cycle steps/sec** replaces default timing for the engine API or session-only Damage Lab calculator. Count primary cycle steps including misses, excluding proc arrows. Measurement already includes actual animation/Action Speed, so no additional speed multiplier is applied. This input is not persisted, sent to the build API, or used by the optimizer; dashboard/optimizer use the default model.
- Barrage (authoritative skill family **24775**) adds its selected mode-specific double-arrow expectation for usable bow autos only. Level 5 API chance is 40% PvE / 10% PvP. Estimated semantics: one equal-damage extra arrow, no recursive proc and no additional animation delay. This is a disclosed approximation, not measured proc parity. Generic multistrike and other proc families are not automatically given these semantics.
- The primary-event histogram continues to sample normal/critical/block/miss outcomes. Extra arrows contribute to analytical throughput only. It is not a simulation of timed proc sequences or a complete boss fight.
- Simultaneous off-hand damage is already included in its dual-wield cycle step. It does not receive another hand-count frequency multiplier.
- Boss bonus now uses the same boss-oriented rank policy as the selector (`giant`, `boss`, `super`, `worldboss`) in both diagnostic and applied stages. This is an estimated policy; the pinned reference only tests `giant`. Monster IDs and stats are unchanged. The reference build has **0 boss damage bonus**, so this correction does not explain its gap.

## Remaining evidence gaps

The updated result is **not claimed to reproduce 1–2M DPS**. Class/weapon animation cadence, distance/Marked Prey conditions, charged attacks, all trigger families, health progression, movement uptime and timed buff expiration are not fully modeled. Active unsupported positional/proc modifiers are identified beside the equation. Crit and block remain independent analytical outcomes. TTK assumes constant sustained DPS and uninterrupted attacks.

Swift Hands (+30% Action Speed) and fashion Action Speed (+10%) produce a sheet value of 140. Swift Hands' API description refers specifically to non-magical skills; that description does not justify multiplying normal bow attack frequency by 1.4. Action Speed is retained on the sheet; automatic cadence scaling remains unverified.

## Evidence

- [Official developer Q&A, October–November 2022](https://cdn-universe.flyff.com/site/qna_11_2022.pdf): classes have different auto-attack animation timings. Displayed speed alone does not establish hits/sec.
- [Official Barrage record](https://api.flyff.com/skill/24775): normal attacks may fire double arrows; selected levels supply mode-specific chances.
- [Official Swift Hands record](https://api.flyff.com/skill/24547): Action Speed for non-magical skills.
- [Official expansion 1.5.5 notes](https://universe.flyff.com/index.php/news/muransawakeningexpansionv155): Barrage PvE multistrike was increased to 5–40%.
- [Pinned Flyffulator reference](https://github.com/Frostiae/Flyffulator/tree/89116244b670930ac8633a99212b7f9727bb8c12): inspected independently; does not provide a verified current class-specific DPS cadence table or Barrage auto proc simulator. No implementation was copied.

Regression fixtures preserve the public build and only the item overrides needed to reproduce production damage. Tests cover original output, Barrage mode/eligibility, exact throughput identity, zero hit probability, measured cadence validation, unchanged per-event damage, skill timing, boss policy, UI precision and metric exposure.
