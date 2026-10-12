# Calculation parity audit

Audited 2026-10-13. Reference: https://github.com/Frostiae/Flyffulator/tree/89116244b670930ac8633a99212b7f9727bb8c12 . GPL-3.0 source is inspected as a mechanics reference only; no source files or functions are transplanted into NAOL.

| Mechanic | Previous NAOL | Reference behavior | Current API inputs / official rule | Chosen implementation and confidence |
| --- | --- | --- | --- | --- |
| Resources | Restricted class expressions | Class coefficients, then flat and rate | Class maxHP/maxMP/maxFP expressions | Keep official expressions. Verified official inputs, estimated stacking |
| Movement | Bonus only | 100 baseline, speed percentage | speed | Baseline plus bonus; reference supported |
| Attack speed | Class + DEX/10 | Nonlinear base conversion and discrete progression, then flat/rate speed | class.attackSpeed, item.attackSpeedValue | Independent pure conversion; estimated until game timing fixtures |
| Weapon attack | Generic stat and level factors | Family-specific offsets and level factors; bow also STR | Class autoAttackFactors, item min/max, upgrade rows | Family-specific pure function; estimated until numeric game fixtures |
| Defense | Linear armor + STA | Attack-context-dependent defense | Class factors, armor defense, def | Separate sheet and effective values; estimated |
| Attack/defense | Direct subtraction | Square-root interpolation correction | Attack and defense inputs | Nonlinear pure function preserving signed result; estimated |
| Parry/hit | DEX/5 and calibration knobs | DEX/2; level context and rating/parry ratio, 20–96% | DEX, level, hitrate, monster parry | Context functions; estimated |
| Critical | Fixed multiplier; subtract resist | Resist scales chance; context multiplier range | critical, criticalchance/resist/damage | Shared analytical/sampled distribution; estimated |
| Block | Sheet value minus penetration | DEX/level/job; melee/ranged; giant adjustment; penetration factor; discrete outcome floor/cap | block families, class block, rank | Effective combat context separate from sheet; estimated |
| Elements | elementScale approximation | Relationship matrix and upgrade attack/strong/defense rows | Current upgradelevelbonus and elements | Pure relationship function; estimated |
| Level gap | None | PvE reduction from +2 through +15; no PvP reduction | Levels | Central reference table; estimated |
| Dual wield | 50% hand mixture | Four event cycle; offhand 0.75 + lefthanddamage | Class topology and per-hand equipment | Explicit cycle and per-event sampling; estimated. Reference worker bitwise flags require further game calibration |
| Skills | Weapon + min/max + additive scaling | Skill power, additionalSkillDamage, scaling, inherit and synergy | Skill levels/scaling/inherit, item additionalSkillDamage | API-driven stages; unsupported conditional mechanics remain labeled |
| Healing | API hp + caster scaling | Heal amount, scaling, caster healing, recipient incominghealing | hp/scalingParameters | Preserve caster/recipient distinction; estimated stacking |
| Ultimate | Current API capabilities | Some legacy family/item slot exceptions | Current patch notes outrank reference | Keep current NAOL rules pending explicit current slot verification |
| Action speed | Display ability | No proven cadence implementation | actionspeed | Display only; cadence unsupported |

Reference equations are not labeled official or reference-validated until independent game fixtures agree. Conditional low-HP, stack, party, Infusion and offload mechanics require explicit state; no active effect is inferred merely from class or equipment.

## Current rules and remaining calibration

Official [Muran's Awakening expansion](https://universe.flyff.com/news/muransawakeningexpansion) specifies a jewel slot for each upgrade. The [2026-02-05 patch](https://universe.flyff.com/news/patchnote020526) specifically confirms Curtana's ten slots. The pinned reference contains a seven-slot one-handed sword/axe rule, with a Templar sword exception; this conflicts with the broad current official progression statement. NAOL keeps the official progression until controlled non-Templar sword/axe fixtures resolve the conflict. It does not introduce a guessed item-name rule.

The [2026-08-11 official patch](https://universe.flyff.com/index.php/news/patchnote081126) establishes the current 50% PvP damage reduction cap. The [2026-02-26 patch](https://universe.flyff.com/index.php/news/patchnote022626) confirms master variations use maximum base skill scaling level.

The reference hit routine compares a raw percentage rating with a normalized failed-hit value. Its separate parry outcome classification needs validation; NAOL reports misses without inventing a distinct parry probability. Normal uncharged wand attacks are supported; charge state is unsupported. Action Speed is displayed and does not change cadence.

Validation still needed: controlled sheet + damage logs for all eight final jobs, buff-off/buff-on comparisons, fixed-target normal/crit/block ranges, attack interval recordings, non-Templar Ultimate sword/axe socket progression, conditional low-health and Hymn/offload states. Screenshots alone cannot verify target-effective damage or exact animation cadence.
