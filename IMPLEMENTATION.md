# Implementation checklist

- [x] Sites-native React/TypeScript Worker project and private Site registration
- [x] Official OpenAPI inspection, schema normalization, complete initial data import
- [x] Versioned R2 cache, selective class catalogs, throttled manual synchronization
- [x] Canonical build, Quick → Advanced wizard, equipment, upgrades, stats, pets, buffs
- [x] Original character illustration, elemental glow/particles, live change indicators
- [x] Isolated estimated combat engine, probability-weighted results, DPS and TTK
- [x] PvP quick opponents, full-build bidirectional comparison, boss table
- [x] Deterministic optimization, element comparison, modeled breakpoints
- [x] Local autosave and named builds, import/export, D1 owner-scoped cloud records and share IDs
- [x] Engine tests and runtime/desktop/mobile QA (18 engine tests and 19 end-to-end checks)
- [x] Build ready for source sync and private review deployment
- [ ] Hosted deployment confirmation (reported in the chat handoff)
- [ ] Public publication after user approval

See FORMULAS.md and README.md for limits. Full rotation combat, exact dual-wield cycles, authoritative pricing, all awakening variants, validated PvP mechanics and public popularity rankings remain future work.

# Schema 2 update checklist

- [x] Preserve existing Site and NAOL visual identity
- [x] Separate PvE/PvP from class-specific role/archetype
- [x] Add Support Lab and role-specific scoring/optimizer dispatch
- [x] Centralize hand topology, selectors and item upgrade capabilities
- [x] Calculate main/offhand contributions independently, label cycle assumptions
- [x] Four independent armor upgrades, minimum set bonus and separate armor glow
- [x] Suit-only defensive element and four suit sockets; 5/10 weapon and 5 shield sockets
- [x] Schema-2 migration preserves legacy equipment and local backups
- [x] Expanded engine tests and browser verification
- [x] Ready for saved Site version and review handoff (native saved-version result reported in chat)
- [ ] Replace live public version after user approval

# Final stat engine audit checklist

- [x] Canonical API parameter registry with backward-compatible aliases
- [x] Source-aware modifier normalization and confidence metadata
- [x] Flat, rate, set, negative, and once-only contribution handling
- [x] Independent movement, action, attack speed, and block-family semantics
- [x] Character Details groups with clickable provenance and formula notes
- [x] Observed screenshot comparison without replacing calculated values
- [x] Formula calibration moved from the player editor to admin/developer tooling
- [x] Class-scoped calibration fixture model without global coefficient mutation
- [x] AI candidates filtered by canonical slot, class, level, and equipment rules
- [x] Eight final-class matrix and targeted regression tests
- [x] Schema version 3 preserved
- [x] Internal mechanic/source/confidence table in `STAT_ENGINE_AUDIT.md`
- [x] Additional Stat source, eligibility, API combinations and single-stat Scroll controls
- [x] Backward-compatible `awake` migration and production schema acceptance
- [x] Independent Flyffulator behavior review and pure formula modules
- [x] Target-effective defense, hit, block and critical values separated from sheet stats
- [x] Shared expected/Monte Carlo event cycle and critical distribution
- [x] Admin-only cross-engine fixture comparison
- [x] Passive skill configuration within the character sandbox
- [ ] Independent in-game damage/timing fixtures for Reference-Validated confidence
