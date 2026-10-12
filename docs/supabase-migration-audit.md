# Supabase migration inventory

Audit date: 2026-10-12. This is a migration plan, not evidence of a completed cutover.

The table below records the pre-migration inventory. Supabase is now configured and the migrations are applied. The old production deployment remains active until hosted acceptance checks pass; the new source removes D1/R2 bindings and application ChatGPT authentication.

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

Pre-cutover production API counts were independently measured: classes 21; builder item subset 14359; monsters 1224; skills 827. The production core and complete public equipment catalog were exported to the ignored migration workspace. All 5005 exposed catalog IDs exist in the new cache. The remaining bundled item IDs are checked separately against the complete cache. The complete Flyff API item manifest contains **21687** items; Supabase preserves all of them, including categories outside the builder's 14359-item subset. This difference is intentional, not missing records.

Supabase version 37 manifest: classes 21; items 21687; monsters 1224; skills 827; sets 296; upgrade rows 20; stat awakenings 48; raised pets 10; dungeons 88; skill awakenings 1 aggregate object. Resource counts are validated before generation activation. Production Scepter, normal/Ultimate weapon, accessory, fixed Clockworks item, class and skill fields are preserved; raw API payloads are retained alongside normalized data.

The Sites storage connector does not expose a raw R2 blob export. The export is therefore of the public production cache API, with the tracked seed retained as an additional recovery source; this is not described as a raw R2 export. Old physical storage is retained by the previous saved deployment for rollback and is no longer used by the new application.

Browser-local records were not enumerated from the user's live session. The import UI must discover these in each user's browser with an explicit import action.

## Configuration required before connected implementation/testing

Site runtime: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (public project API key). Resolve public configuration from runtime so deployment does not bake a production project into browser source. Never expose a service-role key.

Supabase Edge Function secrets, if using Resend: `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`. Supabase supplies its own project URL and service-role environment for functions. Restrict redirects to configured origins; use separate development values.

Supabase Auth: email/password enabled; built-in Confirm Email disabled to permit immediate sessions; NAOL profile `email_verified_at` remains initially null and is controlled by trusted verification. Configure Site URL and exact password-reset/verification redirect URLs. Password recovery email delivery also needs working Supabase Auth SMTP/provider configuration.

Project-management credentials supplied in the ignored local environment enabled schema/RLS application, Auth configuration, three deployed Edge Functions, cache initialization and integration testing. Migration history is recorded through the Supabase CLI. A Vault-backed hourly cron checks the data version, and only a changed version starts a full import.

## Acceptance evidence

The existing 88 unit tests and builder/browser regression workflows pass. Live Supabase checks cover immediate signup, username uniqueness, session restoration, ownership/RLS, malformed payload rejection at the database, sharing, revisions, preferences, verification dispatch/rate limits/expiry/reuse, password-reset email requests, same-version cache checks and failure-safe generation activation. Browser checks cover unverified autosave, refresh/reload, offline conflict recovery, account build actions, profile editing, verification links, recovery links/password changes, logout/login and mobile layout. Integration accounts are temporary and deleted after each run.

Hosted preview and production verification are recorded in the deployment report after publication. No production cutover is claimed by this inventory alone.
