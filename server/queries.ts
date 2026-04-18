import "server-only";
import { db } from "@/db";
import { variables, users, folders } from "@/db/schema";
import { eq, and, desc, isNull, asc } from "drizzle-orm";

export async function getVariablesByUserId(
  userId: string,
  filter?: { folderId: string | null }
) {
  const conditions = [eq(variables.userId, userId)];
  if (filter) {
    conditions.push(
      filter.folderId === null
        ? isNull(variables.folderId)
        : eq(variables.folderId, filter.folderId)
    );
  }
  return db
    .select()
    .from(variables)
    .where(and(...conditions))
    .orderBy(desc(variables.updatedAt));
}

export async function getFoldersByUserId(userId: string) {
  return db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(asc(folders.name));
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
