import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

export interface RuntimeConfig {
  environment: string;
  baseUrl: string;
  runtimeApiUrl: string;
  subscriptionKey?: string;
  llmProvider: string;
  llmModel: string;
  judgePassThreshold: number;
}

export class ConfigManager {
  private static cached?: RuntimeConfig;

  static get(): RuntimeConfig {
    if (this.cached) return this.cached;

    const environment = process.env.TEST_ENV ?? "UAT";
    const fileConfig = this.readJsonConfig(environment);

    const judgePassThreshold = Number(
      process.env.JUDGE_PASS_THRESHOLD ??
      fileConfig.JUDGE_PASS_THRESHOLD ??
      0.75
    );

    if (!Number.isFinite(judgePassThreshold) || judgePassThreshold < 0 || judgePassThreshold > 1) {
      throw new Error("JUDGE_PASS_THRESHOLD must be a number between 0 and 1.");
    }

    this.cached = {
      environment,
      baseUrl: process.env.BASE_URL ?? fileConfig.BASE_URL ?? "https://example.invalid",
      runtimeApiUrl:
        process.env.RUNTIME_API_URL ??
        fileConfig.RUNTIME_API_URL ??
        "https://example.invalid/api/runtime",
      subscriptionKey:
        process.env.APIM_SUBSCRIPTION_KEY ??
        fileConfig.APIM_SUBSCRIPTION_KEY,
      llmProvider: process.env.LLM_PROVIDER ?? fileConfig.LLM_PROVIDER ?? "mock",
      llmModel: process.env.LLM_MODEL ?? fileConfig.LLM_MODEL ?? "mock-judge-v1",
      judgePassThreshold
    };

    return this.cached;
  }

  static reset(): void {
    this.cached = undefined;
  }

  private static readJsonConfig(environment: string): Record<string, unknown> {
    const configPath = path.resolve(
      process.cwd(),
      "fixtures",
      "config",
      `${environment.toLowerCase()}.json`
    );

    if (!fs.existsSync(configPath)) return {};

    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Invalid config file: ${configPath}`);
    }

    return parsed as Record<string, unknown>;
  }
}
