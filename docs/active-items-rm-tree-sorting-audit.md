# Active Items, RM Buffs, Skill Tree and Sorting Audit

## A–D. Active Items and official cache

Data version 37: 425 eligible active-effect items, projected payload 157010 bytes (13321 bytes gzipped in the fixture). This is a compact consumable projection, not the full raw item database. The browser reads the Supabase-backed NAOL API and class catalog; `/api/data?activeItems=1` also returns the dedicated projection.

Eligibility requires an active record, consumable=true and numeric persistent abilities. Positive duration establishes a timed effect. The audited category=buff records with missing duration are also eligible when they contain persistent numeric abilities; category alone never qualifies an item. Explicit duration zero, inactive entries, packs without abilities and instant hp/mp/fp effects are excluded. Durations absent from the API are shown as unknown. No flask names or descriptions are parsed to calculate stats.

Selected item references persist in schema-3 build_data, defaulting to [] for old saves. A single active-item source in the existing modifier pipeline honors flat/rate/set and PvE/PvP flags, real level/class/sex requirements, and deduplicates IDs. No countdown, consumption or universal stacking rule is invented. Trigger metadata is retained as informational prerequisite evidence; it does not establish a universal stacking exclusion.

Current eligible flask records:

| Name | ID | API duration (seconds) | API abilities |
|---|---:|---|---|
| Flask of the Rabbit | 1766 | Not specified | dex +20 |
| Flask of the Tiger | 2265 | Not specified | str +20 |
| Flask of Stone | 4278 | Not specified | def +200 |
| Champion's Bounty Flask (30 Days) | 10918 | 2592000 | allstats +10; speed +10%; attack +10%; def +10% |
| Flask of the Lion | 5080 | Not specified | sta +20 |
| Adventurer's Fortune Flask (15 Days) | 5771 | 1296000 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| Flask of the Fox | 9403 | Not specified | int +20 |
| Adventurer's Fortune Flask (30 Days) | 10623 | 2592000 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| Champion's Bounty Flask (3 Days) | 10999 | 259200 | allstats +10; speed +10%; attack +10%; def +10% |
| Champion's Bounty Flask (7 Days) | 12278 | 604800 | allstats +10; speed +10%; attack +10%; def +10% |
| Champion's Bounty Flask (15 Days) | 14814 | 1296000 | allstats +10; speed +10%; attack +10%; def +10% |
| Adventurer's Fortune Flask (3 Days) | 16050 | 259200 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| Adventurer's Fortune Flask (7 Days) | 17963 | 604800 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| [Event] Champion's Bounty Flask (15 Days) | 20077 | 1296000 | allstats +10; speed +10%; attack +10%; def +10% |
| [Event] Champion's Bounty Flask (7 Days) | 23676 | 604800 | allstats +10; speed +10%; attack +10%; def +10% |
| [Event] Adventurer's Fortune Flask (30 Days) | 31834 | 2592000 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| [Event] Adventurer's Fortune Flask (3 Days) | 38148 | 259200 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| [Event] Champion's Bounty Flask (3 Days) | 45582 | 259200 | allstats +10; speed +10%; attack +10%; def +10% |
| [Event] Champion's Bounty Flask (30 Days) | 53486 | 2592000 | allstats +10; speed +10%; attack +10%; def +10% |
| [Event] Adventurer's Fortune Flask (15 Days) | 58699 | 1296000 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |
| [Event] Adventurer's Fortune Flask (7 Days) | 59048 | 604800 | exprate +100%; droprate +100%; pvedamage +15%; def +10% |

## E–F. Exact current RM preset

Ringmaster is discovered by class name and its parent lineage, without a numeric class-ID allowlist. The semantic classifier requires positive numeric lasting abilities, an external target and no passive/debuff/attack/heal/cleanse semantics. Self-only Prevention, instant heals, Resurrection, Gvur Tialla and offensive skills are excluded. Each selected rank is the maximum actual API level. Applying the preset is idempotent; the obvious Remove RM Buffs toggle removes only preset IDs, and unrelated manual external buffs remain.

| Skill | ID | Max level | Target | API abilities at max level |
|---|---:|---:|---|---|
| Accuracy | 6858 | 20 | single | hitrate +20% |
| Beef Up | 690 | 20 | single | str +20 |
| Cannon Ball | 1029 | 20 | single | dex +20 |
| Cat's Reflex | 3721 | 20 | single | block +10% |
| Geburah Tiphreth | 6845 | 10 | party | attack +10%; attackspeed +15%; decreasedcastingtime +10% |
| Haste | 9852 | 20 | single | attackspeed +15%; decreasedcastingtime +10% |
| Heap Up | 7661 | 20 | single | sta +20 |
| Holyguard | 39 | 10 | single | criticalresist +100% |
| Mental Sign | 1129 | 20 | single | int +20 |
| Patience | 2678 | 20 | single | maxhp +10% |
| Protect | 579 | 10 | single | magicdefense +10%; def +10% |
| Quick Step | 3964 | 20 | single | speed +20% |
| Spirit Fortune | 9047 | 10 | single | damage +150 |
| Stonehand | 3494 | 20 | single | skillchance +12% (PvE); skillchance +6% (PvP) |

