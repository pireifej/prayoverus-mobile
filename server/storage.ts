import {
  users,
  prayers,
  prayerGroups,
  groupMembers,
  prayerSupport,
  prayerComments,
  type User,
  type UpsertUser,
  type Prayer,
  type InsertPrayer,
  type PrayerGroup,
  type InsertPrayerGroup,
  type GroupMember,
  type PrayerSupport,
  type InsertPrayerSupport,
  type PrayerComment,
  type InsertPrayerComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Prayer operations
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  getUserPrayers(userId: string): Promise<Prayer[]>;
  getPublicPrayers(): Promise<(Prayer & { user: User; supportCount: number; commentCount: number })[]>;
  updatePrayerStatus(id: string, status: string, userId: string): Promise<Prayer | undefined>;
  deletePrayer(id: string, userId: string): Promise<boolean>;
  
  // Prayer support operations
  addPrayerSupport(support: InsertPrayerSupport): Promise<PrayerSupport>;
  removePrayerSupport(prayerId: string, userId: string, type: string): Promise<boolean>;
  getPrayerSupports(prayerId: string): Promise<PrayerSupport[]>;
  
  // Prayer comment operations
  addPrayerComment(comment: InsertPrayerComment): Promise<PrayerComment & { user: User }>;
  getPrayerComments(prayerId: string): Promise<(PrayerComment & { user: User })[]>;
  
  // Prayer group operations
  createPrayerGroup(group: InsertPrayerGroup): Promise<PrayerGroup>;
  getUserGroups(userId: string): Promise<(PrayerGroup & { memberCount: number })[]>;
  joinGroup(groupId: string, userId: string): Promise<GroupMember>;
  leaveGroup(groupId: string, userId: string): Promise<boolean>;
  getPublicGroups(): Promise<(PrayerGroup & { memberCount: number })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Prayer operations
  async createPrayer(prayer: InsertPrayer): Promise<Prayer> {
    const [newPrayer] = await db
      .insert(prayers)
      .values(prayer)
      .returning();
    return newPrayer;
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    return await db
      .select()
      .from(prayers)
      .where(eq(prayers.userId, userId))
      .orderBy(desc(prayers.createdAt));
  }

  async getPublicPrayers(): Promise<(Prayer & { user: User; supportCount: number; commentCount: number })[]> {
    const result = await db
      .select({
        id: prayers.id,
        userId: prayers.userId,
        title: prayers.title,
        content: prayers.content,
        status: prayers.status,
        isPublic: prayers.isPublic,
        createdAt: prayers.createdAt,
        updatedAt: prayers.updatedAt,
        answeredAt: prayers.answeredAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        supportCount: sql<number>`cast(count(distinct ${prayerSupport.id}) as int)`,
        commentCount: sql<number>`cast(count(distinct ${prayerComments.id}) as int)`,
      })
      .from(prayers)
      .leftJoin(users, eq(prayers.userId, users.id))
      .leftJoin(prayerSupport, eq(prayers.id, prayerSupport.prayerId))
      .leftJoin(prayerComments, eq(prayers.id, prayerComments.prayerId))
      .where(eq(prayers.isPublic, true))
      .groupBy(prayers.id, users.id)
      .orderBy(desc(prayers.createdAt));

    return result as (Prayer & { user: User; supportCount: number; commentCount: number })[];
  }

  async updatePrayerStatus(id: string, status: string, userId: string): Promise<Prayer | undefined> {
    const [prayer] = await db
      .update(prayers)
      .set({ 
        status, 
        answeredAt: status === 'answered' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(and(eq(prayers.id, id), eq(prayers.userId, userId)))
      .returning();
    return prayer;
  }

  async deletePrayer(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(prayers)
      .where(and(eq(prayers.id, id), eq(prayers.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Prayer support operations
  async addPrayerSupport(support: InsertPrayerSupport): Promise<PrayerSupport> {
    const [newSupport] = await db
      .insert(prayerSupport)
      .values(support)
      .returning();
    return newSupport;
  }

  async removePrayerSupport(prayerId: string, userId: string, type: string): Promise<boolean> {
    const result = await db
      .delete(prayerSupport)
      .where(
        and(
          eq(prayerSupport.prayerId, prayerId),
          eq(prayerSupport.userId, userId),
          eq(prayerSupport.type, type)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getPrayerSupports(prayerId: string): Promise<PrayerSupport[]> {
    return await db
      .select()
      .from(prayerSupport)
      .where(eq(prayerSupport.prayerId, prayerId));
  }

  // Prayer comment operations
  async addPrayerComment(comment: InsertPrayerComment): Promise<PrayerComment & { user: User }> {
    const [newComment] = await db
      .insert(prayerComments)
      .values(comment)
      .returning();

    const [commentWithUser] = await db
      .select({
        id: prayerComments.id,
        prayerId: prayerComments.prayerId,
        userId: prayerComments.userId,
        content: prayerComments.content,
        createdAt: prayerComments.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(prayerComments)
      .leftJoin(users, eq(prayerComments.userId, users.id))
      .where(eq(prayerComments.id, newComment.id));

    return commentWithUser as PrayerComment & { user: User };
  }

  async getPrayerComments(prayerId: string): Promise<(PrayerComment & { user: User })[]> {
    const result = await db
      .select({
        id: prayerComments.id,
        prayerId: prayerComments.prayerId,
        userId: prayerComments.userId,
        content: prayerComments.content,
        createdAt: prayerComments.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(prayerComments)
      .leftJoin(users, eq(prayerComments.userId, users.id))
      .where(eq(prayerComments.prayerId, prayerId))
      .orderBy(desc(prayerComments.createdAt));

    return result as (PrayerComment & { user: User })[];
  }

  // Prayer group operations
  async createPrayerGroup(group: InsertPrayerGroup): Promise<PrayerGroup> {
    const [newGroup] = await db
      .insert(prayerGroups)
      .values(group)
      .returning();

    // Auto-join creator as admin
    await db
      .insert(groupMembers)
      .values({
        groupId: newGroup.id,
        userId: group.createdBy,
        role: 'admin',
      });

    return newGroup;
  }

  async getUserGroups(userId: string): Promise<(PrayerGroup & { memberCount: number })[]> {
    const result = await db
      .select({
        id: prayerGroups.id,
        name: prayerGroups.name,
        description: prayerGroups.description,
        imageUrl: prayerGroups.imageUrl,
        createdBy: prayerGroups.createdBy,
        isPublic: prayerGroups.isPublic,
        createdAt: prayerGroups.createdAt,
        updatedAt: prayerGroups.updatedAt,
        memberCount: sql<number>`cast(count(${groupMembers.id}) as int)`,
      })
      .from(prayerGroups)
      .leftJoin(groupMembers, eq(prayerGroups.id, groupMembers.groupId))
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${groupMembers} 
          WHERE ${groupMembers.groupId} = ${prayerGroups.id} 
          AND ${groupMembers.userId} = ${userId}
        )`
      )
      .groupBy(prayerGroups.id)
      .orderBy(desc(prayerGroups.createdAt));

    return result as (PrayerGroup & { memberCount: number })[];
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values({ groupId, userId })
      .returning();
    return member;
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getPublicGroups(): Promise<(PrayerGroup & { memberCount: number })[]> {
    const result = await db
      .select({
        id: prayerGroups.id,
        name: prayerGroups.name,
        description: prayerGroups.description,
        imageUrl: prayerGroups.imageUrl,
        createdBy: prayerGroups.createdBy,
        isPublic: prayerGroups.isPublic,
        createdAt: prayerGroups.createdAt,
        updatedAt: prayerGroups.updatedAt,
        memberCount: sql<number>`cast(count(${groupMembers.id}) as int)`,
      })
      .from(prayerGroups)
      .leftJoin(groupMembers, eq(prayerGroups.id, groupMembers.groupId))
      .where(eq(prayerGroups.isPublic, true))
      .groupBy(prayerGroups.id)
      .orderBy(desc(prayerGroups.createdAt));

    return result as (PrayerGroup & { memberCount: number })[];
  }
}

export const storage = new DatabaseStorage();
