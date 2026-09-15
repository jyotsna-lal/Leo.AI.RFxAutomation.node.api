import { parseAgentStream } from '../agentStreamParser.js';
import { validateWithAzureSemanticCheck } from '../validationUtils.js';

export type QuickQuoteJourneyStatus =
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'DRAFT_CREATED'
  | 'UNSUPPORTED'
  | 'FAILED';

export interface QuickQuoteJourneyEvidenceFlags {
  categorySeen: boolean;
  itemsSeen: boolean;
  suppliersSeen: boolean;
  confirmationSeen: boolean;
  draftSeen: boolean;
  scopeRecommendationSeen?: boolean;
  recommendedItemsSeen?: boolean;
  acceptedRecommendationsSent?: boolean;
  itemHandoffSeen?: boolean;
  reviewSeen?: boolean;
  budgetValidation?: 'validated' | 'not exposed in current response' | 'failed';
}

export interface QuickQuoteDeterministicInputs {
  itemsText: string;
  useRecommendedScopeMessage?: string;
  addItemsMessage?: string;
  createDraftMessage?: string;
}

export interface QuickQuoteJourneyTurnRequest {
  kind: 'prompt' | 'action';
  message: string;
  partialViewData?: string;
  widgetData?: string;
  attachments?: unknown[];
  parameters?: Record<string, unknown>;
}

export interface QuickQuoteJourneyTurnResponse {
  status: number;
  rawText?: string;
  responseJson?: unknown;
  assistantText?: string;
  sessionId: string;
}

export interface QuickQuoteJourneyTransport {
  sendTurn(request: QuickQuoteJourneyTurnRequest): Promise<QuickQuoteJourneyTurnResponse>;
}

export interface QuickQuoteJourneyOptions {
  initialPrompt: string;
  sessionId: string;
  deterministicInputs: QuickQuoteDeterministicInputs;
  expectedBusinessOutcome: string;
  transport: QuickQuoteJourneyTransport;
  maxTurns?: number;
}

export type QuickQuoteModificationType =
  | 'addSupplier'
  | 'changeQuantity'
  | 'changeDescription'
  | 'addLineItem';

export interface QuickQuoteModificationExpectation {
  type: QuickQuoteModificationType;
  targetText?: string;
  targetQuantity?: number;
}

export interface QuickQuoteModificationJourneyOptions extends QuickQuoteJourneyOptions {
  modificationPrompt: string;
  expectedChange: QuickQuoteModificationExpectation;
}

export interface QuickQuoteSupplierJourneyOptions extends QuickQuoteJourneyOptions {
  requireDraft: boolean;
}

export interface QuickQuoteSelectedAction {
  turnIndex: number;
  kind: 'prompt' | 'action';
  label: string;
  reason: string;
  payload?: Record<string, unknown>;
}

export interface QuickQuoteJourneyTurn {
  turnIndex: number;
  sessionId: string;
  userMessage: string;
  responseStatus: number;
  assistantText: string;
  requestKind: 'prompt' | 'action';
  decisionReason: string;
  diagnostics: Record<string, unknown>;
  evidence: QuickQuoteJourneyEvidenceFlags;
}

