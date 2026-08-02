import { AgentTransport } from "./agentTransport";
import { parseAgentStream } from "./streamParser";
import { extractEvidence, emptyEvidence } from "./evidenceExtractor";
import { AgentTurn, JourneyEvidence } from "./responseTypes";
import {
  buildActionRequest,
  buildPromptRequest,
  createSessionId
} from "../runtimeUtils";

export interface JourneyRunResult {
  sessionId: string;
  turns: AgentTurn[];
  evidence: JourneyEvidence;
}

export class QuickQuoteJourneyRunner {
  constructor(private readonly transport: AgentTransport) {}

  async runCreationJourney(initialPrompt: string): Promise<JourneyRunResult> {
    const sessionId = createSessionId();
    const turns: AgentTurn[] = [];
    let evidence = emptyEvidence();

    const first = await this.executeTurn(
      buildPromptRequest(sessionId, initialPrompt)
    );
    turns.push(first);
    evidence = extractEvidence(first.events, evidence);

    const scopePayload = this.findScopePayload(first);
    const second = await this.executeTurn(
      buildActionRequest(
        sessionId,
        "PROCEED_WITH_SELECTED_SCOPE",
        scopePayload
      )
    );
    turns.push(second);
    evidence = extractEvidence(second.events, evidence);

    const acceptedItems = evidence.items;
    if (acceptedItems.length === 0) {
      throw new Error("Agent did not return structured recommended items.");
    }

    const acceptancePrompt = [
      "Accept the recommended items and continue.",
      `Items: ${acceptedItems.map(item => item.name).join(", ")}`
    ].join(" ");

    const third = await this.executeTurn(
      buildPromptRequest(sessionId, acceptancePrompt)
    );
    turns.push(third);
    evidence = extractEvidence(third.events, evidence);

    return {
      sessionId,
      turns,
      evidence
    };
  }

  private async executeTurn(
    request: ReturnType<typeof buildPromptRequest> |
             ReturnType<typeof buildActionRequest>
  ): Promise<AgentTurn> {
    const raw = await this.transport.send(request);
    const events = parseAgentStream(raw);

    const error = events.find(event => event.type === "ERROR");
    if (error) {
      throw new Error(error.text ?? "Agent returned an error event.");
    }

    return {
      request: {
        sourceType: request.sourceType,
        prompt: request.prompt,
        actionKey: request.actionKey,
        payload: request.payload
      },
      events
    };
  }

  private findScopePayload(turn: AgentTurn): unknown {
    const scopeEvent = turn.events.find(
      event =>
        event.type === "PARTIAL_VIEW" &&
        event.name === "scope_recommendation"
    );

    if (!scopeEvent?.data) {
      throw new Error("Scope recommendation payload was not found.");
    }

    return scopeEvent.data;
  }
}
