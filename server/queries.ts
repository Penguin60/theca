import "server-only";
import { db } from "@/db";
import { variables, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getVariablesByUserId(userId: string) {
  return db
    .select()
    .from(variables)
    .where(eq(variables.userId, userId))
    .orderBy(desc(variables.updatedAt));
}

export async function getPublicVariable(username: string, key: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0) return null;

  const result = await db
    .select()
    .from(variables)
    .where(and(eq(variables.userId, user[0].id), eq(variables.key, key)))
    .limit(1);

  return result[0] ?? null;
}
