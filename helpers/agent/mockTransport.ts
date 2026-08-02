import { AgentTransport } from "./agentTransport";
import { RuntimeRequest } from "../runtimeUtils";

export class MockTransport implements AgentTransport {
  async send(request: RuntimeRequest): Promise<string> {
    if (request.sourceType === "prompt" && !request.actionKey) {
      return JSON.stringify([
        {
          "type": "MESSAGE",
          "text": "I found a suitable category, business unit, and region."
        },
        {
          "type": "PARTIAL_VIEW",
          "name": "scope_recommendation",
          "data": {
            "category": "IT Hardware",
            "businessUnit": "Corporate",
            "region": "India",
            "actions": ["Proceed with Selected Scope"]
          }
        }
      ]);
    }

    if (request.actionKey === "PROCEED_WITH_SELECTED_SCOPE") {
      return JSON.stringify([
        {
          "type": "MESSAGE",
          "text": "Selected scope confirmed."
        },
        {
          "type": "PARTIAL_VIEW",
          "name": "recommended_items",
          "data": {
            "items": [
              { "name": "Business Laptop", "quantity": 100, "unit": "EA" },
              { "name": "Laptop Docking Station", "quantity": 100, "unit": "EA" }
            ]
          }
        }
      ]);
    }

    if (request.sourceType === "prompt" && request.prompt.toLowerCase().includes("accept")) {
      return JSON.stringify([
        {
          "type": "TOOL_CALL_ARGS",
          "name": "create_procurement_event",
          "data": {
            "items": [
              { "name": "Business Laptop", "quantity": 100, "unit": "EA" },
              { "name": "Laptop Docking Station", "quantity": 100, "unit": "EA" }
            ],
            "suppliers": [
              { "name": "Northstar Technologies", "score": 0.94 },
              { "name": "Vertex Systems", "score": 0.89 }
            ]
          }
        },
        {
          "type": "MESSAGE",
          "text": "Final review confirmed."
        },
        {
          "type": "DOCUMENT",
          "name": "event_summary",
          "data": {
            "documentId": "DOC-DEMO-1001",
            "rfxNumber": "RFQ-DEMO-1001",
            "status": "Draft"
          }
        }
      ]);
    }

    return JSON.stringify([
      {
        "type": "ERROR",
        "text": `No mock response configured for request: ${JSON.stringify(request)}`
      }
    ]);
  }
}