External caster INT and duration scaling are not invented; static max-rank API abilities feed the existing external-buff pipeline. Conditional proc behavior such as Stonehand is retained as API evidence without adding a new stun simulator.

## G–I. Preserved fields, tree UI and sorting

The shared normalizer used by local import and sync preserves treePosition, requirements ({skill,level}), skillPoints and masterVariations. GameClass retains tree/icon/parent, and Item projections retain consumable, duration, durationRealTime, cooldown, casting, triggerSkill and abilities. Current fixtures include 531 positioned skills, 468 skills with prerequisites, and 77 with master variations. Existing raw cache metadata is restored without a full network resync.

Class progression comes from real parents. Each class tab shows its exact-class skills; official positions are scaled for readable HTML controls, and arrows are drawn only between recorded prerequisites with known positions. Passive and Master Variation areas remain available. The detail panel shows rank controls, MAX, job/weapon/level requirements, prerequisite review, costs/times/effects and Use for Simulation. Existing b.skills semantics stay one active damage skill plus passives; unselected preview ranks are local UI state, and no prerequisites are auto-learned or declared satisfied. Composite weapon rules still control unavailable states and the simulator. Mobile stacks the detail panel below the tree; tabs support keyboard navigation.

lib/catalog-sort.ts uses case-insensitive numeric Intl.Collator. Jewel/rune families sort alphabetically, then structured item.tier and natural numeric name fallback; this affects display only. Bonus skills sort by resolved skill name, parameters by display labels and values numerically. getPiercingCards returns compatible cards in natural name/grade order. Sorting operates on copies; eligibility and once-only Rune restrictions are retained.

## J–K. Files and migrations

- Models and persistence: lib/model.ts, lib/persistence.ts, lib/catalog-items.ts; active fields default in createBuild and old parsing.
- Active effects: lib/active-items.ts, lib/stat-modifiers.ts, combat/character.ts, components/ActiveItemsEditor.tsx and BuffsEditor.tsx.
- RM and tree: lib/ringmaster-buffs.ts, lib/skill-tree.ts, components/SkillTreeEditor.tsx, SkillsEditor.tsx and app/globals.css.
- Sorting: lib/catalog-sort.ts, lib/equipment.ts, BonusAwakeningEditor.tsx and ItemUpgradePanel.tsx. lib/skill-awake.ts eligibility was audited and retained unchanged.
- API/cache: lib/repositories/flyff.ts, app/api/data/route.ts, sync-flyff/index.ts, _shared/flyff-normalize.ts, scripts/import-flyff.mjs and data snapshot/export helpers. Laboratory and Controls continue routing the same tabs and using the existing numeric controls; no unrelated rebuild was needed.
- Current fixtures: data/class.json, skill.json, active-items.json and instant-items.json.
- Migration 202610130003_active_items.sql adds optional/defaulted schema-3 active item references, including opponents. Read-only production checks verify old/new/invalid save payloads.
- Migration 202610130004_skill_tree_metadata.sql restores discarded metadata from the authoritative raw generation. The sync Edge Function now uses the shared preserving normalizer.

## L–O. Validation and limits

25 new regression cases in tests/active-buffs-tree-sort.test.ts cover current active/instant items, modifiers/derived STR/STA/HP, rates/set/mode flags, restricted/unknown/duplicate IDs, old/new/opponent persistence, compact projections, exact RM eligibility/max/idempotence, both lineage examples, API metadata/arrows/master relations, selection/weapon/combat behavior, natural sorting and actual rendered Buffs/Tree/Bonus/Ultimate controls.

| Check | Result |
|---|---|
| npm test | 264 passed, including prior combat/equipment/Ultimate/Bonus/pet tests |
| npm run typecheck | Passed |
| npm run lint | Zero errors; 29 existing warnings |
| npm run build | Passed |

Browser automation failed to initialize because its kernel asset path was unavailable. Manual click-through and mobile visual inspection were not completed. Rendered UI, pure action/engine tests and live production API/schema checks are the available verification; this report does not claim Flyffulator parity. Deployment updates the existing production Site only, with no second Site or preview. Existing save-only POST behavior and cloud/shared-build permissions are retained.
