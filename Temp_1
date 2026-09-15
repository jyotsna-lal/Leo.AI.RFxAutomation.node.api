import { Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { CustomWorld } from '../../support/hooks.js';
import { PROJECT_ROOT } from '../../../../helpers/configManager.js';
import { BrowserConversationAdapter } from '../../../../helpers/hybrid/browserConversationAdapter.js';
import { captureBrowserWorkflowTurn, safeBrowserWorkflowTurnSummary, type BrowserWorkflowTurnCapture } from '../../../../helpers/hybrid/browserWorkflowTurnCapture.js';
import { DeterministicHybridController } from '../../../../helpers/hybrid/deterministicHybridController.js';
import { AzureJourneyPlanner, getJourneyPlannerConfig } from '../../../../helpers/hybrid/azureJourneyPlanner.js';
import { resolveHybridExecutionMode } from '../../../../helpers/hybrid/executionMode.js';
import { QuickQuoteCompletionEvidenceAdapter } from '../../../../helpers/hybrid/quickQuoteCompletionEvidenceAdapter.js';
import { validateQuickQuoteJourneyWithJudge } from '../../../../helpers/agent/quickQuoteJourneyRunner.js';
import type { InteractionHistoryEntry, JourneyDecision, JourneySafetyPolicy, UiObservation } from '../../../../helpers/hybrid/uiContracts.js';
import { attachHybridReport, recordHybridLog } from '../../../../helpers/hybrid/hybridRunReporter.js';

interface Phase3Result {
  promptSubmittedThroughUi: boolean;
  scopeConfirmedThroughUi: boolean;
  itemClarificationObserved: boolean;
  itemResponseSubmittedThroughUi: boolean;
  draftReviewObserved: boolean;
  lineItemsObserved: boolean;
  suppliersObserved: boolean;
  documentIdCaptured: boolean;
  browserWorkflowTurnsCaptured: boolean;
  backendPayloadReconstructionUsed: false;
  destructiveActionExecuted: false;
  deterministicValidationPassed: boolean;
  deterministicFailures: string[];
  judgeExecuted: boolean;
  judgePassed: boolean;
  judgeDeferredToModification: boolean;
  judgeScore?: number;
  plannerRequiredEvents: number;
  plannerCallCount: number;
  plannerLatencyMs: number;
  executionMode: string;
  interactionHistory: readonly InteractionHistoryEntry[];
  screenshots: string[];
}

async function reportHybridProgress(world: CustomWorld, message: string): Promise<void> {
  recordHybridLog(world.hybridLogEntries, message);
}

function preview(value: string, maximumLength = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maximumLength ? `${normalized.slice(0, maximumLength)}...` : normalized;
}

When(
  'I run the compiled Quick Quote creation journey through the hybrid UI',
  { timeout: 420_000 },
  async function (this: CustomWorld) {
    assert(this.page, 'Hybrid CustomWorld.page was not initialized');
    assert(this.apiContext, 'Hybrid CustomWorld.apiContext was not initialized');
    assert(this.agentTurnRecorder, 'AgentTurnRecorder was not initialized');
    const plan = this.structuredScenarioPlan;
    assert(plan, 'StructuredScenarioPlan was not compiled at scenario initialization');

    const executionMode = resolveHybridExecutionMode();
    const plannerConfig = getJourneyPlannerConfig();
    const runDirectory = path.join(PROJECT_ROOT, 'test-results', 'hybrid-phase7', plan.scenarioId.toLowerCase(), executionMode.toLowerCase(), new Date().toISOString().replace(/[:.]/g, '-'));
    fs.mkdirSync(runDirectory, { recursive: true });
    const adapter = new BrowserConversationAdapter(this.page, runDirectory);
    const captures: BrowserWorkflowTurnCapture[] = [];
    this.scenarioContext.set('__hybrid_phase7_captures__', captures);
    const screenshots: string[] = [];
    const completion = new QuickQuoteCompletionEvidenceAdapter(this.page, adapter, plan, captures);
    const controller = new DeterministicHybridController();
    const policy: JourneySafetyPolicy = { maxTurns: plan.maxTurns, maxWaitDecisions: 4, maxRepeatedState: 3, maxTextLength: 2_000, minimumPlannerConfidence: plannerConfig.minimumConfidence };
    const startedAt = Date.now();
    await reportHybridProgress(this, `${plan.scenarioId} started | mode=${executionMode} | objective=${preview(plan.objective)}`);
    const waitForStableResponse = async (beforeCount: number, requireAction: boolean): Promise<void> => {
      try {
        await adapter.waitForAgentResponseComplete(beforeCount, requireAction, 180_000);
      } catch (error) {
        const timeoutObservation = await adapter.observeLatestResponse('response-timeout.png').catch(() => undefined);
        if (timeoutObservation) this.scenarioContext.set('__hybrid_timeout_observation__', timeoutObservation);
        const message = timeoutObservation?.latestAgentMessage ?? '';
        const classification = /select\s+category/i.test(message) && /select\s+business\s+unit/i.test(message) && /select\s+region/i.test(message)
          ? 'UAT_BUSINESS_DATA_FAILURE'
          : 'WORKFLOW_RESPONSE_CORRELATION_FAILURE';
        throw new Error(`[${classification}] ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    await reportHybridProgress(this, `Selecting configured agent: ${plan.agent}`);
    await adapter.selectAgent(plan.agent);
    await reportHybridProgress(this, `Agent selected: ${plan.agent}`);
    const controllerResult = await controller.run({
      scenarioPlan: plan,
      policy,
      mode: executionMode,
      planner: executionMode === 'HYBRID_LLM' ? new AzureJourneyPlanner(plannerConfig) : undefined,
      plannerLimits: { minimumConfidence: plannerConfig.minimumConfidence, maximumCallsPerScenario: plannerConfig.maximumCallsPerScenario, maximumInputChars: plannerConfig.maximumInputChars },
      observe: async (turn) => {
        const observed = await adapter.observeCurrentState(`observation-${String(turn).padStart(2, '0')}.png`);
        const enriched = await completion.enrich(observed);
        const enabledActions = enriched.availableActions.filter((action) => action.visible && action.enabled).map((action) => action.label);
        await reportHybridProgress(this,
          `Turn ${turn} observation | loading=${enriched.loading} | input=${enriched.currentInputCapability} | actions=${preview(enabledActions.join(', '), 160) || 'none'} | message=${preview(enriched.latestAgentMessage) || '(none)'}`,
        );
        if (enriched.completionEvidence) {
          await reportHybridProgress(this,
            `Terminal draft observed | document=${enriched.completionEvidence.documentId ?? 'missing'} | lineItems=${enriched.completionEvidence.lineItemsPresent} | suppliers=${enriched.completionEvidence.suppliersPresent}`,
          );
        }
        screenshots.push(enriched.screenshotPath);
        return enriched;
      },
      refreshAction: (runtimeActionId) => adapter.refreshAction(runtimeActionId),
      executeText: async (decision) => {
        await reportHybridProgress(this, `${decision.source} executes ${decision.semanticAction} | text=${preview(decision.responseText)}`);
        const beforeCount = await adapter.visibleAnswerCount();
        const capture = await captureBrowserWorkflowTurn(this.page!, this.agentTurnRecorder!, {
          interactionId: `turn-${captures.length + 1}-${decision.semanticAction.toLowerCase()}`,
          userAction: 'prompt',
          userMessage: decision.responseText,
          execute: () => adapter.enterText('active-prompt-composer', decision.responseText),
        });
        captures.push(capture);
        await waitForStableResponse(beforeCount, decision.semanticAction === 'ENTER_INITIAL_PROMPT');
        await reportHybridProgress(this, `${decision.semanticAction} completed through the browser UI`);
      },
      executeAction: async (decision, observation) => {
        const beforeCount = await adapter.visibleAnswerCount();
        const label = observation.availableActions.find((action) => action.runtimeActionId === decision.selectedRuntimeActionId)?.label ?? 'runtime action';
        await reportHybridProgress(this, `${decision.source} executes ${decision.semanticAction} | runtimeActionId=${decision.selectedRuntimeActionId} | label=${label}`);
        const capture = await captureBrowserWorkflowTurn(this.page!, this.agentTurnRecorder!, {
          interactionId: `turn-${captures.length + 1}-${decision.semanticAction.toLowerCase()}`,
          userAction: 'action',
          userMessage: label,
          execute: () => adapter.executeAction(decision.selectedRuntimeActionId),
        });
        captures.push(capture);
        await waitForStableResponse(beforeCount, false);
        await reportHybridProgress(this, `${decision.semanticAction} completed through the browser UI`);
      },
      wait: () => this.page!.waitForTimeout(1_500),
      record: async (entry, observation) => {
        const selectedAction = entry.decision.decisionType === 'UI_ACTION' ? ` | action=${entry.decision.selectedRuntimeActionId}` : '';
        await reportHybridProgress(this,
          `Turn ${entry.turn} decision | source=${entry.decision.source} | type=${entry.decision.decisionType}${selectedAction} | status=${entry.executionStatus} | reason=${preview(entry.decision.reason)}`,
        );
      },
      recordPlanner: async (plannerEvidence) => {
        const plannerDecision = plannerEvidence.result?.decision;
        await reportHybridProgress(this,
          `Planner call ${plannerEvidence.call} | escalation=${plannerEvidence.deterministicEscalation.unresolvedContext} | decision=${plannerDecision?.decisionType ?? 'FAILED'} | semantic=${plannerDecision?.semanticAction ?? 'none'} | confidence=${plannerDecision?.confidence ?? 'n/a'} | latencyMs=${plannerEvidence.result?.latencyMs ?? 'n/a'} | policy=${plannerEvidence.policyValidation?.valid === false ? 'FAILED' : 'PASSED'}`,
        );
      },
    });

    if (controllerResult.decision.decisionType === 'PLANNER_REQUIRED') {
      throw new Error(`[hybrid-phase5] PLANNER_REQUIRED: ${controllerResult.decision.reason}`);
    }
    assert.equal(controllerResult.decision.decisionType, 'STOP_SUCCESS', `Deterministic controller stopped with ${controllerResult.decision.decisionType}: ${controllerResult.decision.reason}`);
    assert(completion.latestJourneyResult, 'Quick Quote journey result was not produced from browser evidence');
    assert(completion.latestDraftObservation, 'Draft observation was not produced');
    await reportHybridProgress(this, `Controller completed | decision=${controllerResult.decision.decisionType} | plannerCalls=${controllerResult.plannerCallCount}`);
    const validation = await validateQuickQuoteJourneyWithJudge(completion.latestJourneyResult, {
      runJudgeOnDeterministicFailure: true,
    });
    await reportHybridProgress(this,
      `Deterministic validation | passed=${completion.latestDeterministicFailures.length === 0} | failures=${completion.latestDeterministicFailures.join('; ') || 'none'}`,
    );
    await reportHybridProgress(this,
      `Final judge | executed=${Boolean(validation.llm)} | passed=${validation.llm?.passed ?? false} | score=${validation.llm?.score ?? 'n/a'} | rationale=${preview(validation.llm?.rationale ?? 'judge was not executed')}`,
    );
    const safeCaptures = captures.map(safeBrowserWorkflowTurnSummary);
    const semanticActions = controllerResult.history.map((entry) => entry.decision.decisionType === 'PLANNER_REQUIRED' ? 'PLANNER_REQUIRED' : entry.decision.semanticAction);

    const result: Phase3Result = {
      promptSubmittedThroughUi: semanticActions.includes('ENTER_INITIAL_PROMPT'),
      scopeConfirmedThroughUi: semanticActions.includes('CONFIRM_CURRENT_STATE'),
      itemClarificationObserved: semanticActions.includes('PROVIDE_FREE_TEXT'),
      itemResponseSubmittedThroughUi: semanticActions.includes('PROVIDE_FREE_TEXT'),
      draftReviewObserved: completion.latestDraftObservation.stateType === 'DOCUMENT_DRAFT_REVIEW',
      lineItemsObserved: completion.latestDraftObservation.lineItemsObserved,
      suppliersObserved: completion.latestDraftObservation.suppliersObserved,
      documentIdCaptured: Boolean(completion.latestJourneyResult.documentId),
      browserWorkflowTurnsCaptured: captures.length >= 2,
      backendPayloadReconstructionUsed: false,
      destructiveActionExecuted: false,
      deterministicValidationPassed: completion.latestDeterministicFailures.length === 0,
      deterministicFailures: completion.latestDeterministicFailures,
      judgeExecuted: Boolean(validation.llm),
      judgePassed: validation.llm?.passed ?? false,
      judgeDeferredToModification: plan.scenarioFamily === 'MODIFICATION',
      judgeScore: validation.llm?.score,
      plannerRequiredEvents: controllerResult.history.filter((entry) => entry.decision.decisionType === 'PLANNER_REQUIRED').length,
      plannerCallCount: controllerResult.plannerCallCount,
      plannerLatencyMs: controllerResult.plannerInvocations.reduce((total, invocation) => total + (invocation.result?.latencyMs ?? 0), 0),
      executionMode,
      interactionHistory: controllerResult.history,
      screenshots,
    };
    this.scenarioContext.set('__hybrid_phase3_result__', result);
    this.scenarioContext.set('__hybrid_phase7_adapter__', adapter);
    this.scenarioContext.set('__hybrid_phase7_run_directory__', runDirectory);
    this.scenarioContext.set('__hybrid_phase7_captures__', captures);

    const evidence = {
      scenarioPlan: plan,
      sourceMapping: this.scenarioCompilation?.sourceMap,
      policy,
      browserWorkflowTurns: safeCaptures,
      parsedAnalyses: completion.latestAnalyses,
      draftObservation: completion.latestDraftObservation,
      journeyResult: completion.latestJourneyResult,
      deterministicFailures: completion.latestDeterministicFailures,
      finalValidation: validation,
      controllerResult,
      phase3Result: result,
      durationMs: Date.now() - startedAt,
    };
    fs.writeFileSync(path.join(runDirectory, 'hybrid-evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');
    await attachHybridReport({
      title: 'Hybrid execution - creation, decisions and judge',
      attach: this.attach,
      entries: this.hybridLogEntries.slice(this.hybridReportedLogCount),
      summary: {
        scenarioId: plan.scenarioId,
        objective: plan.objective,
        initialPrompt: plan.initialPrompt,
        executionMode,
        interactionHistory: controllerResult.history,
        plannerInvocations: controllerResult.plannerInvocations,
        plannerCallCount: controllerResult.plannerCallCount,
        deterministicFailures: completion.latestDeterministicFailures,
        finalJudge: validation.llm,
        result,
      },
      workflowStreams: captures.map((capture) => ({ interactionId: capture.interactionId, rawText: capture.rawText })),
      screenshots,
    });
    this.hybridReportedLogCount = this.hybridLogEntries.length;

    assert.deepEqual(completion.latestDeterministicFailures, [], `Hybrid deterministic validation failed: ${completion.latestDeterministicFailures.join('; ')}`);
    if (plan.scenarioFamily !== 'MODIFICATION') {
      assert.equal(validation.llm?.passed, true, `Final judge failed: ${validation.llm?.rationale ?? 'judge was not executed'}`);
    }
  },
);

Then('the compiled hybrid Quick Quote outcome should be validated', function (this: CustomWorld) {
  const result = this.scenarioContext.get('__hybrid_phase3_result__') as Phase3Result | undefined;
  assert(result, 'Phase 5 result was not recorded');
  assert.equal(result.draftReviewObserved, true);
  const plan = this.structuredScenarioPlan;
  assert(plan, 'StructuredScenarioPlan is unavailable');
  if (plan.expectedOutcome.lineItemsPresent) assert.equal(result.lineItemsObserved, true);
  if (plan.expectedOutcome.suppliersPresent) assert.equal(result.suppliersObserved, true);
  assert.equal(result.documentIdCaptured, true);
  assert.equal(result.browserWorkflowTurnsCaptured, true);
  assert.equal(result.backendPayloadReconstructionUsed, false);
  assert.equal(result.destructiveActionExecuted, false);
  assert.equal(result.deterministicValidationPassed, true);
  assert.equal(result.judgeExecuted, true);
  assert.equal(result.judgePassed, true);
  assert.equal(result.plannerRequiredEvents, 0);
});
