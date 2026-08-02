import { ConfigManager } from "./configManager";

export interface JudgeResult {
  score: number;
  passed: boolean;
  reason: string;
}

export interface JudgeInput {
  expectedOutcome: string;
  actualEvidence: string;
}

export class LlmService {
  async judge(input: JudgeInput): Promise<JudgeResult> {
    const config = ConfigManager.get();

    if (config.llmProvider === "mock") {
      const expectedWords = input.expectedOutcome
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 4);

      const actual = input.actualEvidence.toLowerCase();
      const matched = expectedWords.filter(word => actual.includes(word));
      const score = expectedWords.length === 0
        ? 1
        : matched.length / expectedWords.length;

      return {
        score,
        passed: score >= config.judgePassThreshold,
        reason: `Mock semantic judge matched ${matched.length}/${expectedWords.length} key terms.`
      };
    }

    throw new Error(
      `LLM provider "${config.llmProvider}" is not configured in this public sample.`
    );
  }
}
