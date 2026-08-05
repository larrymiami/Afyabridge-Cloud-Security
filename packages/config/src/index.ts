import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production"]),
  APP_COUNTRY: z.enum(["KE", "GH", "ZA"]),
  APP_BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type ApplicationEnvironment = z.infer<typeof environmentSchema>;

let cachedEnvironment: ApplicationEnvironment | undefined;

export function getEnvironment(
  source: NodeJS.ProcessEnv = process.env
): ApplicationEnvironment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");

    throw new Error(`Invalid application configuration: ${fields}`);
  }

  cachedEnvironment = result.data;
  return cachedEnvironment;
}
