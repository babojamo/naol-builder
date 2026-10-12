# NAOL final stat engine audit and parity implementation

## 1. CONFIRMED BUGS FIXED

- Canonical boss and attribute API parameters previously differed from the engine's names; legacy aliases now resolve centrally.
- Melee block could be counted twice, and ranged block did not share the intended foundation. Sheet and target-effective block are separate.
- Movement and Action Speed bonuses appeared as final values without the 100% display baseline.
- Primary-stat breakdowns lost origins, hid negatives, and could misattribute accessory/awakening contributions.
- Ordinary Additional Stats were offered for unrelated categories and were conflated with other bonus systems. Weapon/armor eligibility, source tracking, scroll validation, and once-only aggregation now have one implementation.
- AI matching relied on name similarity alone, and imported upgrades were written as normal upgrades for every item model. Candidate legality and canonical upgrade configuration now precede creation.
- Production schema validation did not understand the independent Additional Stat state. The schema-3 database validator now accepts it and observed stats while still rejecting unknown fields.
- The combat pipeline used linear defense subtraction, heuristic hit settings, subtractive critical resistance/penetration, and a generic hand mixture. Independent context formulas now replace these paths.
- Formula coefficients appeared in the player Stats Editor. Controls and cross-engine comparisons now live behind the authenticated admin dashboard.
- Generated test bundles were included in lint, exhausting the default Node heap. Lint now excludes generated `work/` output.

## 2. VERIFIED API-BASED MECHANICS

Class maxHP/maxMP/maxFP expressions and final-stat inputs; class ancestry, level and sex requirements; item min/max values; selected accessory upgrade snapshots; set membership; upgrade metadata; /statawake combinations and minimum item levels; allowed Weapon Bonus values; active Ultimate socket content and allowed random bonus ranges. Current official patch rules take priority over the reference. Combined combat equations and stacking confidence are separately labeled.

## 3. ESTIMATED MECHANICS

Family-specific weapon attack and upgrade power term, nonlinear attack/defense correction, context defense, attack-speed conversion and timing, parry/hit context, critical multiplier distribution, effective block conversion and discrete bounds, element relationships, PvE level-gap penalties, mode modifier order, skill-power conversion and the main/off/main/both cycle. These are independent TypeScript implementations informed by the pinned reference; they are not promoted to official or reference-validated confidence without independent game fixtures.

## 4. UNSUPPORTED / NEEDS GAME CALIBRATION

Conditional low-health and stack effects; Hymn conditional reduction/rotation state; damage offload recipient state; charged wand/bow attacks; party member-dependent effects; arbitrary item-specific skill triggers; multi-action rotations; exact animation cadence; separate parry-event classification; authoritative Ultimate accessory jewel/roll tables. Non-Templar one-handed Ultimate slot progression conflicts between the pinned reference and the broad current official one-slot-per-upgrade statement; the official progression is retained and the conflict is documented.

Required evidence: controlled buff-off/buff-on builds, complete equipment configurations, character-sheet screenshots, target identity/level, normal/critical/blocked damage samples, attack interval recordings, conditional health/stack state, and current socket screenshots for the affected weapon families. One screenshot never changes global coefficients.

## 5. CLASS-SPECIFIC AUDIT

| Class | Verified inputs / coverage | Estimated implementation | Missing game calibration |
| --- | --- | --- | --- |
| Templar | Class resources, ancestry, legal equipment and profiles | Sword attack, shield-aware defense/block and tank metrics | Conditional survival effects and target damage logs |
| Slayer | Blade ancestry, dual-wield eligibility, per-hand data | Explicit four-event cycle and offhand modifier | Recorded animation cycle and conditional triggers |
| Seraph | INT/MP, Heal and buff API inputs | Heal scaling, recipient/caster bonuses and support cadence | Hymn stack/rotation/conditional effects |
| Forcemaster | Knuckle inputs and class skill scaling | Physical skill/auto power | Nen/stack triggers and controlled damage logs |
| Arcanist | Staff restrictions, skill elements and master variation inputs | Compound mastery and explicitly active Infusion | Conditional spell triggers and damage logs |
| Mentalist | Wand/class INT factors and skill restrictions | Normal uncharged wand and magic defense contexts | Charged wand state and conditional skills |
| Crackshooter | Bow/class factors and legal branch | DEX plus additional STR weapon contribution | Charge/trap triggers and ranged timing |
| Harlequin | Yoyo/class factors and critical coefficient | Yoyo attack, ranged block context and critical distribution | Position/status conditions and timing |

