"use server";

import { db } from "@/db";
import { variables } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  createVariableSchema,
  updateVariableSchema,
} from "@/lib/validations";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createVariable(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createVariableSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db
    .select({ id: variables.id })
    .from(variables)
    .where(
      and(
        eq(variables.userId, session.user.id),
        eq(variables.key, parsed.data.key)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: { key: ["A variable with this key already exists"] } };
  }

  await db.insert(variables).values({
    userId: session.user.id,
    key: parsed.data.key,
    value: parsed.data.value,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/v/${session.user.username}/${parsed.data.key}`);
  return { success: true };
}

export async function updateVariable(id: string, value: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = updateVariableSchema.safeParse({ id, value });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db
    .select({ key: variables.key })
    .from(variables)
    .where(and(eq(variables.id, id), eq(variables.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    return { error: { id: ["Variable not found"] } };
  }

  await db
    .update(variables)
    .set({ value: parsed.data.value, updatedAt: new Date() })
    .where(
      and(eq(variables.id, parsed.data.id), eq(variables.userId, session.user.id))
    );

  revalidatePath("/dashboard");
  revalidatePath(`/v/${session.user.username}/${existing[0].key}`);
  return { success: true };
}

export async function deleteVariable(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db
    .select({ key: variables.key })
    .from(variables)
    .where(and(eq(variables.id, id), eq(variables.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    return { error: "Variable not found" };
  }

  await db
    .delete(variables)
    .where(
      and(eq(variables.id, id), eq(variables.userId, session.user.id))
    );

  revalidatePath("/dashboard");
  revalidatePath(`/v/${session.user.username}/${existing[0].key}`);
  return { success: true };
}
