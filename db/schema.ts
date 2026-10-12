// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const builds = sqliteTable('builds', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(), payload: text('payload').notNull(),
  shared: integer('shared').notNull().default(0), updatedAt: text('updated_at').notNull(),
});