All eight final branches have resource-growth, lineage, profile and legal-weapon filtering regression coverage. Calibration fixtures are class-scoped and preserve default coefficients.

## 6. AI IMPORT STATUS

Raw extraction is retained separately from canonical normalization. The Edge Function stores normalized drafts and clears unverified model-generated IDs. The UI filters item candidates by slot, class, level and selected sex, then asks for explicit item confirmation. Ordinary stat lines have an Additional Stat confirmation control and are validated against /statawake. Upgrades and Fashion Blessings use canonical configurations. Weapon Bonus, random Ultimate bonuses, jewels/runes and piercing names remain visible for manual confirmation where safe canonical identification is not available. Observed screenshots compare with calculated values and never replace them.

## 7. TEST RESULTS

Final validation: `npm test` passed 124/124; `npm run typecheck` passed; `npm run lint` passed with 0 errors and 38 warnings; `npm run build` passed. The suite includes independent numeric reference fixtures, Additional Stat validation/migration/aggregation tests, the eight-class matrix, existing equipment and persistence regressions, and deterministic/Monte Carlo consistency. Production database validation accepted Additional Stat and observed values while rejecting unknown fields, without inserting any build records. No preview website was created. Browser visual QA was not run; runtime compilation and engine/persistence checks were completed.

## 8. FILES CHANGED

- `lib/stat-parameters.ts`, `lib/stat-modifiers.ts`, `lib/catalog-index.ts`: canonical aliases, parameter families, source-aware aggregation and indexed catalog lookups. The successful full suite completed in about 20 seconds after indexing, compared with about 125 seconds before indexing on this checkout.
- `lib/additional-stat.ts`, `lib/model.ts`, `lib/persistence.ts`: independent Additional Stat state, eligibility, validation and legacy migration within schema 3.
- `lib/calibration.ts`, `lib/observed-stats.ts`: class-scoped fixtures and observation comparisons.
- `combat/formulas/*`: independently implemented speed, weapon attack, defense, hit, critical, block, elements, level/mode, skill-power and dual-wield functions.
- `combat/character.ts`, `attack.ts`, `support.ts`, `optimizer.ts`, `sources.ts`, `simulation.ts`, `simulation.worker.ts`, `simulation/tank.ts`: shared formula integration, safe source aggregation, documented confidence and background sampling.
- `components/AdditionalStatEditor.tsx`, `CharacterDetails.tsx`, `DeveloperEngineAudit.tsx`, `PassiveSkills.tsx`: item controls, visible final stats, explanations, admin comparisons and passive skills.
- Existing equipment, stats, performance, damage, skills, admin, AI import, account and storage components: wire the new state/UI and retain explicit saves and stable account hydration.
- `supabase/functions/analyze-character/index.ts`, `supabase/migrations/202610130001_additional_stat_schema.sql`: normalized AI extraction and production payload compatibility.
- `tests/stat-engine.test.ts`, `tests/flyffulator-parity.test.ts`, existing regression fixtures and `scripts/test.mjs`: numeric/behavior regressions and class coverage.
- `scripts/check-build-schema.ts`, `package.json`: read-only production schema verification and generated-output lint exclusion.
- `FORMULAS.md`, `IMPLEMENTATION.md`, `STAT_ENGINE_AUDIT.md`, `docs/flyffulator-calculation-audit.md`, this report: mechanic sources, decisions, current rule conflicts, validation and remaining calibration.
