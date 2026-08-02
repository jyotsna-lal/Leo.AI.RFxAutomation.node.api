import { RuntimeRequest } from "../runtimeUtils";

export interface AgentTransport {
  send(request: RuntimeRequest): Promise<string>;
}
