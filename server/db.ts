import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  videos,
  scripts,
  adCampaigns,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---------- Demo data helpers ----------

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).orderBy(products.id);
}

export async function getProductByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.code, code)).limit(1);
  return result[0];
}

export async function getAllVideos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(videos).orderBy(desc(videos.gpm));
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function updateVideoGpm(id: number, gpm: number, revenue: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ gpm, revenue }).where(eq(videos.id, id));
}

export async function getScriptsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scripts).where(eq(scripts.productId, productId));
}

export async function getAllAdCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
}

export async function createAdCampaign(input: {
  videoId: number;
  campaignName: string;
  dailyBudget: number;
  bidStrategy: string;
  audience: string;
  triggerGpm: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(adCampaigns).values(input);
  return result;
}

export async function clearDemoData() {
  const db = await getDb();
  if (!db) return;
  await db.delete(adCampaigns);
  await db.delete(videos);
  await db.delete(scripts);
  await db.delete(products);
}

export async function bulkInsertProducts(rows: (typeof products.$inferInsert)[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  await db.insert(products).values(rows);
}

export async function bulkInsertVideos(rows: (typeof videos.$inferInsert)[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  await db.insert(videos).values(rows);
}

export async function bulkInsertScripts(rows: (typeof scripts.$inferInsert)[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  await db.insert(scripts).values(rows);
}
