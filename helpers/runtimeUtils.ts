import { randomUUID } from "node:crypto";

export interface RuntimeRequest {
  sessionId: string;
  prompt: string;
  sourceType: "prompt" | "action";
  actionKey?: string;
  payload?: unknown;
}

export function createSessionId(): string {
  return randomUUID();
}

export function buildPromptRequest(
  sessionId: string,
  prompt: string
): RuntimeRequest {
  return {
    sessionId,
    prompt: prompt.trim(),
    sourceType: "prompt"
  };
}

export function buildActionRequest(
  sessionId: string,
  actionKey: string,
  payload: unknown
): RuntimeRequest {
  return {
    sessionId,
    prompt: "",
    sourceType: "action",
    actionKey,
    payload
  };
}

export function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} cannot be empty.`);
  return trimmed;
}
