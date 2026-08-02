import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { AutomationWorld } from "../../support/world";
import { MockTransport } from "../../../../helpers/agent/mockTransport";
import { QuickQuoteJourneyRunner } from "../../../../helpers/agent/quickQuoteJourneyRunner";
import { validateWithSemanticJudge } from "../../../../helpers/validationUtils";

Given(
  "the procurement agent prompt is:",
  function (this: AutomationWorld, prompt: string) {
    this.prompt = prompt.trim();
  }
);

Given(
  "the expected business outcome is:",
  function (this: AutomationWorld, expected: string) {
    this.expectedOutcome = expected.trim();
  }
);

When(
  "I run the procurement creation journey",
  async function (this: AutomationWorld) {
    const runner = new QuickQuoteJourneyRunner(new MockTransport());
    this.journey = await runner.runCreationJourney(this.prompt);
  }
);

Then(
  "the journey should create a draft event with line items and suppliers",
  async function (this: AutomationWorld) {
    assert.ok(this.journey, "Journey result is missing.");

    const validation = await validateWithSemanticJudge(
      this.journey.evidence,
      this.expectedOutcome
    );

    assert.equal(
      validation.passed,
      true,
      validation.failures.join("\n")
    );
  }
);
