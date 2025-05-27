import type { ZodType, ZodTypeDef } from "zod";

export type GenerateObjectOptions = {
  /** Schema for structured object generation */
  schema?: ZodType<unknown, ZodTypeDef, unknown>;
  /** Optional schema name */
  schemaName?: string;
  /** Optional schema description */
  schemaDescription?: string;
};
