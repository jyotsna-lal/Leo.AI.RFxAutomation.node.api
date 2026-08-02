import { setWorldConstructor, World } from "@cucumber/cucumber";
import { JourneyRunResult } from "../../../helpers/agent/quickQuoteJourneyRunner";

export class AutomationWorld extends World {
  prompt = "";
  expectedOutcome = "";
  journey?: JourneyRunResult;
}

setWorldConstructor(AutomationWorld);
