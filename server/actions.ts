"use server";

import { db } from "@/db";
import { variables, folders } from "@/db/schema";
import { auth, signOut } from "@/lib/auth";
import {
  createVariableSchema,
  updateVariableSchema,
  createFolderSchema,
  renameFolderSchema,
  moveVariableSchema,
  variableIdsSchema,
  bulkMoveSchema,
} from "@/lib/validations";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

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

  const folderIdRaw = formData.get("folderId");
  let folderId: string | null = null;
  if (typeof folderIdRaw === "string" && folderIdRaw !== "") {
    const owned = await db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, folderIdRaw), eq(folders.userId, session.user.id)))
      .limit(1);
    if (owned.length === 0) {
      return { error: { folderId: ["Folder not found"] } };
    }
    folderId = folderIdRaw;
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
    folderId,
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

export async function createFolder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createFolderSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(eq(folders.userId, session.user.id), eq(folders.name, parsed.data.name))
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: { name: ["A folder with this name already exists"] } };
  }

  await db
    .insert(folders)
    .values({ userId: session.user.id, name: parsed.data.name });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function renameFolder(id: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = renameFolderSchema.safeParse({ id, name });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, parsed.data.id), eq(folders.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    return { error: { id: ["Folder not found"] } };
  }

  await db
    .update(folders)
    .set({ name: parsed.data.name })
    .where(
      and(eq(folders.id, parsed.data.id), eq(folders.userId, session.user.id))
    );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteFolder(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    return { error: "Folder not found" };
  }

  await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));

  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveVariableToFolder(id: string, folderId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = moveVariableSchema.safeParse({ id, folderId });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.folderId !== null) {
    const owned = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(eq(folders.id, parsed.data.folderId), eq(folders.userId, session.user.id))
      )
      .limit(1);
    if (owned.length === 0) {
      return { error: { folderId: ["Folder not found"] } };
    }
  }

  const existing = await db
    .select({ id: variables.id })
    .from(variables)
    .where(and(eq(variables.id, parsed.data.id), eq(variables.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    return { error: { id: ["Variable not found"] } };
  }

  await db
    .update(variables)
    .set({ folderId: parsed.data.folderId })
    .where(
      and(eq(variables.id, parsed.data.id), eq(variables.userId, session.user.id))
    );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteVariables(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = variableIdsSchema.safeParse(ids);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") };
  }

  await db
    .delete(variables)
    .where(
      and(
        eq(variables.userId, session.user.id),
        inArray(variables.id, parsed.data)
      )
    );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveVariablesToFolder(
  ids: string[],
  folderId: string | null
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = bulkMoveSchema.safeParse({ ids, folderId });
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") };
  }

  if (parsed.data.folderId !== null) {
    const owned = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.id, parsed.data.folderId),
          eq(folders.userId, session.user.id)
        )
      )
      .limit(1);
    if (owned.length === 0) {
      return { error: "Folder not found" };
    }
  }

  await db
    .update(variables)
    .set({ folderId: parsed.data.folderId })
    .where(
      and(
        eq(variables.userId, session.user.id),
        inArray(variables.id, parsed.data.ids)
      )
    );

  revalidatePath("/dashboard");
  return { success: true };
}
