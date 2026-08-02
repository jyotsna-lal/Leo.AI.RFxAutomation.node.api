import { JourneyEvidence } from "./agent/responseTypes";
import { LlmService, JudgeResult } from "./llm_service";

export interface ValidationResult {
  passed: boolean;
  failures: string[];
  semantic?: JudgeResult;
}

export function validateDeterministically(
  evidence: JourneyEvidence
): ValidationResult {
  const failures: string[] = [];

  if (!evidence.scopeConfirmed) failures.push("Scope was not confirmed.");
  if (evidence.items.length === 0) failures.push("No structured line-item evidence found.");
  if (evidence.suppliers.length === 0) failures.push("No supplier evidence found.");
  if (!evidence.documentId) failures.push("Draft document ID was not captured.");
  if (!evidence.status || evidence.status.toLowerCase() !== "draft") {
    failures.push("Draft status was not confirmed.");
  }

  return {
    passed: failures.length === 0,
    failures
  };
}

export async function validateWithSemanticJudge(
  evidence: JourneyEvidence,
  expectedOutcome: string,
  llm = new LlmService()
): Promise<ValidationResult> {
  const deterministic = validateDeterministically(evidence);

  const semantic = await llm.judge({
    expectedOutcome,
    actualEvidence: JSON.stringify(evidence)
  });

  return {
    passed: deterministic.passed && semantic.passed,
    failures: [
      ...deterministic.failures,
      ...(semantic.passed ? [] : [`Semantic validation failed: ${semantic.reason}`])
    ],
    semantic
  };
}
