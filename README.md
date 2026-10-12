# NAOL Build

Flyff Universe Build Optimizer built in React 19 and TypeScript on the Sites Vinext/Cloudflare Worker runtime. No external hosting or API secrets are required.

## Run locally

Requires Node >=22.13.0. Run npm run install:ci once, then npm run dev. The portable preview runs at http://127.0.0.1:5173.

- npm test — 18 engine tests using captured official API records
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

Local draft autosave and named builds require no login. Cloud save and link creation use Sign in with ChatGPT. Import/export uses version-1 JSON validated with the same schema as server writes. A shareable record is available at /build/{id}. Normal Save sets sharing false; Copy Build Link explicitly enables it. Viewers should duplicate a shared build before saving their own cloud copy. No public build discovery or popularity ranking is claimed.

## Formula status

Read FORMULAS.md and the in-app Calculation Details. The API provides class HP/MP/FP formulas, factors, equipment abilities and upgrade tables, but does not specify every final combat equation. DPS, hit, block, PvP and skill results are estimates. Behavior tests verify the model and invariants; they do not prove agreement with in-game combat.

## Browser validation

The browser smoke suite uses Playwright. Point PLAYWRIGHT_PACKAGE_ROOT to a package.json beside an installed Playwright dependency and optionally set BROWSER_EXE to an installed Chromium/Edge executable; TEST_ORIGIN defaults to the local preview. Run node tests/browser-smoke.mjs. It checks desktop/mobile overflow, the wizard transition, item/stats/element updates, targets, distribution, local save/reload, local-auth D1 save, sharing, comparison, optimizer, boss/PvP workflows, data version check and invalid-build handling. Reports/screenshots are written to ignored work/.

## Deployment

Site ID is retained in .openai/hosting.json. Use the Sites source workflow helper to push the exact checked source and package dist/, then save/deploy that archive to the owner-private Site. Source credentials must remain in memory and be passed only through hidden stdin. Public access and future production changes require the user's approval from the attached specification. Do not create a second Site for this project. No DNS changes were performed; all links are origin-relative for later custom-domain use.

## Known MVP limits

- Dual-wield alternating attacks, exact stacking order, ultimate weapon restrictions, elemental armor defense, normal-versus-ultimate limits and some set/conditional effects remain unverified.
- HP formula strings are official, but modifier stacking is still approximate.
- Skill scaling, synergies, resources, rotations, buff duration and caster scaling are not implemented.
- Raised-pet values use a selected API bonus index rather than tier-combination summation. Pet grace skills are not simulated. Decorative pets without numeric bonuses are excluded.
- Piercing types use official card descriptions; the MVP conservatively supports four slots and labels capacity experimental.
- Dungeon lists filter base monsters; dungeon monster modifiers and boss regeneration/phase mechanics are not applied.
- Quick budgets are rarity/upgrade heuristics; custom Penya price modeling is not available.
- Build scores and DEX thresholds describe this configurable estimate engine, not official metrics or validated game breakpoints.
- R2 cooldown is best-effort across Worker isolates, not an atomic distributed lock. Manual syncing should remain owner-driven; use a Durable Object lock if scaling to many simultaneous sync requests.
- Community public listings, complete full-opponent editor within the PvP screen, fight win probabilities, 3D models and real market prices remain future work. Full saved builds can be compared bidirectionally instead.

## Attribution

Independent free informational tool for the official Flyff Universe game. Data and public API icons: Gala Lab / Flyff Universe, https://api.flyff.com. The API documentation permits use for informational tools and prohibits commercial use, game automation and other games. This app has no monetization. Character illustration and elemental effects are original approximations.
