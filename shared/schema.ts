import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prayers = pgTable("prayers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  status: varchar("status").notNull().default("ongoing"), // ongoing, answered
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

export const prayerGroups = pgTable("prayer_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => prayerGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const prayerSupport = pgTable("prayer_support", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prayerId: varchar("prayer_id").notNull().references(() => prayers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // prayer, heart, comment
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayerComments = pgTable("prayer_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prayerId: varchar("prayer_id").notNull().references(() => prayers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prayers: many(prayers),
  createdGroups: many(prayerGroups),
  groupMemberships: many(groupMembers),
  prayerSupports: many(prayerSupport),
  comments: many(prayerComments),
}));

export const prayersRelations = relations(prayers, ({ one, many }) => ({
  user: one(users, {
    fields: [prayers.userId],
    references: [users.id],
  }),
  supports: many(prayerSupport),
  comments: many(prayerComments),
}));

export const prayerGroupsRelations = relations(prayerGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [prayerGroups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
  group: one(prayerGroups, {
    fields: [groupMembers.groupId],
    references: [prayerGroups.id],
  }),
}));

export const prayerSupportRelations = relations(prayerSupport, ({ one }) => ({
  prayer: one(prayers, {
    fields: [prayerSupport.prayerId],
    references: [prayers.id],
  }),
  user: one(users, {
    fields: [prayerSupport.userId],
    references: [users.id],
  }),
}));

export const prayerCommentsRelations = relations(prayerComments, ({ one }) => ({
  prayer: one(prayers, {
    fields: [prayerComments.prayerId],
    references: [prayers.id],
  }),
  user: one(users, {
    fields: [prayerComments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPrayerSchema = createInsertSchema(prayers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  answeredAt: true,
});

export const insertPrayerGroupSchema = createInsertSchema(prayerGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerSupportSchema = createInsertSchema(prayerSupport).omit({
  id: true,
  createdAt: true,
});

export const insertPrayerCommentSchema = createInsertSchema(prayerComments).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type PrayerGroup = typeof prayerGroups.$inferSelect;
export type InsertPrayerGroup = z.infer<typeof insertPrayerGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type PrayerSupport = typeof prayerSupport.$inferSelect;
export type InsertPrayerSupport = z.infer<typeof insertPrayerSupportSchema>;
export type PrayerComment = typeof prayerComments.$inferSelect;
export type InsertPrayerComment = z.infer<typeof insertPrayerCommentSchema>;