export interface QuickQuoteJourneyResult {
  sessionId: string;
  status: QuickQuoteJourneyStatus;
  stopReason: string;
  turns: QuickQuoteJourneyTurn[];
  selectedActions: QuickQuoteSelectedAction[];
  evidence: QuickQuoteJourneyEvidenceFlags;
  draftId?: string;
  rfxNumber?: string;
  finalStatus?: string;
  finalResponseText?: string;
  expectedBusinessOutcome: string;
  scopeRecommendation?: {
    category?: unknown;
    orgEntity?: unknown;
    region?: unknown;
    partialViewData: string;
  };
  recommendedItems: string[];
  acceptedItemPrompt?: string;
  itemHandoff?: {
    itemsInputMode?: string;
    itemList: string[];
  };
  documentId?: string;
  supplierNames: string[];
  reviewDocumentMetadata?: Record<string, unknown>;
  ctaVisibility?: Record<string, unknown>;
  budgetValidation: 'validated' | 'not exposed in current response' | 'failed';
  missingSchemas: string[];
  failureClassification?: QuickQuoteFailureClassification;
  modification?: {
    type: QuickQuoteModificationType;
    prompt: string;
    validationFailures: string[];
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
}

export interface QuickQuoteJourneyValidation {
  passed: boolean;
  deterministicFailures: string[];
  llm?: {
    passed: boolean;
    score: number;
    rationale: string;
  };
}

interface ParsedCustomEvent {
  index: number;
  toolName: string;
  contentType: string;
  delta: string;
}

interface TurnAnalysis {
  assistantText: string;
  cbr?: {
    category?: unknown;
    orgEntity?: unknown;
    region?: unknown;
    partialViewData: string;
  };
  recommendedItems: string[];
  itemHandoff?: {
    itemsInputMode?: string;
    itemList: string[];
  };
  review?: {
    documentMetadata?: Record<string, unknown>;
    ctaVisibility?: Record<string, unknown>;
    documentId?: string;
    supplierNames: string[];
  };
  budgetValidation: 'validated' | 'not exposed in current response' | 'failed';
  diagnostics: Record<string, unknown>;
  missingSchemas: string[];
}

export type QuickQuoteFailureClassification =
  | 'PASSED'
  | 'AGENT_FAILED'
  | 'UNSUPPORTED_RETURNED_SCHEMA'
  | 'PRECONDITION_OR_TEST_DATA_FAILED'
  | 'AUTOMATION_REQUEST_FAILED'
  | 'AUTOMATION_PARSER_FAILED'
  | 'EXPECTED_CHANGE_NOT_OBSERVED'
  | 'BUDGET_NOT_EXPOSED';

function blankEvidence(): QuickQuoteJourneyEvidenceFlags {
  return {
    categorySeen: false,
    itemsSeen: false,
    suppliersSeen: false,
    confirmationSeen: false,
    draftSeen: false,
    scopeRecommendationSeen: false,
    recommendedItemsSeen: false,
    acceptedRecommendationsSent: false,
    itemHandoffSeen: false,
    reviewSeen: false,
    budgetValidation: 'not exposed in current response',
  };
}

function mergeEvidence(left: QuickQuoteJourneyEvidenceFlags, right: QuickQuoteJourneyEvidenceFlags): QuickQuoteJourneyEvidenceFlags {
  return {
    categorySeen: left.categorySeen || right.categorySeen,
    itemsSeen: left.itemsSeen || right.itemsSeen,
    suppliersSeen: left.suppliersSeen || right.suppliersSeen,
    confirmationSeen: left.confirmationSeen || right.confirmationSeen,
    draftSeen: left.draftSeen || right.draftSeen,
    scopeRecommendationSeen: left.scopeRecommendationSeen || right.scopeRecommendationSeen,
    recommendedItemsSeen: left.recommendedItemsSeen || right.recommendedItemsSeen,
    acceptedRecommendationsSent: left.acceptedRecommendationsSent || right.acceptedRecommendationsSent,
    itemHandoffSeen: left.itemHandoffSeen || right.itemHandoffSeen,
    reviewSeen: left.reviewSeen || right.reviewSeen,
    budgetValidation: right.budgetValidation === 'validated' ? 'validated' : left.budgetValidation,
  };
}

function unwrapViewTemplate(delta: string): string {
  const content = delta.trim();
  const match = content.match(/^\$VIEW-START\$(.*)\$VIEW-END\$$/s);
  if (match) return match[1].trim();
  return content.replace(/^\$VIEW-START\$/, '').replace(/\$VIEW-END\$$/, '').trim();
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} was not a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

function getCustomEvents(rawText: string | undefined): ParsedCustomEvent[] {
  const parsed = parseAgentStream(rawText);
  const customEvents: ParsedCustomEvent[] = [];
  parsed.events.forEach((event, index) => {
    const payload = event.dataJson;
    if (!payload || typeof payload !== 'object') return;
    const record = payload as Record<string, unknown>;
    if (String(record.type ?? '').toLowerCase() !== 'custom') return;
    const rawEvent = record.rawEvent;
    if (!rawEvent || typeof rawEvent !== 'object') return;
    const rawRecord = rawEvent as Record<string, unknown>;
    customEvents.push({
      index,
      toolName: String(rawRecord.toolName ?? ''),
      contentType: String(rawRecord.contentType ?? ''),
      delta: typeof record.delta === 'string' ? record.delta : '',
    });
  });
  return customEvents;
}

function parseTemplateOverrides(delta: string, label: string): Record<string, { storeId: string; value: string }> {
  const template = parseJsonObject(unwrapViewTemplate(delta), label);
  const overrides = template.overrides ?? template.Overrides;
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error(`${label} missing overrides`);
  }

