# Supabase operations

The application reads its public project URL and API key at runtime from `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Use a publishable key or legacy anon key; the configuration endpoint rejects a secret/service-role key. Auth sessions are persisted by Supabase Auth in browser storage. Application builds and preferences are authoritative in PostgreSQL.

## Environments

Use a separate development Supabase project for routine development. Configure local `.dev.vars` with that project's public URL/key. Production runtime configuration lives in Sites Settings. The migration acceptance preview uses isolated temporary accounts in the configured production project; those accounts and their builds are deleted after testing. No test accounts are seeded permanently.

Operator credentials belong in the ignored `.env.migration`, not Site runtime configuration:

```
SUPABASE_ACCESS_TOKEN=<scoped management token>
SUPABASE_DB_PASSWORD=<database password>
```

The local management helper can obtain keys into ignored `.env.supabase` for deployment/acceptance checks. This file includes an administrative key and must never be copied to a Site, committed or bundled. `.dev.vars` contains only public runtime configuration. Build packaging is checked for operator credentials.

## Schema and functions

SQL migrations are in `supabase/migrations`; generated database types are in `lib/supabase/database.types.ts`. The canonical build payload also has database JSON Schema validation derived from `lib/persistence.ts`, in addition to server route validation. When the build schema changes, update the database validation through a new migration.

For the local helper CLI, install the supported CLI into the ignored workspace:

```
npm install --prefix work/supabase-tools supabase@2.120.0
node scripts/supabase-cli.mjs link --project-ref <project-ref>
node scripts/supabase-cli.mjs db push
node scripts/supabase-cli.mjs functions deploy --project-ref <project-ref>
node scripts/supabase-cli.mjs types <project-ref>
```

Functions: `send-verification-email`, `verify-email`, `sync-flyff`. JWT gateway checking is disabled because each function performs its own appropriate authentication. Sending verifies the user with Auth. Verification requires an unpredictable token, stores only its hash and atomically consumes it. Sync requires a verified Auth session or the internal sync key; only trusted code writes game cache rows.

Edge secrets: `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `SYNC_KEY`. Supabase supplies the function's administrative credentials. `APP_URL` must be the intended public application origin. Auth's redirect allowlist must contain the exact reset-password and profile callback URLs used by each environment. Auth SMTP handles password recovery and secure email changes. NAOL email verification is deliberately separate from Supabase's built-in auto-confirmed state.

## Game cache

`flyff_entities` contains indexed normalized fields and the full raw JSON, partitioned by generation. `flyff_sync_state` selects the active generation. A sync stages batches, validates resource counts and rechecks the API version, then switches atomically. Removed entities are retained as inactive historical rows. The UI excludes inactive equipment from new selections but keeps saved equipment readable.

`scripts/setup-flyff-sync.mjs <project-ref>` configures the internal sync key and starts initialization. `scripts/configure-flyff-schedule.mjs <project-ref>` installs the hourly version-check job with its key stored in Supabase Vault. Same-version checks do not download the full dataset. Failed generations preserve the active cache. Inspect Data Health and `flyff_sync_state.error` if a sync fails; do not force activation of an incomplete generation.

## Offline and legacy builds

`naol-draft` is anonymous temporary state. `naol-account-draft:<user-id>` contains an account's unsynchronized draft, its base revision and sync flag. `naol-offline-builds` contains unsynchronized offline copies. `naol-builds` is read only as a legacy migration source except explicit deletion/import cleanup. Original schema-migration backups remain intact.

Signed-in builds autosave after one second. Writes serialize per account and require the current revision. A newer remote version pauses sync and offers Reload Cloud or Save Offline Copy. Unlisted builds resolve only through their exact ID/slug and cannot be enumerated through public table queries. My Builds supports explicit local import as new private copies, preserving cloud builds.

The old D1 schema/deployment remains a rollback reference; the new runtime has no D1/R2 read or write path. Rollback must account for Supabase builds created after cutover: export them before restoring an older application version. Do not delete Supabase data to roll back the UI.
