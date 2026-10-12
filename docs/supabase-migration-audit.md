# Supabase migration inventory

Audit date: 2026-10-12. This is a migration plan, not evidence of a completed cutover.

Production retains its current storage until the configured Supabase project passes the requested acceptance tests. No Supabase project is configured or accessible from this checkout yet.

| Entity | Current store | Read/write paths | Proposed destination and migration |
| --- | --- | --- | --- |
| Saved/shared builds | Sites D1 `DB.builds` | `app/api/builds/route.ts`: owner-scoped list, shared read, save, delete | Supabase `public.builds`, JWT ownership and RLS. Export existing records; never guess a Supabase account from a ChatGPT identity. |
| Authentication | Sites trusted `oai-authenticated-user-id` header; ChatGPT sign-in link | Builds and sync routes; Laboratory community panel; starter auth helpers | Supabase Auth email/password with secure profile creation trigger. Replace these application auth paths only at verified cutover. |
| Profiles | No application profile store | None | `public.profiles`; case-insensitive username uniqueness; restrict writable columns. |
| Verification | No current application verification store | None | Hashed, expiring, one-use tokens; trusted Edge Functions and email sender. Verification remains nonblocking. |
| Current Flyff snapshot | R2 `flyff/current.json` | `lib/flyff-server.ts` loads and replaces the complete snapshot after successful fetch | Supabase raw and normalized cache rows with atomic active-generation switch and inactive historical entities. Export actual R2 snapshot before cutover. |
| Flyff check state | R2 `flyff/check.json` | `lib/flyff-server.ts` manual sync/version check | Supabase sync state; trusted sync and public health metadata. |
| Seed game data | Tracked `data/*.json`, API version 37 | Server seed fallback; item-rule index fallback | Retain only as documented development/bootstrap fallback. Supabase becomes canonical after verified initialization; never hide a failed migration behind the seed. |
| Runtime game cache | Server `memory`; browser class catalog map | Flyff server and Laboratory catalog loader | Keep volatile cache only, keyed by active Supabase generation/version. |
| Local saved builds | `localStorage['naol-builds']` | `lib/persistence.ts`, Laboratory save/duplicate/delete | Opt-in import under authenticated Supabase account; do not overwrite cloud records. Retain original local data until import is verified. |
| Temporary draft | `naol-draft` | Laboratory edit effect/startup | Keep temporary offline resilience; timestamp/revision reconciliation before cloud autosave. |
| Migration backups | `naol-builds-before-v2`, `naol-builds-before-v3`, `naol-draft-before-v3` | Persistence/schema migration | Preserve recovery copies; never treat as an additional canonical database. |
| Performance preferences | CharacterBuild `performance` payload | Dashboard editors; build import/export | Preserve per-build settings in build JSON; account defaults in `public.user_preferences`. |
| Comparisons/simulations | React state only | Laboratory, comparison/simulator components | No persisted records to migrate. |
| Likes/comments/rankings | No persistent implementation | Community placeholders | No records to migrate; do not fabricate tables/features as existing data. |

## Verified counts

Production Sites database overview returned one user table: `DB.builds`. A complete bounded read returned **0 rows**, no continuation and no truncation. Schema: `id`, `owner`, `name`, `payload`, `shared`, `updated_at`. No ownership mapping is currently needed for those zero records; repeat this check immediately before cutover because users may save builds meanwhile.

Bundled development snapshot counts: classes 21; items 14359; monsters 1224; skills 827; equipment sets 296; upgrade rows 20; stat awakenings 48; raised pets 10; dungeons 88. Skill awakenings are an object. These are **bundled seed counts**, not a measurement of the live R2 snapshot or a Supabase destination. The live R2 snapshot still needs a controlled export and count/sample comparison.

Browser-local records were not enumerated from the user's live session. The import UI must discover these in each user's browser with an explicit import action.

## Configuration required before connected implementation/testing

Site runtime: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public project API key). Resolve public configuration from runtime so deployment does not bake a production project into browser source. Never expose a service-role key.

Supabase Edge Function secrets, if using Resend: `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`. Supabase supplies its own project URL and service-role environment for functions. Restrict redirects to configured origins; use separate development values.

Supabase Auth: email/password enabled; built-in Confirm Email disabled to permit immediate sessions; NAOL profile `email_verified_at` remains initially null and is controlled by trusted verification. Configure Site URL and exact password-reset/verification redirect URLs. Password recovery email delivery also needs working Supabase Auth SMTP/provider configuration.

Project-management connection or deployment credentials are separately required to apply SQL migrations/RLS, configure Auth, deploy functions, initialize cache and verify account isolation. Runtime public keys alone cannot perform those operations. Production acceptance, migrated counts and hosted private preview are pending.
