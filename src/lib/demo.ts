import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { PREMIUM_HOURS } from "@/lib/plans";

export const DEMO_EMAIL = "demo@predikt.app";
export const DEMO_NAME = "Demo Fan";
export const DEMO_PASSWORD = "demo1234";

export function isDemoUser(user: { email: string } | null | undefined): boolean {
  return Boolean(user && user.email.toLowerCase() === DEMO_EMAIL);
}

/** Find or create the reserved demo account and refresh its 24h premium pass. */
export async function ensureDemoUser(): Promise<User> {
  const until = new Date(Date.now() + PREMIUM_HOURS * 60 * 60 * 1000);
  const existing = (
    await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1)
  )[0];

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ plan: "premium", premiumUntil: until })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      plan: "premium",
      premiumUntil: until,
      role: "user",
    })
    .returning();
  return created;
}
