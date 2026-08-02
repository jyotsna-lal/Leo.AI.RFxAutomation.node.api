# Agentic Procurement Automation

A Playwright + Cucumber + TypeScript automation framework for validating multi-turn procurement-agent workflows.

## Highlights

- API-first execution for conversational agent journeys
- Cucumber BDD scenarios
- Multi-turn scope, item, supplier, and draft validation
- Deterministic evidence checks
- Optional LLM-assisted semantic validation
- Mock transport for local execution
- Secret redaction and environment-based configuration

## Run

```bash
npm install
npm run typecheck
npm run mock:run
npm run test:api
```

The default setup uses mock responses and does not require external credentials.
