import { AgentEvent } from "./responseTypes";

export function parseAgentStream(raw: string): AgentEvent[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    return normalizeParsedPayload(parsed);
  }

  const events: AgentEvent[] = [];

  for (const line of trimmed.split(/\r?\n/)) {
    const cleaned = line.replace(/^data:\s*/, "").trim();
    if (!cleaned || cleaned === "[DONE]") continue;

    try {
      const parsed = JSON.parse(cleaned);
      events.push(...normalizeParsedPayload(parsed));
    } catch {
      events.push({ type: "MESSAGE", text: cleaned });
    }
  }

  return events;
}

function normalizeParsedPayload(payload: unknown): AgentEvent[] {
  if (Array.isArray(payload)) {
    return payload.flatMap(normalizeParsedPayload);
  }

  if (!payload || typeof payload !== "object") {
    return [{ type: "MESSAGE", text: String(payload ?? "") }];
  }

  const obj = payload as Record<string, unknown>;

  if (typeof obj.type === "string") {
    return [{
      type: normalizeType(obj.type),
      name: typeof obj.name === "string" ? obj.name : undefined,
      text: typeof obj.text === "string" ? obj.text : undefined,
      data: obj.data
    }];
  }

  if (Array.isArray(obj.events)) {
    return obj.events.flatMap(normalizeParsedPayload);
  }

  return [{ type: "MESSAGE", data: obj }];
}

function normalizeType(type: string): AgentEvent["type"] {
  const normalized = type.toUpperCase();

  if (normalized.includes("PARTIAL")) return "PARTIAL_VIEW";
  if (normalized.includes("TOOL")) return "TOOL_CALL_ARGS";
  if (normalized.includes("DOCUMENT")) return "DOCUMENT";
  if (normalized.includes("ERROR")) return "ERROR";
  return "MESSAGE";
}
