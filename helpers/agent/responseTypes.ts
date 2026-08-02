export interface AgentEvent {
  type:
    | "MESSAGE"
    | "PARTIAL_VIEW"
    | "TOOL_CALL_ARGS"
    | "DOCUMENT"
    | "ERROR";
  name?: string;
  text?: string;
  data?: unknown;
}

export interface LineItem {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Supplier {
  name: string;
  score?: number;
}

export interface JourneyEvidence {
  scopeConfirmed: boolean;
  finalReviewConfirmed: boolean;
  items: LineItem[];
  suppliers: Supplier[];
  documentId?: string;
  rfxNumber?: string;
  status?: string;
  messages: string[];
}

export interface AgentTurn {
  request: {
    sourceType: "prompt" | "action";
    prompt?: string;
    actionKey?: string;
    payload?: unknown;
  };
  events: AgentEvent[];
}
