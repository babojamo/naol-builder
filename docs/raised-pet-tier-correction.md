# Raised Pet tier correction

1. **Previous bug:** the build stored a single zero-based pet index and aggregation applied one API value. Real reached-tier contributions were lost. Quick Builder also created that obsolete configuration.
2. **New model:** schema-3 builds store `{id, tier, levels}` with independent F/E/D/C/B/A/S rolls. Optional `legacyLevelIndex` preserves an old index for review. Names and icons come from the item catalog.
3. **Tier rules:** `lib/raised-pets.ts` centralizes F1/E2/D3/C4/B5/A7/S9 maximums, reached-tier selection, validation, presets and tier transitions. Increasing the current tier defaults newly reached rolls to 1; lowering it preserves higher rolls without applying them. AI review does not fill unseen rolls.
4. **API usage:** explicitly typed RaisedPetData and RaisedPetTierData use official `/raisedpet` fields. Player-facing level n reads `values[n - 1]`. Production stat values are never hardcoded. Egg/non-stat records are excluded. See the [official API reference](https://api.flyff.com/) and [official pet rerolling update](https://universe.flyff.com/index.php/news/ver141).
5. **Calculation:** all valid reached rolls are summed into one verified canonical pet modifier, flat or percentage according to API rate. Invalid or incomplete pet configurations contribute no speculative total and show validation errors. Current synchronized STR values yield +75 for perfect S and +14 for perfect C; minimum S uses seven level-one contributions. Grace Skills are not applied as permanent stats.
6. **UI:** the dedicated RaisedPetEditor shows Pet, Current Tier, Tier Levels, per-tier contributions, total bonus, Perfect Pet and Minimum Rolls. Character stat explanations show the named pet's cumulative contribution and reached-tier breakdown. API energy, candy and Grace Skill metadata are informational. The active pet is assumed to have energy. Quick Builder uses a conservative F1 pet for a newly recommended type and retains an existing configuration when its pet type remains selected.
7. **Migration:** parseBuild accepts legacy `{id, level}` and normalizes it to F1 while retaining the exact original index and adding “Legacy Raised Pet used the old single-level model. Tier rolls need review.” It invents no higher-tier rolls, migrates opponents too, and keeps schema version 3. Existing cloud rows remain unchanged until explicitly saved. The database validator accepts both legacy and new formats, including null pets, and enforces each tier's maximum.
8. **AI import:** extraction records current tier and each separate roll, with null for unseen evidence. Review exposes unknown rolls and legal selectors. Creation rejects missing tier/history until reviewed or the pet is explicitly skipped. Complete pet rolls survive create/save/restore. The extraction schema and prompt were deployed to the existing analyze-character Edge Function; provider, model and quotas are unchanged.
9. **Tests:** 20 new cases in tests/raised-pets.test.ts cover F/E/C/S sums using synchronized data, minimum rolls, A/S/E boundaries, zero API values, missing/fractional rolls, tier transitions, flat/rate canonical modifiers, actual final STR, Grace Skill exclusion, legacy/opponent migration, JSON round trips, rendered editor metadata and AI extraction/create/restore. Production database smoke tests use a read-only representative build to verify legacy/new/null acceptance and invalid A8/S10 rejection.
10. **npm test:** all 219 tests passed, including the existing combat/equipment suite.
11. **npm run typecheck:** passed.
12. **npm run lint:** zero errors, 29 existing warnings.
13. **npm run build:** passed.

## Changed areas and deployment

- Pet types, rules and persistence: lib/model.ts, lib/raised-pets.ts, lib/persistence.ts.
- Pet modifier, validation and recommendation adapters: lib/stat-modifiers.ts, combat/character.ts, combat/optimizer.ts. Unrelated equipment/combat formulas are unchanged.
- Pet editor and source inspector: components/RaisedPetEditor.tsx, SkillsEditor.tsx, CharacterDetails.tsx and its PerformanceDashboard.tsx caller.
- AI extraction/review/assembly: lib/ai-item-resolution.ts, lib/ai-build-import.ts, components/AICharacterImport.tsx, supabase/functions/analyze-character/index.ts and _shared/raised-pet-extraction.ts.
- Database compatibility: supabase/migrations/202610130002_raised_pet_tiers.sql and scripts/verify-raised-pet-schema.sql. Only the pet branch of the existing build JSON schema was extended.
- Verification: tests/raised-pets.test.ts and scripts/test.mjs.

Work continues on local main, including the preceding navigation update; fetched remote main was its ancestor, so no earlier work was reset. Publication targets the existing production Site directly. No preview Site is created. Interactive browser QA is unavailable in this session; rendering, rule/engine, persistence and production schema checks provide the recorded verification.
