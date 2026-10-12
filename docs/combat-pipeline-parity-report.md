# Focused combat pipeline correction

Audited reference: Flyffulator commit `89116244b670930ac8633a99212b7f9727bb8c12`, particularly `computeAttack`, `getAttackMultiplier`, `applyDefense`, `getBaseSkillPower`, `getMagicSkillPower`, `applyElementDefense`, and the entity `getDefense`. Implemented independently; no GPL implementation files were copied.

## Corrected stages

- Weapon-family power and flat Damage remain inside the appropriate weapon/skill power equation. Attack uses `floor(power * (1 + (attack + skilldamage + thirdjobskilldamage)/100))`, then flat Attack and PvE flat damage. Sheet Attack also uses rate before flat.
- Skill damage rates no longer multiply post-defense damage independently. Magic Attack and element mastery have their own floors inside skill power. Skill awake/Weapon Bonus, uncharged wand power, auto damage, PvP factor, level penalty and off-hand factor are separate stages.
- Physical auto element relationships affect both incoming power and effective defense. Target element resistance runs after defense. Physical skill/wand element upgrade damage is a flat addition after defense, followed by resistance. Magic skill damage uses raw monster Magic Defense, not the physical skill `/7 + 1` reduction.
- Infusion resolves the effective element before selecting target resistance and mastery; a fire spell with a water weapon uses water resistance. A non-elemental spell stays non-elemental.
- Player magic defense uses class INT/STA factors and flat Magic Defense, then the **def** rate and PvP defense factor. The **magicdefense** rate separately reduces incoming magic-skill attack. Sheet Magic Defense remains its existing display calculation.
- Pinned reference normal wand attacks use MAGIC, route through melee-skill defense, and never call physical block. They also skip generic hit/miss. NAOL now uses hit 100%, block 0% and the 2.3 wand critical multiplier for uncharged attacks.
- Each hand receives its modifier once, then the main/off/main/both event aggregates hands. Mode rates, incoming rate, boss rate and reduction run with separate floors on that event aggregate. Simulation uses these same finalized event ranges rather than pre-mode hand values.

`calculationStages` exposes weapon range, base power, the three additive attack rates, rated/flat attack, incoming magic reduction, effective defense, post-defense range, post-element power, awake/auto/off-hand factors, level penalty, mode/incoming/boss/reduction rates and intermediate results, and final expectation. The existing debugger renders these numeric stages.

## Full pipeline fixtures

`tests/combat-pipeline-parity.test.ts` defines complete attacker/target/weapon/upgrade/abilities/skill/buff/mode state, using actual class and upgrade API rows plus deliberately controlled API-shaped weapon/skill values. Expected constants were derived independently from the pinned equations, not produced by NAOL helpers.

| Fixture | Normal event/cycle damage | Analytic expected damage | Key coverage |
|---|---:|---:|---|
| Physical monster auto | 819 | 500.9915232 | Attack order, speed, defense, level, hit, crit, block, mode/boss |
| Dual monster auto | 939.25 | 574.5820752 | Events 819 / 650 / 819 / 1469; off-hand 0.85 exactly once |
| Wand monster auto | 732 | 808.24 | Uncharged power, MAGIC defense, no miss/block, 2.3 critical |
| Physical PvP auto | 445 | 196.779674 | PvP defense/factor, critical range, block, mode/reduction |
| Physical skill | 448 | 448 | AdditionalSkillDamage, additive stat scaling, compatibility, awake |
| Magic PvE skill | 661 | 661 | Infusion, water resistance/mastery, magic/skill/third-job rates |
| Magic PvP skill | 146 | 146 | Incoming magic rate separate from class defense and def rate |
| Controlled inherited master | 1111 | 1111 | Parent formula index and inherited parent Weapon Bonus |
| Elemental physical auto | 722 | 441.7352352 | Strong element power/defense and post-defense resistance |

