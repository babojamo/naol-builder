# Monster selector policy — 2026-10-14

Monster identity remains the authoritative Flyff ID. Presentation groups use only trimmed English display names; they never merge, replace or normalize identity, statistics or drops.

Unique names retain the concise level/rank format. Same-name records receive dungeon context. When the entire collision group belongs to one verified world, the selector can use the supplied difficulty (Normal, Story, Cursed, Infernal, etc.). It never infers difficulty from level. Other groups use full dungeon names. If compact difficulty is ambiguous, full dungeon names are tried first; source ID is the final fallback. Tooltips retain the full dungeon association.

Regression: ID 49835 remains the level-180 normal Demonic Ankou; ID 54177 remains the level-200 Story Demonic Ankou. Both are Bosses targets and remain individually selectable. Neither is automatically preferred.

Default browsing excludes `event: true`, missing/literal-null display names and inactive cache records. “Include event monsters” opts into event records, without claiming an event is currently running. “All Records (Developer)” makes all retained records available, including event, missing-name and inactive records; search/rank/level/dungeon filters still apply. Literal-null source names are preserved rather than replaced with fabricated names.

Bosses includes the authoritative ranks giant, boss, super and worldboss. This is only a selector category: no source rank, combat stat or damage formula changes. Dungeon filtering still checks `dungeon.monsters` by exact source ID. Browse filters are local component state, do not send save requests and never replace a saved target. A target outside the current filters stays selected and receives a visible explanation.

Data Health reports same-name groups as informational, missing-name IDs, event counts, super-rank policy coverage, ambiguous final labels and ID fallbacks. It separately reports legitimate variants and unusable display names. No monsters are deleted or deduplicated.

Implementation: `lib/monster-selection.ts`, `components/TargetEditor.tsx`, `components/MonsterSelectionHealth.tsx`, `components/DataHealth.tsx`, sync health API, source metadata types and minimal visibility-control CSS.

Validation: 413 tests passed, including both real Ankou IDs, same-level/different-dungeon records, unique labels, event opt-in, all four boss ranks, null names, exact-ID dungeon membership, inactive records, source immutability and saved-target preservation. Typecheck/build passed. Lint passed with 0 errors and 26 existing warnings. Browser automation remains unavailable; pure policy and rendered-component checks cover the change.
