module.exports = {
  default: {
    requireModule: ["tsx/cjs"],
    require: [
      "tests/api/support/hooks.ts",
      "tests/api/step-definitions/**/*.ts"
    ],
    format: [
      "progress-bar",
      "json:reports/cucumber.json",
      "html:reports/cucumber.html"
    ],
    publishQuiet: true
  }
};
