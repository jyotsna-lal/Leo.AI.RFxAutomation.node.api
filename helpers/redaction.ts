const SECRET_KEYS = new Set([
  "authorization",
  "access_token",
  "accesstoken",
  "password",
  "api_key",
  "apikey",
  "subscriptionkey",
  "ocp-apim-subscription-key",
  "cookie"
]);

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SECRET_KEYS.has(key.toLowerCase())
        ? "***REDACTED***"
        : redactSecrets(child);
    }

    return result;
  }

  if (typeof value === "string" && /^Bearer\s+/i.test(value)) {
    return "Bearer ***REDACTED***";
  }

  return value;
}
