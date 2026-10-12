# Supabase migration validation — 2026-10-12

The private hosted acceptance build completed all 14 account/browser checks: signup, immediate unverified access, canonical autosave, session/build restore, offline conflict copies, duplication, unlisted sharing, profile editing, verification, mobile layout, password recovery/change, account isolation on logout, login and absence of runtime errors.

Private acceptance version: `appgprj_6accdcd442f48191be9e4d4071fe1c43~appgver_a84e53c86dcc81919ab47c47bcfe58f4`.

Existing builder regressions: 88 unit checks and 64 browser checks pass. Live database/Auth checks include cross-account denial, direct-RPC malformed payload rejection, private/unlisted/public visibility, revision conflicts, preference ownership, email dispatch/rate limits/expiry/reuse, password-reset SMTP, same-version behavior and incomplete-generation rejection. Temporary accounts are deleted after each run.

Source/destination build records before cutover: **0 / 0**. The last Sites D1 read was complete, untruncated and had no continuation. No ownership mappings were guessed.

Game cache API version: **37**. Supabase holds 21687 raw items, 21 classes, 1224 monsters, 827 skills, 296 sets, 20 upgrade rows, 48 stat-awakening rows, 10 raised pets, 88 dungeons and 1 aggregate skill-awakening object. The builder subset remains 14359 items. Every legacy public catalog ID (5005) and every bundled item ID (14359) is preserved in the new cache; missing IDs: **0**. The complete API item manifest contains additional non-builder categories, explaining the larger canonical item count.

Schema, RLS, indexes, profile triggers, verification token functions and atomic generation activation are applied. Migration history is recorded. Trusted Edge Functions and Vault-backed hourly version checks are deployed. Built-in email confirmation is disabled to allow immediate sessions; NAOL verification is separately tracked and never gates core features. Production/local/private reset callbacks are explicitly allowlisted.

The source and build artifact were scanned for the operator access token, database password, service-role key and sync key; none are present. New application source has no D1/R2 or ChatGPT account-authentication path. Remaining browser storage is documented as temporary drafts, unsynchronized copies, Auth session state or legacy recovery data.

The old saved production version remains available for rollback. Raw R2 blob export was not available through the connector; the public cache export and tracked seed are retained locally, and all corresponding item IDs are present in the newly synchronized official cache. Do not describe the public API export as a raw R2 backup.

Production deployment and final public-domain verification follow this acceptance record; the native saved version/deployment results are authoritative for publication.
