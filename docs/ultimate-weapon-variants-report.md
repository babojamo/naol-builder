# Ultimate weapon variants and Bonus Awakening

## Root cause and authoritative data

Bonus option lookup indexed the displayed item rarity directly. Current `/skillawake` contains **uncommon, rare and unique** pools, without an `ultimate` pool. Consequently, an actual Ultimate item returned no skill or parameter options even when the corresponding Unique weapon had valid results.

No Ultimate Skill-Awake table or numeric bonus values were added. Both option generators, `validWeaponBonus`, the Bonus Awakening editor, imported-bonus normalization and equipment validation now share `resolveBonusAwakeningRarityTier`.

Resolution order is exact API rarity first (including a future explicit Ultimate pool), then the linked base weapon's rarity, then the highest nonempty supplied known tier in explicit order: common → uncommon → rare → veryrare → unique. An explicitly empty exact pool stays empty. Fallback applies only to Ultimate weapons; ordinary items do not gain a higher rarity pool. Unknown tier names are not guessed.

## Variant resolution

`lib/item-variants.ts` resolves an Ultimate weapon's base through its typed dismantle target metadata. The target must be a known non-Ultimate weapon of the same subtype; ambiguous or incompletely loaded targets are left unresolved. The reverse relation prefers authoritative dismantle links. Only when authoritative metadata is unavailable does the helper consider an exact category/subtype/class/level/base-name/min-attack/max-attack/two-handed signature, and only an unambiguous match is accepted. Relations are cached per immutable catalog array; a newly synchronized catalog gets a fresh cache.

Current-data regressions confirm:

| Weapon | Unique item | Ultimate item | Result |
|---|---:|---:|---|
| Conch Staff | 14000 | 15914 | Ultimate dismantles to 14000. Eligible Arcanist Electric Shock options match the supplied Unique Staff pool. Ultimate random-stat configuration reads item 15914's own `possibleRandomStats`. |
| Song of Sirens | 16918 | 11124 | Ultimate dismantles to 16918. Eligible Seraph Stick skills and Healing values match the supplied Unique pools. |

These pairs remain independently selectable API items. Picker badges distinguish UNIQUE / Convertible to Ultimate and ULTIMATE; canonical API names are unchanged.

## Conversion and legacy saves

Configure Ultimate Weapon now selects the actual counterpart ID when safely resolved, starts Ultimate at +0, initializes its Ultimate configuration and removes normal/legacy upgrade fields. Element, element upgrade, piercings, Additional Stat, Weapon Bonus, legacy Skill Awake and other configured gear properties survive. The original gear object is not mutated.

Schema-3 and older saves containing a convertible Unique item ID plus Ultimate configuration normalize when parsed **with a loaded synchronized catalog**. Their existing Ultimate level, random bonuses and socket configuration survive; the original gear and a migration note are retained. Normalization includes opponent builds and runs when saved/imported builds load into the builder and during explicit server-side saving. Parsing without a catalog safely defers normalization until catalog-backed loading; it does not guess IDs or trigger an automatic build POST.

If no safe counterpart exists, the legacy representation remains usable with its existing configuration and an explicit warning. This does not invent an Ultimate random-stat table for the base item. Explicit equipment repair also uses the centralized variant normalization.

High-confidence screenshot bonus lines are accepted only after exact canonical skill/parameter matching and validation through the same resolver. Unmatched or uncertain lines retain a manual-review warning. Recognized Ultimate screenshot upgrades select the same counterpart and its configuration. No new AI provider call or quota policy was introduced.

Main-hand Skill Bonus behavior is unchanged: a configured left-hand bonus does not stack into main-hand skill damage. The existing singular `weaponBonus` schema remains unchanged; no database schema migration is needed.

## Changed files

- `lib/catalog-items.ts`, `app/api/data/route.ts`: browser catalog projection now retains dismantle metadata, attack-speed coefficients and additional skill damage. The previous projection dropped these fields even though the synchronized records contained them.
- `lib/item-variants.ts`, `lib/model.ts`: safe variant resolution, conversion/normalization, typed API dismantle shape.
- `lib/skill-awake.ts`: shared rarity resolution and canonical imported-bonus matching.
- `lib/persistence.ts`, `lib/equipment.ts`, `components/Laboratory.tsx`: catalog-backed saved-build normalization and explicit repair.
- `components/ItemUpgradePanel.tsx`: counterpart conversion and unresolved warning.
- `components/AICharacterImport.tsx`: canonical Ultimate configuration and validated bonus import.
- `components/WeaponVariantBadges.tsx`, `components/EquipmentEditor.tsx`, `app/globals.css`: separate variant badges.
- `tests/ultimate-variants.test.ts`, `scripts/test.mjs`: current-data and edge-case regressions.

## Verification

21 new regressions cover current Conch and Sirens links/pools, Electric Shock, Mentalist exclusion, Healing, validator/editor agreement, future exact Ultimate tiers, insertion-order-independent fallback, ambiguous/missing links, conversion preservation, actual Ultimate random-stat modifiers, schema-2/schema-3/opponent migration, deferred parsing, AI normalization, repair, independent picker IDs and main-hand behavior.

All 174 tests pass, including the prior 153. Typecheck, lint (zero errors, 35 existing warnings) and the production build passed. No preview website is created; publication updates the existing production Site.
