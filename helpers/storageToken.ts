import fs from "node:fs";
import path from "node:path";

export interface StoredToken {
  accessToken: string;
  expiresAt?: string;
}

export class StorageToken {
  constructor(private readonly tokenFile = ".auth/runtime.token.json") {}

  read(): StoredToken | undefined {
    const fullPath = path.resolve(process.cwd(), this.tokenFile);
    if (!fs.existsSync(fullPath)) return undefined;

    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8")) as StoredToken;

    if (!parsed.accessToken) return undefined;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return undefined;
    }

    return parsed;
  }

  write(token: StoredToken): void {
    const fullPath = path.resolve(process.cwd(), this.tokenFile);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(token, null, 2));
  }
}
