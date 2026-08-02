import { APIRequestContext, request } from "@playwright/test";
import { ConfigManager } from "./configManager";
import { StorageToken } from "./storageToken";

export class AuthHelper {
  constructor(private readonly storage = new StorageToken()) {}

  async createApiContext(): Promise<APIRequestContext> {
    const config = ConfigManager.get();
    const stored = this.storage.read();

    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json"
    };

    if (stored?.accessToken) {
      headers.authorization = `Bearer ${stored.accessToken}`;
    }

    if (config.subscriptionKey) {
      headers["ocp-apim-subscription-key"] = config.subscriptionKey;
    }

    return request.newContext({
      baseURL: config.baseUrl,
      extraHTTPHeaders: headers
    });
  }
}
