# Build navigation, AI restore and numeric editing

## Entry contract audited before changes

| Entry | Previous behavior / defect | Intended behavior |
|---|---|---|
| `/` | Root ignored search params; Laboratory loaded the anonymous draft/demo first, account hydration then chose a matching draft or `rows[0]`. | Resume only the current owner's workspace draft; fresh unsaved build when none exists. |
| `/?build=<id>` | Hydration sampled `location.href` asynchronously; requested ID was not an effect dependency. | Explicit owned-build intent; fetch that exact record, then its catalog, then parse. No fallback. |
| `/build/<id>` | Separate shared endpoint in Laboratory; account hydration also ran nearby. | Keep shared authorization separate; viewing/editing a copy never selects an owned build implicitly. |
| My Builds → Open | Link had the correct query but root route did not own its meaning. | First-class exact owned-build launch. |
| AI → Create Build | Selections reset to `{}`; unselected gear silently skipped; saved build redirected to `/`. | Resolve safe matches, expose/block unresolved visible gear unless explicitly skipped, then open the saved ID. |
| Anonymous/offline draft | `naol-draft` plus local saved builds. | Preserve anonymous scope and explicit offline saves. |
| Account draft | Owner-scoped draft, revision and sync state; newest-cloud fallback could replace it. | Restore only that owner's draft and retain conflict/offline work. Never choose newest cloud implicitly. |
| New Build | No dedicated launch or prominent action. | Fresh UUID, Untitled Build, empty gear/skills/buffs/pet, base stats 15, demo false; protect dirty work. |

Repository list parsed without GameData, while get/save returned transport records. Catalog-backed normalization belongs to the builder restore path and explicit server save validation. Account links already pointed to `/`; fixing its launch semantics repairs their destination. Shared/private endpoint permissions remain unchanged.

Numeric controls called `Number(text)` and clamped during every keystroke, so empty text became 0/min. The replacement keeps local text until blur/Enter, reverts on Escape or invalid blur, supports explicit integer/decimal bounds and steps, and synchronizes external values only outside active editing.

## Final implementation report

1. **Navigation root cause:** launch intent was sampled outside the route contract and account hydration could substitute the newest cloud row. The root now resolves explicit searchParams into resume, owned ID or new; owner/launch changes restart hydration with guards against stale restoration.
2. **My Builds Open:** real Next links point to the selected owned ID. Storage fetches that exact record, loads its class and opponent catalogs, then parses. Missing/inaccessible records render an explicit error without a fallback build.
3. **Brand and Back:** both My Builds links use `/`, meaning resume the owner-scoped workspace. Shared view routes remain distinct from owned edit routes.
4. **New Build:** toolbar and My Builds actions use `/?new=1`. Each launch creates a fresh UUID, Untitled Build, legal class/level, primary stats 15, empty equipment/skills/buffs/pet and demo=false. Repeated New in the same route creates another UUID. One existing navigation dialog provides Save/Discard/Cancel; failed Save prevents navigation. Previous drafts receive local backup keys.
5. **AI missing-detail cause:** empty manual selection state previously silently skipped detected equipment. Resolution now combines safe automatic choices with manual overrides and separately tracked explicit skips.
6. **AI resolution rules:** one exact legal normalized name may auto-select; high-confidence similarity must reach .94 with a .15 gap. Same-name variants remain ambiguous unless rarity/Ultimate evidence uniquely identifies the legal variant. Candidate IDs from extraction are not trusted. Detected/resolved/skipped/unresolved counts are shown, and unresolved detected equipment blocks creation until chosen or explicitly skipped.
7. **AI post-save:** creation opens the exact ID returned by Save. Review state is keyed by saved build ID and retains the import ID. Supported upgrades, elements, confirmed Additional Stats, canonical Weapon Bonuses, Fashion Blessings, identifiable cards/jewels/runes and skills/buffs are applied. Uncertain details produce review warnings; displayed totals remain observed comparisons rather than allocated base stats.
8. **Numeric root cause:** coercion on every change converted an empty draft to 0 and immediate clamping interrupted replacement typing.
9. **Numeric behavior:** the shared input stores text during editing; blur/Enter parse, validate, clamp and apply steps; Escape/invalid blur revert. Arrow keys increment/decrement. External numeric changes synchronize while inactive. Integer fields reject fractional commits; percentages/formula values allow decimals. Mobile inputMode and spinbutton ARIA bounds are provided.
10. **Numeric migration:** StatsEditor, AI review, TargetEditor/PvP, SupportLab, ItemUpgradePanel Ultimate values, BuildWizard, AdminConsole, Optimization, OpponentBuild, SkillsEditor/PassiveSkills, EquipmentEditor, BossSimulator, DamageSummary and tank assumptions use the shared control. AccessoryConfig uses discrete choice buttons. Range and select behavior remains unchanged.
11. **Files:** entry changes in app/page.tsx, Laboratory.tsx, AccountScreen.tsx, BuilderEntryLinks.tsx, useBuildStorage.ts, lib/routes.ts and lib/builder-launch.ts; transport consistency in lib/repositories/builds.ts; AI helpers in lib/ai-item-resolution.ts and lib/ai-build-import.ts with AICharacterImport.tsx; numeric logic in lib/numeric-input.ts, NumericInput.tsx, Controls.tsx and the controls listed above; scripts/test.mjs and three new regression suites.
12. **Tests added:** 25 regression cases for exact launch/draft/new/missing routing, rendered link hrefs, catalog-before-parse restoration, numeric intermediate/commit/revert/bounds/steps/mobile behavior, safe/ambiguous/explicitly skipped AI equipment and a canonical AI create→JSON persistence→catalog parse round trip. The latter verifies IDs, primary stats, upgrades, elements, Additional Stats, Weapon Bonuses, Fashion Blessings, observed stats and skills/buffs.
13. **npm test:** 199 tests passed, including all existing combat/equipment regressions.
14. **npm run typecheck:** passed.
15. **npm run lint:** zero errors; 29 existing warnings.
16. **npm run build:** passed.

## Persistence and verification limits

CharacterBuild remains schema version 3. Repository list/get/save consistently return transport records; builder restoration performs GameData-dependent parsing, and explicit server Save retains validation. No automatic cloud Save is introduced by launch/focus/typing. Existing private/shared access checks and combat, equipment, Ultimate and Bonus Awakening rules remain intact. Existing saves, imports and scoped drafts are retained.

The browser automation tool failed during initialization because its kernel asset path was unavailable. Keyboard behavior is covered by extracted action tests and rendered-control checks, but an interactive browser keyboard session was not completed. Production publication uses the existing public Site directly, with no preview Site.
