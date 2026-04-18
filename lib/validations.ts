import { z } from "zod";

export const variableKeySchema = z
  .string()
  .min(1, "Key is required")
  .max(64, "Key must be 64 characters or less")
  .regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric with hyphens only");

export const variableValueSchema = z
  .string()
  .max(10240, "Value must be 10KB or less");

export const createVariableSchema = z.object({
  key: variableKeySchema,
  value: variableValueSchema,
});

export const updateVariableSchema = z.object({
  id: z.string().uuid(),
  value: variableValueSchema,
});

export const folderNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(64, "Name must be 64 characters or less")
  .regex(/^[\w\- ]+$/, "Name may contain letters, numbers, spaces, hyphens, and underscores");

export const createFolderSchema = z.object({
  name: folderNameSchema,
});

export const renameFolderSchema = z.object({
  id: z.string().uuid(),
  name: folderNameSchema,
});

export const moveVariableSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
});

export const variableIdsSchema = z
  .array(z.string().uuid())
  .min(1, "Select at least one variable")
  .max(500, "Too many variables selected");

export const bulkMoveSchema = z.object({
  ids: variableIdsSchema,
  folderId: z.string().uuid().nullable(),
});
