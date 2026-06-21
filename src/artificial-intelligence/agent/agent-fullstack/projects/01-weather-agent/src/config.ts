import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY 不能为空"),
  OPENAI_BASE_URL: z.string().url().optional().default("https://api.deepseek.com"),
  DEFAULT_MODEL: z.string().min(1).default("deepseek-v4-flash"),
  VECTOR_STORE_PATH: z.string().optional().default("./data/vector-store"),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const raw = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    DEFAULT_MODEL: process.env.DEFAULT_MODEL,
    VECTOR_STORE_PATH: process.env.VECTOR_STORE_PATH,
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
    );
    throw new Error(`环境变量校验失败：\n${issues.join("\n")}`);
  }

  return result.data;
}

export const config = loadConfig();
