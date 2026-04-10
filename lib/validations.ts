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
