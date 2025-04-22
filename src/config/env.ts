import dotenv from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "local") {
  dotenv.config({ path: ".env.local" });
}

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "Missing OpenAI API key"),
  GCP_PROJECT_ID: z.string().min(1, "Missing GCP project Id"),
  USE_GCS: z.string().min(1, "Missing GCS Usage Flag"),
  CSV_BUCKET: z.string().min(1, "Missing GCS Input Path"),
  USE_AUTH: z.string().min(1, "Missing Use AUTH Flag"),
  API_SECRET_TOKEN: z.string().min(1, "Missing API Secret Token"),
  PORT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
