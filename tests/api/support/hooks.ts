import { After, Before, Status } from "@cucumber/cucumber";
import { AutomationWorld } from "./world";
import { redactSecrets } from "../../../helpers/redaction";

Before(function (this: AutomationWorld) {
  this.prompt = "";
  this.expectedOutcome = "";
  this.journey = undefined;
});

After(async function (this: AutomationWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.journey) {
    await this.attach(
      JSON.stringify(redactSecrets(this.journey), null, 2),
      "application/json"
    );
  }
});
