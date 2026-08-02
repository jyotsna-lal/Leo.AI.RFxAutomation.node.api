import { MockTransport } from "../helpers/agent/mockTransport";
import { QuickQuoteJourneyRunner } from "../helpers/agent/quickQuoteJourneyRunner";
import { validateWithSemanticJudge } from "../helpers/validationUtils";

async function main(): Promise<void> {
  const runner = new QuickQuoteJourneyRunner(new MockTransport());

  const result = await runner.runCreationJourney(
    "Create a sourcing event for 100 business laptops and docking stations."
  );

  const validation = await validateWithSemanticJudge(
    result.evidence,
    "Draft procurement event with structured line items, suppliers, and document identifier."
  );

  console.log(JSON.stringify({ result, validation }, null, 2));

  if (!validation.passed) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
