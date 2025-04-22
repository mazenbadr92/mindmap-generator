import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  GCP_PROJECT_ID: z.string(),
  USE_GCS: z.string(),
  CSV_BUCKET: z.string(),
  USE_AUTH: z.string(),
  API_SECRET_TOKEN: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
