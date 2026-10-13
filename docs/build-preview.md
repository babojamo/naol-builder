# Character Build Preview implementation

## Preview UI

**Build Preview** opens a large native modal from the workspace toolbar next to Save. The same Laboratory entry point handles new drafts, saved builds and public/shared URLs. Opening and closing the summary do not save, mutate the build, navigate away or send build POST requests. Escape closes it, native modal behavior traps focus, and the close action is keyboard accessible. Body scrolling is locked while open. The pure `BuildPreview` view accepts a presentation model and can later be reused for sharing/export. No image export or separate hosted preview site was added.

Desktop uses two section columns with compact item grids; mobile stacks sections and cards without fixed card widths. Character/item levels, database IDs and raw effect parameters are omitted.

## Added Stats

`createBuildPreviewModel` consumes the central modifier ledger and derived character stats. The four primary attributes use final derived attribute minus allocated/base attribute; all other direct bonuses retain separate flat/rate/set operations. Base and allocated ledger entries are excluded. Flat fashion PvE effects stay flat. Suit resistance contributions come from the existing engine breakdown, not a new element formula.

The existing performance profile chooses priority order for physical, magic, support and tank builds. At most ten nonzero entries appear initially; the rest remain in keyboard-accessible **More added stats**. Unsupported effects are excluded from totals and marked on source rows when human-readable labels exist. Added rates are not presented as final character-window values.

## Equipment

Weapons (each hand separately), shield, armor, necklace, both rings/earrings, fashion pieces, mask and cloak use normalized catalog names/icons. Direct bonuses, configured base rolls and supported upgrade bonuses use the ledger. Skill-specific weapon bonuses use existing eligibility helpers and resolved skill names. Intrinsic weapon damage and armor defense participate in the central character/combat engine; they are not fabricated as additive per-item ability bonuses in the summary.

## Awakenings

Additional Stats/legacy awakenings are separated from item bonuses. Each active awakening line stays visible independently. Fashion blessings show **Blessing of Goddess** or **Blessing of Demon** and their resulting lines. The engine still applies its first-two-lines limit and rejects masks/ineligible fashion slots. Blessing provenance is enriched in the ledger without changing its numerical ability stream.

## Runes / Jewels

Every configured rune, jewel and piercing card gets its own icon/name/effect card inside its equipment card. Added `sourceIndex` metadata distinguishes repeated cards and socket positions. Locked/rejected sockets remain visible as inactive/no-contribution entries; global unique-rune restrictions continue to come from the central engine. Individual sockets are never re-added to the overall totals by React.

## Set Effects

Set modifiers now retain authoritative set IDs/names and valid piece counts. Active sets are shown once. Armor upgrade effects are a separate source. The existing multiset piece-count algorithm was extracted into a helper reused by the engine, preserving accessory sets with repeated parts.

## Skills / Buffs

Active self buffs, external buffs, passives with material effects, the selected damage action and active effect items use separate source cards. Duplicate self/external skill handling is inherited from the engine ledger. Barrage displays the combat engine's estimated extra-arrow chance; Infusion retains its weapon-element effect note. Unsupported direct effects are visibly marked, not silently counted. Skill levels are not displayed as primary information.

## Pet

The selected raised pet shows its catalog image/name and the engine's validated tier-total modifier. No pet experience/level is emphasized. The current raised-pet schema supplies one bonus parameter; bead/multi-stat systems are not invented. Missing/invalid pet contribution data is noted.

## Target Monster

Targets are resolved by authoritative monster ID. Associated dungeons are found through `dungeon.monsters` IDs, with explicit difficulty text when not already contained in the dungeon name. Monsters 49835 and 54177 remain separate Normal/Story targets. Missing targets are not substituted with the catalog's first monster. Missing display metadata is retained as a data issue rather than synthesized into a new name.

## PvE DPS

The model calls the central `calculate` function for the selected target with a non-mutating PvE projection. **There is no second DPS formula in the preview.** It exposes DPS, effective connected hits/sec, effective crit and hit chance, with Estimated confidence and expandable calculation caveats. Unsupported actions/absent targets display **PvE DPS unavailable**. PvP builds are labeled as PvE projections; the workspace's chosen mode stays unchanged. Damage Lab's session-only measured cadence is not saved build state and is not silently propagated into the summary.

## Images

Icons use the existing official Flyff API image convention, including class and skill subpaths. Images retain aspect ratio and meaningful alternative text. Missing URLs and failed image loads show an accessible NAOL placeholder instead of a broken image. Missing source icons are counted in the preview's data notes. No name-based external image search or fabricated graphics is used.

## Files Changed

- `lib/build-preview.ts`: normalized presentation model.
- `components/BuildPreview.tsx`: reusable view, safe image fallback, native dialog.
- `components/Laboratory.tsx`: toolbar action and lazy summary-model construction.
- `app/globals.css`: scoped responsive summary/dialog styles.
- `lib/stat-modifiers.ts`: socket indices, blessing origin and named set provenance.
- `lib/accessories.ts`: shared set piece-count metadata helper.
- `tests/build-preview.test.ts`, `scripts/test.mjs`: summary/regression coverage.

## Tests Added

Tests cover PvE projection/no mutation, drafts without database identity, central DPS equality, fractional hit frequency, allocated/base exclusion, separate flat/rate effects, zero/cancelled values, dual weapons, weapon/shield, repeated piercings, rune/jewel identities, active/inactive socket attribution, separate awakening lines, fashion/cloak/mask eligibility, two-line blessing limit, active sets, buffs/passives, pet values/fallback, empty groups, authoritative Normal/Story targets, missing targets/images, all confidence states and escaped image paths. Existing combat/stat-engine suites check numerical behavior after provenance enrichment.

## Remaining Gaps / Verification Limits

The preview inherits the current engine's uncalibrated animation timing and estimated proc mechanics. Some catalog effects have no reviewed display label or calculated consumer; they are excluded with a note. The ledger does not assign the final nonlinear attack/defense formulas to individual items; cards intentionally report direct ability contributions. Raised-pet bead systems and image export are not modeled. Some sources lack catalog icons; failed URLs fall back at runtime.

Automated model and server-render tests plus typecheck/production build verify data flow and markup. Interactive desktop/mobile browser verification could not run because the enabled browser tool fails to initialize with a Windows kernel-assets path error. Escape/focus behavior and actual image-error interaction therefore rely on native dialog/React behavior and await interactive QA.
