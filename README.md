# NAOL Build

Flyff Universe Build Optimizer built in React 19 and TypeScript on the Sites Vinext/Cloudflare Worker runtime. No external hosting or API secrets are required.

## Run locally

Requires Node >=22.13.0. Run npm run install:ci once, then npm run dev. The portable preview runs at http://127.0.0.1:5173.

- npm test — 37 engine tests using captured official API records
- npm run typecheck — TypeScript checks
- npm run build — Sites Worker build with its maintained build/sites-vite-plugin integration
- npm run db:generate — append a schema migration after editing db/schema.ts

On this Windows environment, the Sites package-manager shim misresolved npm. Calling Node with the absolute npm-cli.js path, or running node scripts/run-framework.mjs dev/build directly, works. The starter's portable runtime and build integration are preserved.

For D1 local setup, build once and apply drizzle/0000_adorable_joshua_kane.sql using the command in the Sites starter README. Visit /signin-with-chatgpt?return_to=/ to use the starter's local-only mock identity. Hosted identity comes from Sites dispatch headers.

## Architecture

Official API → versioned normalization/sync → bundled snapshot + R2 generation cache → isolated character/combat engine → optimizer → React UI. Quick and Advanced edit the same CharacterBuild object (lib/model.ts). The renderer is an adapter over canonical build data; no extracted game meshes are used.

- data/: normalized official data version 37, imported October 12, 2026; all class/item/monster/skill IDs were fetched in batches of 400, 350 ms apart. Items retain equipment, jewelry, pets, fashion and materials; irrelevant consumables are omitted. data/fixtures.json preserves representative actual API records.
- lib/flyff-server.ts: durable R2 snapshot and atomic switch only after successful full import. Initial deploy uses the bundled snapshot; /api/sync checks /version/data and imports only if changed. Checks require authentication and same-origin POST, with an R2 one-hour cooldown. Failed imports leave the active snapshot intact. No scheduled sync has been created.
- /api/data: core data and selective class-lineage equipment/skill catalogs, with HTTP caching. Catalogs are memoized in the browser. API icons are loaded directly from official image endpoints and use lazy loading.
- combat/: raw/derived stats, safe arithmetic parser, five-event expected damage, skill estimates, elemental estimates, DPS, optimization and seeded Monte Carlo distribution. Simulations yield in 2,000-attack chunks; primary numbers never depend on Monte Carlo.
- db/schema.ts + /api/builds: owner-scoped D1 records, explicit link sharing, same-origin writes, 32 KB payload limit, strict Zod input parsing, 100 cloud builds per owner, gameplay validation unless theoretical. Shared links contain IDs, not build JSON or personal information. Sharing grants read access only within the Site audience.
- components/: wizard, equipment, stats, targets, pets/skills/buffs, visualization, results, comparison, optimizer, database and application shell.

## Persistence and sharing

Local draft autosave and named builds require no login. Cloud save and link creation use Sign in with ChatGPT. Import/export uses schema-version-2 JSON (with automatic version-1 migration) validated with the same schema as server writes. A shareable record is available at /build/{id}. Normal Save sets sharing false; Copy Build Link explicitly enables it. Viewers should duplicate a shared build before saving their own cloud copy. No public build discovery or popularity ranking is claimed.

## Formula status

Read FORMULAS.md and the in-app Calculation Details. The API provides class HP/MP/FP formulas, factors, equipment abilities and upgrade tables, but does not specify every final combat equation. DPS, hit, block, PvP and skill results are estimates. Behavior tests verify the model and invariants; they do not prove agreement with in-game combat.

## Browser validation

The browser smoke suite uses Playwright. Point PLAYWRIGHT_PACKAGE_ROOT to a package.json beside an installed Playwright dependency and optionally set BROWSER_EXE to an installed Chromium/Edge executable; TEST_ORIGIN defaults to the local preview. Run node tests/browser-smoke.mjs. It checks desktop/mobile overflow, the wizard transition, item/stats/element updates, targets, distribution, local save/reload, local-auth D1 save, sharing, comparison, optimizer, boss/PvP workflows, data version check and invalid-build handling. Reports/screenshots are written to ignored work/.

## Deployment

Site ID is retained in .openai/hosting.json. Use the Sites source workflow helper to push the exact checked source and package dist/, then save/deploy that archive to the owner-private Site. Source credentials must remain in memory and be passed only through hidden stdin. Public access and future production changes require the user's approval from the attached specification. Do not create a second Site for this project. No DNS changes were performed; all links are origin-relative for later custom-domain use.

## Known MVP limits

