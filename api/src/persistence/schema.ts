import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull(),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
})

export const loginAttempts = sqliteTable('login_attempts', {
  key: text('key').primaryKey(),
  firstFailedAt: integer('first_failed_at').notNull(),
  failureCount: integer('failure_count').notNull(),
  blockedUntil: integer('blocked_until'),
})
