import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters."),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.coerce.number().int().positive().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(environment: Record<string, unknown>) {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.errors.map((error) => error.message).join(", ")}`,
    );
  }

  return result.data;
}