- Both hands now have independent attack, upgrades, elements and ability contributions. The equal alternating dual-wield cycle and left-hand multiplier remain explicitly configurable estimates. Exact stacking, conditional effects and ultimate equipment remain unverified.
- HP formula strings are official, but modifier stacking is still approximate.
- Support Lab evaluates documented additive caster-stat scaling on healing and buffs, and displays duration/cooldown when supplied. Conditional scaling, synergies, resources, rotations and exact animation limits remain unverified. General damage-skill scaling remains limited.
- Raised-pet values use a selected API bonus index rather than tier-combination summation. Pet grace skills are not simulated. Decorative pets without numeric bonuses are excluded.
- Suit sockets are separate from weapon/shield sockets. Published limits are 4 suit, 5 one-handed weapon/shield, and 10 two-handed weapon. Item-specific historical eligibility remains unverified because the API has no piercing-eligibility flag.
- Dungeon lists filter base monsters; dungeon monster modifiers and boss regeneration/phase mechanics are not applied.
- Quick budgets are rarity/upgrade heuristics; custom Penya price modeling is not available.
- Role-specific DamageScore, SupportScore, TankScore and HybridScore describe heuristic estimates, not official metrics. Support Score excludes DPS/weapon attack and has configurable weights. DEX thresholds remain inferred engine breakpoints.
- R2 cooldown is best-effort across Worker isolates, not an atomic distributed lock. Manual syncing should remain owner-driven; use a Durable Object lock if scaling to many simultaneous sync requests.
- Community public listings, complete full-opponent editor within the PvP screen, fight win probabilities, 3D models and real market prices remain future work. Full saved builds can be compared bidirectionally instead.

## Attribution

Independent free informational tool for the official Flyff Universe game. Data and public API icons: Gala Lab / Flyff Universe, https://api.flyff.com. The API documentation permits use for informational tools and prohibits commercial use, game automation and other games. This app has no monetization. Character illustration and elemental effects are original approximations.

## Schema 2 and role/equipment refactor

Activity mode (`pve`/`pvp`) is separate from role and class-specific archetype. lib/archetypes.ts is the extensible configuration; inherited classes resolve through API ancestry. The Quick wizard retains eight steps, with role/archetype in step four and activity in step five. Support builds use INT, suitable sticks, learned healing/buff settings and a support-focused score. Damage remains an optional secondary view.

Equipment uses rightHand, leftHand and shield, plus exactly four primary armor slots (helmet, suit, gauntlets, boots). lib/equipment.ts centralizes selectors, capabilities, hand layout, validation, explicit repair, effective set upgrade and armor glow. Class eligibility, level, gender, weapon type and twoHanded come from API items. Blade ancestry is the only manually configured dual-wield capability. Compatible shields still follow API metadata; an explicit hand preference can choose a valid shield setup where available. Default Blade damage recommendations use two weapons.

Normal weapon/armor upgrades are capped at +10; accessory levels follow their API table. Only Suit has armor element and suit cards. Defensive Suit element coefficients are displayed but are not applied to incoming damage until the interaction formula is verified. Weapon elemental effects use each hand independently. Armor glow uses the minimum valid upgrade across all four pieces, separately from suit/weapon elements; the illustrative glow threshold follows the first API set-bonus level.

lib/ability-registry.ts uses the complete current API ability vocabulary and preserves unknown abilities. Support metrics show healing/cast, estimated throughput, cast reduction, MP cost/reserve, API MP recovery bonus, supported buff values/duration and Hymn bonuses. No unknown MP regeneration rate or Hymn rotation is fabricated. Self buffs are marked; ally class selection does not fabricate an ally DPS increase.

Migration maps legacy weapon/offhand/armor fields into schema 2. Known shields use captured official IDs. Original equipment remains in metadata.migration. Invalid legacy settings stay flagged rather than being clamped or deleted. Device backups use naol-draft-before-v2 and naol-builds-before-v2. Cloud payloads migrate when read by the canonical parser and are rewritten only on an explicit save. The Repair incompatible equipment action is explicit and undoable.

Additional QA: tests/equipment-support.test.ts and tests/browser-equipment-support.mjs cover dual wield, shields, two-handed restrictions, every armor capability, independent elements, armor minimum upgrades/glow, 4/5/10 socket capacities, support formulas, score independence and legacy migrations. The original browser smoke suite remains in place.

This update is saved for review. The existing public Site at naol-builder.lokwensio.com is preserved until publication approval.

Healer, Buffer and Support + Survivability archetypes initialize different Support Score weights, while PvE/PvP context changes leave the role intact. All weights remain editable in Support Lab.

On Windows, the Sites Bash packaging wrapper may fail to translate drive paths. `scripts/package-portable.mjs` provides a native-tar fallback and reuses the maintained Sites build validator. Pass the absolute Sites plugin root and archive path as arguments. Keep source pushes in the credential-safe Sites source workflow. No plugin credentials are required by the packager.
