# Composite skill weapon compatibility audit

## A. Root cause and correction

Validation and combat compared `Item.subcategory === Skill.weapon`, while Bonus Awakening separately recognized some groups. This made a valid Staff fail `wandorstaff` and caused the combat gate to return zero damage. `lib/skill-weapons.ts` now owns requirement resolution, labels, awakening group keys, equipment context and data audits. Raw synchronized API fields remain unchanged. Class ancestry, level, equipment and two-handed restrictions remain separate checks.

## B–D. Current synchronized requirement audit

The synchronized skill dataset and item vocabulary were scanned in full. Official API data version 37 and Fire Strike record 3974 were also checked directly. Sources: [official API](https://api.flyff.com/), [Fire Strike record](https://api.flyff.com/skill/3974).

| Requirement token | Resolved equipment / condition | Skills | Examples |
|---|---|---:|---|
| axe | Axe | 3 | Smite Axe, Axe Mastery, Master of Axe |
| bow | Bow | 40 | Silent Arrow, Ice Arrow, Auto Shot |
| enchantedweapon | Sword, Axe, Wand, Staff, Stick, Knuckle, Bow, Yoyo, with an elemental upgrade | 1 | Empower Weapon |
| knuckle | Knuckle | 92 | Bgvur Tialbold, Piercing Serpent, Temping Hole |
| shield | Equipped Shield; incompatible with a two-handed weapon | 13 | Protection, Shield Bash, Protective Tree Bark |
| staff | Staff | 94 | Meteo Shower, Stone Spear, Lightning Mastery |
| stick | Stick | 68 | Holyguard, Protect, Beef Up |
| sword | Sword | 3 | Blazing Sword, Sword Mastery, Master of Sword |
| wand | Wand | 55 | Crucio Spell, Maximum Crisis, Spirit Bomb |
| wandorstaff | Wand or Staff | 17 | Wind Cutter, Rock Crash, Ice Missile, Fire Strike |
| yoyo | Yoyo | 57 | Jester's Blast, Deadly Swing, Critical Swing |
| yoyoorbow | Yoyo or Bow | 3 | Perfect Block, Fast Walker, Dark Illusion |

All 12 current nonempty skill tokens resolve; none are unsupported. Empty/undefined weapon requirements impose no restriction. The actual weapon item vocabulary contains Sword, Axe, Wand, Staff, Stick, Knuckle, Bow and Yoyo. Shield is a separate equipment requirement, not a main-hand weapon subtype. Empower Weapon's API description describes elemental power, so its passive is treated as conditional on the configured elemental upgrade rather than as a literal subtype.

**Sword or Axe distinction:** `swordoraxe` exists in the current `/skillawake` groups. No current `data/skill.json` record has `weapon: 'swordoraxe'`; those group members, including Keenwheel and Bloody Strike, have no raw weapon requirement. The canonical registry supports Sword or Axe and tests actual awakening-table eligibility for Sword/Axe. No skill API record was fabricated or mutated to manufacture the requested current-data case.

## E–G. Regression results and affected jobs

- Arcanist inherits Magician Fire Strike through the existing lineage. Staff and Wand both pass weapon compatibility and full valid-build checks and produce positive skill damage.
- Both actual current Roika's Staff records (Unique and Ultimate) pass and produce positive Fire Strike damage. Fire Strike Bonus Awakening remains available, including AI normalization on both variants.
- Knuckle and Sword fail Fire Strike's weapon requirement; an unrelated Knight class still fails the inherited-skill rule even with a matching subtype. Staff-only skills still reject Wand.
- Mercenary/Knight/Blade descendants use the centralized Sword/Axe awakening group. Acrobat descendants correctly resolve Yoyo/Bow group skills. Assist/Ringmaster/Seraph support casting requires its configured Stick. Shield skills inspect the shield slot rather than comparing the main-hand subtype.
- Owned casting and passive modifiers respect weapon requirements. Externally received buffs retain their independent meaning and are not invalidated by the recipient's weapon. No skill scaling or damage formula was changed.
- Unknown future tokens produce Data Health warnings and explicit “unrecognized weapon requirement” diagnostics; they are not silently converted into arbitrary families or parsed by splitting “or”. Affected skill damage stays unavailable; unrelated skills and the app continue working. Object prototype keys are safely treated as unknown.

## H. Files and path audit

- Canonical rules: lib/skill-weapons.ts; lib/item-rules.ts delegates compatibility and issue formatting.
- Bonus Awakening and AI Bonus normalization: lib/skill-awake.ts uses centralized group keys and matching while retaining Ultimate rarity resolution and class/level eligibility.
- Damage/PvP/simulators: combat/attack.ts uses the existing skillUsable gate, shared equipment context, class ancestry and selected skill level. Damage formulas remain intact.
- Optimizer/Quick/Advanced weapon candidates: lib/equipment.ts delegates candidate matching to the shared rule. Existing combat/optimizer.ts scoring and recommendations consume that path; no duplicate parser was added.
- Support and conditional passive modifiers: combat/support.ts and lib/stat-modifiers.ts use the same equipment semantics. External received buffs remain separate.
- UI: components/SkillsEditor.tsx and PassiveSkills.tsx display formatted requirements and valid/inactive state. Database.tsx displays human-readable requirements and puts raw API JSON behind an explicit disclosure.
- Live data diagnostics: app/api/sync/route.ts returns a full audit of the current cached generation; components/DataHealth.tsx and SkillWeaponHealth.tsx display resolved/unknown tokens. Existing throttled read-only refresh behavior is retained; no extra sync write/focus-save behavior is added.
- Tests: tests/skill-weapons.test.ts and scripts/test.mjs. Two healing formula fixtures in tests/equipment-support.test.ts now equip a plain legal Stick; their original healing, MP and scaling assertions are retained.

## I–M. Verification

20 new regression cases cover grouped and simple requirements, Fire Strike with Staff/Wand/wrong weapons, inherited vs unrelated classes, both Roika variants, Sword/Axe awakening semantics, Yoyo/Bow, shield/element conditions, all current tokens, future unknown diagnostics, actual Bonus eligibility/AI normalization, candidate filtering, rendered Skills/Data Health UI, passive gating and external buffs.

| Command | Result |
|---|---|
| npm test | 239 tests passed, including existing combat/equipment/Ultimate/Bonus regressions |
| npm run typecheck | Passed |
| npm run lint | Zero errors; 29 existing warnings |
| npm run build | Passed |

Work remains on current local main, retaining preceding production changes. Fetched GitHub main is an ancestor. This update uses schema 3 without a database migration, data mutation or Edge Function change. Publication targets the existing production Site directly, with no preview Site. Interactive browser QA remains unavailable; rendered UI, engine tests and production route/diagnostic checks provide the recorded verification.