  const result: Record<string, { storeId: string; value: string }> = {};
  for (const [overrideKey, entry] of Object.entries(overrides as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const storeId = String(record.storeId ?? record.StoreId ?? overrideKey);
    const value = typeof (record.value ?? record.Value) === 'string'
      ? String(record.value ?? record.Value)
      : JSON.stringify(record.value ?? record.Value ?? '');
    result[storeId] = { storeId, value };
  }
  return result;
}

function extractCbrScope(rawText: string | undefined): TurnAnalysis['cbr'] | undefined {
  const event = getCustomEvents(rawText).find((entry) =>
    entry.toolName === 'cbr_front_door'
    && entry.contentType === 'PV_TEMPLATE'
  );
  if (!event) return undefined;
  const store = parseTemplateOverrides(event.delta, 'cbr_front_door PV_TEMPLATE').rfxAiEventCategoryDetails;
  if (!store?.value?.trim()) return undefined;
  const parsedValue = parseJsonObject(store.value, 'rfxAiEventCategoryDetails');
  if (!parsedValue.category || !parsedValue.orgEntity || !parsedValue.region) return undefined;
  return {
    category: parsedValue.category,
    orgEntity: parsedValue.orgEntity,
    region: parsedValue.region,
    partialViewData: store.value,
  };
}

function extractRecommendedItems(rawText: string | undefined): string[] {
  const event = getCustomEvents(rawText).find((entry) =>
    entry.toolName === 'rfxaipvquickquoteattachmentdrivenactions0015'
    && entry.contentType === 'PV_PRE_RENDER'
  );
  const delta = event?.delta ?? '';
  const items = Array.from(delta.matchAll(/"([^"]+)"/g))
    .map((match) => match[1].trim())
    .filter(Boolean);
  return [...new Set(items)];
}

function acceptedItemPrompt(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function parseToolArgs(rawText: string | undefined): Map<string, string> {
  const parsed = parseAgentStream(rawText);
  const argsByToolCall = new Map<string, string>();
  for (const event of parsed.events) {
    const payload = event.dataJson;
    if (!payload || typeof payload !== 'object') continue;
    const record = payload as Record<string, unknown>;
    if (String(record.type ?? '') !== 'TOOL_CALL_ARGS') continue;
    const id = String(record.toolCallId ?? '');
    const delta = typeof record.delta === 'string' ? record.delta : '';
    if (!id) continue;
    argsByToolCall.set(id, `${argsByToolCall.get(id) ?? ''}${delta}`);
  }
  return argsByToolCall;
}

function parseToolResults(rawText: string | undefined): Array<{ toolCallId: string; name: string }> {
  const parsed = parseAgentStream(rawText);
  const results: Array<{ toolCallId: string; name: string }> = [];
  for (const event of parsed.events) {
    const payload = event.dataJson;
    if (!payload || typeof payload !== 'object') continue;
    const record = payload as Record<string, unknown>;
    if (String(record.type ?? '') !== 'TOOL_CALL_RESULT') continue;
    results.push({
      toolCallId: String(record.toolCallId ?? ''),
      name: String(record.name ?? ''),
    });
  }
  return results;
}

function extractItemHandoff(rawText: string | undefined): TurnAnalysis['itemHandoff'] | undefined {
  const argsByToolCall = parseToolArgs(rawText);
  const result = parseToolResults(rawText).find((entry) => entry.name === 'handoff_to_create_rfx_qq_document');
  if (!result?.toolCallId) return undefined;
  const argsText = argsByToolCall.get(result.toolCallId);
  if (!argsText?.trim()) return undefined;
  const args = parseJsonObject(argsText, 'handoff_to_create_rfx_qq_document TOOL_CALL_ARGS');
  const itemList = Array.isArray(args.itemList)
    ? args.itemList.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
  return {
    itemsInputMode: typeof args.itemsInputMode === 'string' ? args.itemsInputMode : undefined,
    itemList,
  };
}

function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSupplierNames(suppliersHTML: unknown): string[] {
  if (typeof suppliersHTML !== 'string' || !suppliersHTML.trim()) return [];
  const names = new Set<string>();
  const attrPatterns = [
    /data-supplier-name=["']([^"']+)["']/gi,
    /data-name=["']([^"']+)["']/gi,
    /title=["']([^"']+)["']/gi,
  ];
  for (const pattern of attrPatterns) {
    for (const match of suppliersHTML.matchAll(pattern)) {
      const value = match[1].trim();
      if (value) names.add(value);
    }
  }
  for (const match of suppliersHTML.matchAll(/font-size:18px;\s*font-weight:600;\s*color:#222;\s*"\s*>\s*([^<]+?)\s*<\/div>/gi)) {
    const value = match[1].trim();
    if (value) names.add(value);
  }
  if (names.size === 0) {
    const text = stripHtml(suppliersHTML);
    for (const part of text.split(/\s{2,}|\|/).map((entry) => entry.trim()).filter(Boolean)) {
      if (!/supplier|profile status|sustainability score/i.test(part) && part.length > 2) {
        names.add(part.slice(0, 120));
      }
    }
  }
  return [...names];
}

function extractReview(rawText: string | undefined): TurnAnalysis['review'] | undefined {
  const event = getCustomEvents(rawText).find((entry) =>
    entry.toolName === 'qq_event_summary'
    && entry.contentType === 'PV_TEMPLATE'
  );
  if (!event) return undefined;
  const stores = parseTemplateOverrides(event.delta, 'qq_event_summary PV_TEMPLATE');
  const metadataStore = stores.documentMetadata;
  const ctaStore = stores.ctaVisibilityOverrides;
  const documentMetadata = metadataStore?.value?.trim()
    ? parseJsonObject(metadataStore.value, 'documentMetadata')
    : undefined;
  const ctaVisibility = ctaStore?.value?.trim()
    ? parseJsonObject(ctaStore.value, 'ctaVisibilityOverrides')
    : undefined;
  const documentId = typeof documentMetadata?.documentId === 'string' ? documentMetadata.documentId.trim() : undefined;
  const supplierNames = extractSupplierNames(documentMetadata?.suppliersHTML);
  return {
    documentMetadata,
    ctaVisibility,
    documentId,
    supplierNames,
  };
}

function analyzeTurn(response: QuickQuoteJourneyTurnResponse, userMessage: string): TurnAnalysis {
  const parsed = parseAgentStream(response.rawText, { userMessage });
  const parsedAssistant = parsed.bestCandidate?.candidate?.trim();
  const assistantText =
    parsedAssistant && parsedAssistant.toLowerCase() !== userMessage.trim().toLowerCase()
      ? parsedAssistant
      : response.assistantText?.trim() ?? '';

  const missingSchemas: string[] = [];
  let cbr: TurnAnalysis['cbr'];
  let itemHandoff: TurnAnalysis['itemHandoff'];
  let review: TurnAnalysis['review'];
  let recommendedItems: string[] = [];

  try {
    cbr = extractCbrScope(response.rawText);
  } catch (error) {
    missingSchemas.push(error instanceof Error ? error.message : String(error));
  }
  try {
    recommendedItems = extractRecommendedItems(response.rawText);
  } catch (error) {
    missingSchemas.push(error instanceof Error ? error.message : String(error));
  }
  try {
    itemHandoff = extractItemHandoff(response.rawText);
  } catch (error) {
    missingSchemas.push(error instanceof Error ? error.message : String(error));
  }
  try {
    review = extractReview(response.rawText);
  } catch (error) {
    missingSchemas.push(error instanceof Error ? error.message : String(error));
  }

  return {
    assistantText,
    cbr,
    recommendedItems,
    itemHandoff,
    review,
    budgetValidation: 'not exposed in current response',
    missingSchemas,
    diagnostics: {
      toolContentTypes: getCustomEvents(response.rawText).map((entry) => `${entry.toolName}:${entry.contentType}`),
      scopeRecommendation: cbr ? { category: cbr.category, orgEntity: cbr.orgEntity, region: cbr.region } : undefined,
      recommendedItems,
      itemHandoff,
      documentId: review?.documentId,
      supplierNames: review?.supplierNames ?? [],
      ctaVisibility: review?.ctaVisibility,
      budgetValidation: 'not exposed in current response',
      missingSchemas,
    },
  };
}

function promptRequest(message: string): QuickQuoteJourneyTurnRequest {
  return {
    kind: 'prompt',
    message,
    partialViewData: '',
    widgetData: '{}',
    attachments: [],
    parameters: { sourceType: 'prompt' },
  };
}

function scopeActionRequest(partialViewData: string): QuickQuoteJourneyTurnRequest {
  return {
    kind: 'action',
    message: 'Proceed with Selected Scope',
    partialViewData,
    widgetData: '{}',
    attachments: [],
    parameters: {
      systemMessage: 'Proceed with selected CBR details',
      description: '',
      instruction: '',
      project: 'dashboard-landing-page',
      sourceType: 'action',
    },
  };
}

export async function runQuickQuoteJourney(options: QuickQuoteJourneyOptions): Promise<QuickQuoteJourneyResult> {
  const maxTurns = options.maxTurns ?? 8;
  const turns: QuickQuoteJourneyTurn[] = [];
  const selectedActions: QuickQuoteSelectedAction[] = [];
  let evidence = blankEvidence();
  let status: QuickQuoteJourneyStatus = 'IN_PROGRESS';
  let stopReason = `maxTurns ${maxTurns} reached before draft evidence`;
  let nextRequest = promptRequest(options.initialPrompt);
  let scopeRecommendation: QuickQuoteJourneyResult['scopeRecommendation'];
  let recommendedItems: string[] = [];
  let acceptedPrompt: string | undefined;
  let itemHandoff: QuickQuoteJourneyResult['itemHandoff'];
  let documentId: string | undefined;
  let supplierNames: string[] = [];
  let reviewDocumentMetadata: Record<string, unknown> | undefined;
  let ctaVisibility: Record<string, unknown> | undefined;
  const missingSchemas: string[] = [];

  for (let turnIndex = 0; turnIndex < maxTurns; turnIndex += 1) {
    const response = await options.transport.sendTurn(nextRequest);
    const analysis = analyzeTurn(response, nextRequest.message);

    if (analysis.cbr) {
      scopeRecommendation = analysis.cbr;
      evidence.categorySeen = true;
      evidence.scopeRecommendationSeen = true;
    }
    if (analysis.recommendedItems.length > 0) {
      recommendedItems = analysis.recommendedItems;
      evidence.recommendedItemsSeen = true;
    }
    if (analysis.itemHandoff?.itemsInputMode === 'prompt' && analysis.itemHandoff.itemList.length > 0) {
      itemHandoff = analysis.itemHandoff;
      evidence.itemHandoffSeen = true;
      evidence.itemsSeen = true;
    }
    if (analysis.review) {
      evidence.reviewSeen = true;
      ctaVisibility = analysis.review.ctaVisibility;
      reviewDocumentMetadata = analysis.review.documentMetadata;
      documentId = analysis.review.documentId;
      supplierNames = analysis.review.supplierNames;
      if (supplierNames.length > 0) evidence.suppliersSeen = true;
      if (documentId) evidence.draftSeen = true;
    }
    if (acceptedPrompt && acceptedPrompt === nextRequest.message) {
      evidence.acceptedRecommendationsSent = true;
    }
    evidence.budgetValidation = evidence.budgetValidation === 'validated' ? 'validated' : analysis.budgetValidation;
    missingSchemas.push(...analysis.missingSchemas);

    turns.push({
      turnIndex,
      sessionId: response.sessionId,
      userMessage: nextRequest.message,
      responseStatus: response.status,
      assistantText: analysis.assistantText,
      requestKind: nextRequest.kind,
      decisionReason: selectedActions[selectedActions.length - 1]?.reason ?? 'initial business prompt',
      diagnostics: analysis.diagnostics,
      evidence: { ...evidence },
    });

    if (response.status < 200 || response.status >= 300) {
      status = 'FAILED';
      stopReason = `HTTP ${response.status}`;
      break;
    }

    if (evidence.scopeRecommendationSeen && turnIndex === 0) {
      if (!scopeRecommendation?.partialViewData) {
        status = 'UNSUPPORTED';
        stopReason = 'Missing rfxAiEventCategoryDetails';
        break;
      }
      const request = scopeActionRequest(scopeRecommendation.partialViewData);
      selectedActions.push({
        turnIndex,
        kind: 'action',
        label: request.message,
        reason: 'actual Proceed with Selected Scope button contract',
        payload: {
          partialViewData: request.partialViewData,
          widgetData: request.widgetData,
          attachments: request.attachments,
          parameters: request.parameters,
        },
      });
      nextRequest = request;
      status = 'AWAITING_CONFIRMATION';
      continue;
    }

    if (evidence.recommendedItemsSeen && !evidence.acceptedRecommendationsSent) {
      acceptedPrompt = acceptedItemPrompt(recommendedItems);
      if (!acceptedPrompt) {
        status = 'UNSUPPORTED';
        stopReason = 'No explicit recommended items in item-request PV_PRE_RENDER';
        break;
      }
      selectedActions.push({
        turnIndex,
        kind: 'prompt',
        label: acceptedPrompt,
        reason: 'send exact agent-recommended items',
      });
      nextRequest = promptRequest(acceptedPrompt);
      continue;
    }

    if (evidence.draftSeen) {
      status = 'DRAFT_CREATED';
      stopReason = 'qq_event_summary documentMetadata.documentId found';
      break;
    }

    status = 'UNSUPPORTED';
    stopReason = firstMissingSchema(evidence, missingSchemas);
    break;
  }

  return {
    sessionId: options.sessionId,
    status,
    stopReason,
    turns,
    selectedActions,
    evidence,
    draftId: documentId,
    documentId,
    finalResponseText: turns[turns.length - 1]?.assistantText,
    expectedBusinessOutcome: options.expectedBusinessOutcome,
    scopeRecommendation,
    recommendedItems,
    acceptedItemPrompt: acceptedPrompt,
    itemHandoff,
    supplierNames,
    reviewDocumentMetadata,
    ctaVisibility,
    budgetValidation: evidence.budgetValidation ?? 'not exposed in current response',
    missingSchemas,
    failureClassification: classifyCreationFailure(status, evidence, missingSchemas),
  };
}

export async function runQuickQuoteCreationJourney(options: QuickQuoteJourneyOptions): Promise<QuickQuoteJourneyResult> {
  return runQuickQuoteJourney(options);
}

export async function runQuickQuoteSupplierJourney(options: QuickQuoteSupplierJourneyOptions): Promise<QuickQuoteJourneyResult> {
  const result = await runQuickQuoteCreationJourney(options);
  if (!options.requireDraft && result.evidence.suppliersSeen) {
    return {
      ...result,
      status: result.status === 'FAILED' ? result.status : 'DRAFT_CREATED',
      stopReason: 'supplier records returned for current journey',
      failureClassification: 'PASSED',
    };
  }
  return result;
}

export async function runQuickQuoteModificationJourney(
  options: QuickQuoteModificationJourneyOptions,
): Promise<QuickQuoteJourneyResult> {
  const creation = await runQuickQuoteCreationJourney(options);
  const creationFailures = validateEvidenceForBaseDraft(creation.evidence);
  if (creationFailures.length > 0) {
    return {
      ...creation,
      failureClassification: classifyCreationFailure(creation.status, creation.evidence, creation.missingSchemas),
      modification: {
        type: options.expectedChange.type,
        prompt: options.modificationPrompt,
        validationFailures: [`base draft setup failed: ${creationFailures.join('; ')}`],
        before: summarizeReviewState(creation),
        after: {},
      },
    };
  }

  const request = promptRequest(options.modificationPrompt);
  const response = await options.transport.sendTurn(request);
  const analysis = analyzeTurn(response, request.message);
  let evidence = { ...creation.evidence };
  let supplierNames = creation.supplierNames;
  let documentId = creation.documentId;
  let reviewDocumentMetadata = creation.reviewDocumentMetadata;
  let ctaVisibility = creation.ctaVisibility;

  if (analysis.review) {
    evidence.reviewSeen = true;
    reviewDocumentMetadata = analysis.review.documentMetadata;
    ctaVisibility = analysis.review.ctaVisibility;
    documentId = analysis.review.documentId ?? documentId;
    supplierNames = analysis.review.supplierNames.length > 0 ? analysis.review.supplierNames : supplierNames;
    if (supplierNames.length > 0) evidence.suppliersSeen = true;
    if (documentId) evidence.draftSeen = true;
  }

  const before = summarizeReviewState(creation);
  const after = {
    ...summarizeReviewMetadata(reviewDocumentMetadata),
    supplierNames,
    documentId,
    assistantText: analysis.assistantText,
    toolContentTypes: analysis.diagnostics.toolContentTypes,
  };
  const modificationFailures = validateModificationChange(options.expectedChange, before, after);
  const turnIndex = creation.turns.length;
  const result: QuickQuoteJourneyResult = {
    ...creation,
    status: response.status >= 200 && response.status < 300 && modificationFailures.length === 0 ? 'DRAFT_CREATED' : 'FAILED',
    stopReason: modificationFailures.length === 0
      ? 'modification change observed in returned structured review state'
      : modificationFailures.join('; '),
    turns: [
      ...creation.turns,
      {
        turnIndex,
        sessionId: response.sessionId,
        userMessage: request.message,
        responseStatus: response.status,
        assistantText: analysis.assistantText,
        requestKind: request.kind,
        decisionReason: 'scenario modification prompt after independent draft setup',
        diagnostics: analysis.diagnostics,
        evidence,
      },
    ],
    evidence,
    finalResponseText: analysis.assistantText,
    documentId,
    draftId: documentId,
    supplierNames,
    reviewDocumentMetadata,
    ctaVisibility,
    missingSchemas: [...creation.missingSchemas, ...analysis.missingSchemas],
    failureClassification: response.status < 200 || response.status >= 300
      ? 'AUTOMATION_REQUEST_FAILED'
      : modificationFailures.length === 0
        ? 'PASSED'
        : classifyModificationFailure(options.expectedChange, modificationFailures),
    modification: {
      type: options.expectedChange.type,
      prompt: options.modificationPrompt,
      validationFailures: modificationFailures,
      before,
      after,
    },
  };
  return result;
}

function firstMissingSchema(evidence: QuickQuoteJourneyEvidenceFlags, errors: string[]): string {
  if (!evidence.scopeRecommendationSeen) return 'Missing rfxAiEventCategoryDetails';
  if (!evidence.recommendedItemsSeen) return 'No explicit recommended items in item-request PV_PRE_RENDER';
  if (!evidence.acceptedRecommendationsSent) return 'Accepted recommendations prompt was not sent';
  if (!evidence.itemHandoffSeen) return 'Missing handoff itemList';
  if (!evidence.reviewSeen) return 'Missing qq_event_summary documentMetadata';
  if (!evidence.draftSeen) return 'Empty documentId';
  if (!evidence.suppliersSeen) return 'No supplier records in suppliersHTML';
  return errors[0] ?? 'No supported TC01 next action or terminal evidence was available';
}

function classifyCreationFailure(
  status: QuickQuoteJourneyStatus,
  evidence: QuickQuoteJourneyEvidenceFlags,
  errors: string[],
): QuickQuoteFailureClassification {
  if (status === 'DRAFT_CREATED' && validateEvidenceForCreation(evidence).length === 0) return 'PASSED';
  if (status === 'FAILED') return 'AUTOMATION_REQUEST_FAILED';
  if (errors.length > 0) return 'AUTOMATION_PARSER_FAILED';
  if (!evidence.scopeRecommendationSeen) return 'AGENT_FAILED';
  if (evidence.draftSeen && evidence.reviewSeen && !evidence.suppliersSeen) return 'PRECONDITION_OR_TEST_DATA_FAILED';
  return 'UNSUPPORTED_RETURNED_SCHEMA';
}

function validateEvidenceForCreation(evidence: QuickQuoteJourneyEvidenceFlags): string[] {
  const failures: string[] = [];
  if (!evidence.scopeRecommendationSeen) failures.push('Missing rfxAiEventCategoryDetails');
  if (!evidence.recommendedItemsSeen) failures.push('No explicit recommended items in item-request PV_PRE_RENDER');
  if (!evidence.acceptedRecommendationsSent) failures.push('Accepted recommendations prompt was not sent');
  if (!evidence.itemHandoffSeen) failures.push('Missing handoff itemList');
  if (!evidence.itemsSeen) failures.push('Missing non-empty handoff itemList');
  if (!evidence.reviewSeen) failures.push('Missing qq_event_summary documentMetadata');
  if (!evidence.suppliersSeen) failures.push('No supplier records in suppliersHTML');
  if (!evidence.draftSeen) failures.push('Empty documentId');
  return failures;
}

function validateEvidenceForBaseDraft(evidence: QuickQuoteJourneyEvidenceFlags): string[] {
  return validateEvidenceForCreation(evidence).filter((failure) => failure !== 'No supplier records in suppliersHTML');
}

function summarizeReviewState(result: QuickQuoteJourneyResult): Record<string, unknown> {
  return {
    ...summarizeReviewMetadata(result.reviewDocumentMetadata),
    supplierNames: result.supplierNames,
    documentId: result.documentId,
  };
}

function metadataStringValue(metadata: Record<string, unknown> | undefined, names: string[]): string | undefined {
  if (!metadata) return undefined;
  const lookup = new Map(Object.entries(metadata).map(([key, value]) => [key.toLowerCase(), value]));
  for (const name of names) {
    const value = lookup.get(name.toLowerCase());
    if (typeof value === 'string' && value.trim()) return stripHtml(value);
  }
  return undefined;
}

function summarizeReviewMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  const summaryText = metadata ? stripHtml(JSON.stringify(metadata)) : '';
  return {
    eventName: metadataStringValue(metadata, ['eventName', 'rfxName', 'name', 'title']),
    description: metadataStringValue(metadata, ['description', 'eventDescription', 'rfxDescription']),
    lineItemsText: metadataStringValue(metadata, ['lineItemsHTML', 'lineItemsHtml', 'itemsHTML', 'itemsHtml', 'lineDetailsHTML', 'lineDetailsHtml']),
    suppliersText: metadataStringValue(metadata, ['suppliersHTML', 'suppliersHtml']),
    summaryText,
  };
}

function textIncludes(source: unknown, target: string | undefined): boolean {
  if (!target?.trim()) return false;
  return String(source ?? '').toLowerCase().includes(target.trim().toLowerCase());
}

function validateModificationChange(
  expectation: QuickQuoteModificationExpectation,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const failures: string[] = [];
  const target = expectation.targetText;
  const afterSummary = `${after.summaryText ?? ''} ${after.lineItemsText ?? ''} ${after.description ?? ''} ${after.eventName ?? ''} ${(after.supplierNames as string[] | undefined)?.join(' ') ?? ''}`;
  const toolContentTypes = Array.isArray(after.toolContentTypes) ? after.toolContentTypes.join(', ') : '(none)';
  const assistantText = String(after.assistantText ?? '');

  if (/\b(can['’]?t|cannot|unable to)\b[\s\S]{0,80}\b(edit|update|add|modify)\b/i.test(assistantText)) {
    failures.push(`agent reported it cannot perform the requested modification: ${assistantText.slice(0, 240)}`);
    return failures;
  }

  if (!after.documentId || (before.documentId && after.documentId !== before.documentId)) {
    failures.push('modified response did not preserve the scenario draft documentId');
  }

  switch (expectation.type) {
    case 'addSupplier':
      if (!textIncludes(afterSummary, target)) failures.push(`target supplier was not observed after modification: ${target}`);
      break;
    case 'changeQuantity':
      if (!after.lineItemsText) {
        failures.push(`updated structured line-item quantity was not exposed; returned tool/content types: ${toolContentTypes}`);
        break;
      }
      if (!textIncludes(afterSummary, target)) failures.push(`target line item was not observed after modification: ${target}`);
      if (expectation.targetQuantity !== undefined && !textIncludes(afterSummary, String(expectation.targetQuantity))) {
        failures.push(`target quantity was not observed after modification: ${expectation.targetQuantity}`);
      }
      break;
    case 'changeDescription':
      if (!after.description && !after.summaryText) {
        failures.push(`updated structured description was not exposed; returned tool/content types: ${toolContentTypes}`);
        break;
      }
      if (!textIncludes(after.description ?? afterSummary, target)) failures.push('requested description text was not observed in structured review state');
      break;
    case 'addLineItem':
      if (!after.lineItemsText) {
        failures.push(`updated structured line-item state was not exposed; returned tool/content types: ${toolContentTypes}`);
        break;
      }
      if (!textIncludes(after.lineItemsText ?? afterSummary, target)) failures.push(`target added line item was not observed after modification: ${target}`);
      break;
    default:
      failures.push(`unsupported modification type: ${(expectation as QuickQuoteModificationExpectation).type}`);
      break;
  }
  return failures;
}

function classifyModificationFailure(
  expectation: QuickQuoteModificationExpectation,
  failures: string[],
): QuickQuoteFailureClassification {
  if (expectation.type === 'addSupplier' && failures.some((entry) => entry.includes('target supplier'))) return 'PRECONDITION_OR_TEST_DATA_FAILED';
  if (failures.some((entry) => entry.includes('agent reported it cannot'))) return 'AGENT_FAILED';
  if (failures.some((entry) => entry.includes('documentId'))) return 'UNSUPPORTED_RETURNED_SCHEMA';
  if (failures.some((entry) => entry.includes('was not exposed'))) return 'UNSUPPORTED_RETURNED_SCHEMA';
  return 'EXPECTED_CHANGE_NOT_OBSERVED';
}

export function buildQuickQuoteJourneySummary(result: QuickQuoteJourneyResult): string {
  return [
    `sessionId: ${result.sessionId}`,
    `status: ${result.status}`,
    `stopReason: ${result.stopReason}`,
    `failureClassification: ${result.failureClassification ?? '(none)'}`,
    `documentId: ${result.documentId ?? '(none)'}`,
    `evidence: ${JSON.stringify(result.evidence)}`,
    `scopeRecommendation: ${JSON.stringify(result.scopeRecommendation ?? null)}`,
    `recommendedItems: ${JSON.stringify(result.recommendedItems)}`,
    `acceptedItemPrompt: ${result.acceptedItemPrompt ?? '(none)'}`,
    `itemHandoff: ${JSON.stringify(result.itemHandoff ?? null)}`,
    `supplierNames: ${JSON.stringify(result.supplierNames)}`,
    `reviewState: ${JSON.stringify(summarizeReviewState(result))}`,
    `modification: ${JSON.stringify(result.modification ?? null)}`,
    `ctaVisibility: ${JSON.stringify(result.ctaVisibility ?? null)}`,
    `budgetValidation: ${result.budgetValidation}`,
    `missingSchemas: ${JSON.stringify([...new Set(result.missingSchemas)])}`,
    `turns: ${result.turns.length}`,
    ...result.turns.flatMap((turn) => [
      `- turn ${turn.turnIndex} ${turn.requestKind}: ${turn.userMessage}`,
      `  status: ${turn.responseStatus}`,
      `  decisionReason: ${turn.decisionReason}`,
      `  assistant: ${turn.assistantText.slice(0, 700) || '(empty)'}`,
      `  diagnostics: ${JSON.stringify(turn.diagnostics)}`,
      `  evidence: ${JSON.stringify(turn.evidence)}`,
    ]),
  ].join('\n');
}

export function validateQuickQuoteJourneyDeterministically(result: QuickQuoteJourneyResult): string[] {
  const failures: string[] = [];
  const sessionIds = new Set([result.sessionId, ...result.turns.map((turn) => turn.sessionId)]);
  if (sessionIds.size !== 1) failures.push('same session was not preserved across turns');
  failures.push(...validateEvidenceForCreation(result.evidence));
  return failures;
}

export async function validateQuickQuoteJourneyWithJudge(result: QuickQuoteJourneyResult): Promise<QuickQuoteJourneyValidation> {
  const deterministicFailures = validateQuickQuoteJourneyDeterministically(result);
  if (deterministicFailures.length > 0) {
    return { passed: false, deterministicFailures };
  }

  const llm = await validateWithAzureSemanticCheck(
    buildQuickQuoteJourneySummary(result),
    result.turns[0]?.userMessage ?? 'Quick Quote TC01 journey',
    result.expectedBusinessOutcome,
  );

  return {
    passed: llm.passed,
    deterministicFailures,
    llm: {
      passed: llm.passed,
      score: llm.score,
      rationale: llm.rationale,
    },
  };
}