The synchronized skill catalog currently has inherited skills but no `masterVariations` arrays. The master test supplies a controlled parent/variation pair; it validates the implementation branch, not availability of a real production master variation.

These fixtures validate the stated ordering and numeric stages. **They do not establish full Flyffulator parity.** Autos retain an analytic range model: continuous sampling between finalized endpoints, average critical endpoints, independent crit/block probability, and block damage as a weighted multiplier rather than every reference random integer and its floor. Dual “both” events share that statistical approximation. Full combat stays Estimated; no global confidence was promoted.

Other remaining differences: charged/fourth wand attack behavior; contextual party/health/buff/debuff, reflection, offload and conditional skill multipliers; exact multi-hit/cast/stack timing; independent parry classification; special skills such as Asal/HoP; built-in item element and element-stone cases outside the configured gear fixtures; training target level scaling. Boss/worldboss rank bonuses retain NAOL's broader estimated handling; the reference restricts this bonus to giant. Existing Ultimate accessory uncertainties remain documented in the previous audit. No real-game calibration is claimed here.

## AI import and consumption

The strict model schema now has `additionalStat: {source, awakeIdCandidate, abilities: [{parameter,value}], confidence}`. Unknown/drop combinations match the complete unordered canonical `/statawake` entry and item level; the candidate ID is never trusted. Stat Scroll accepts exactly one primary stat line from +1 through +4. Legacy single-line saved analyses remain readable. The confirmation UI shows all lines and the extracted source.

Every nested field of the model response is checked against its strict schema before declaring success. Before that boundary, provider timeout/500/invalid result refund reserved usage. After it, usage remains consumed even if persistence fails. The function retries result recording and completion three times each without calling the model again; a durable `analysis_succeeded_at` marker protects against later refunds. Completion is idempotent. If persistence still fails, the response retains the analysis and reports a save warning; the client keeps a per-account tab cache and can restore recorded cloud drafts before completion bookkeeping succeeds.

Database integration verification in `scripts/check-ai-consumption.sql` checks consumption/refund/retry/role privileges in a transaction that rolls back all test writes. Unit tests inject provider failures and persistence errors and check single provider invocation and retained usage.

## Administration and deployment

The public schema migration no longer embeds an environment-specific administrator email. Existing production invites/admin grants are preserved. To bootstrap a new environment, set `NAOL_BOOTSTRAP_ADMIN_EMAIL` in the ignored `.env.migration` and explicitly run `node scripts/seed-admin.mjs <project-ref>`. The script provisions a service-side invitation; it does not bypass verification or grant browser access to administrative tables/functions. It never runs on ordinary application startup.

Production deployment includes `202610130002_ai_analysis_consumption.sql`, the `analyze-character` Edge Function and the updated Site. No preview website is created.

## Changed files

Combat: `combat/attack.ts`, `combat/character.ts`, `combat/simulation.ts`, `combat/formulas/attack-modifiers.ts`, `damage-stages.ts`, `elements.ts`, `skill-power.ts`.

AI/admin: `components/AICharacterImport.tsx`, `lib/additional-stat.ts`, `supabase/functions/analyze-character/index.ts`, `_shared/analysis-policy.ts`, migrations `202610120008_admin_bootstrap.sql` and `202610130002_ai_analysis_consumption.sql`, `scripts/seed-admin.mjs`, `scripts/check-ai-consumption.sql`.

Verification/reporting: `scripts/test.mjs`, `tests/combat-pipeline-parity.test.ts`, `tests/ai-import-policy.test.ts`, this report. Previous canonical modifiers, editor, fashion/weapon/Ultimate logic, formulas, observed/calculated comparison, administration and worker architecture are retained.

Validation: all 124 prior tests retained; 16 new tests (140 total). All 140 tests, typecheck, lint and the production build passed. The production rollback-only database integration check and Edge Function bundle syntax check also passed. Lint has the existing 38 warnings and zero errors.
