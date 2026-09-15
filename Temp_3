import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLAYWRIGHT_ENV = {
  CONFIG_JSON: 'CONFIG_JSON',
  QA_AUTOMATION_OPENAI_URL: 'QA_AUTOMATION_OPENAI_URL',
  QA_AUTOMATION_OPENAI_API_KEY: 'QA_AUTOMATION_OPENAI_API_KEY',
} as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, '..');

export type PortalConfigJson = {
  BASEURL?: string;
  APIMSUBSCRIPTIONKEY?: string;
  APIURL?: string;

  CLIENT_NAME?: string;
  LOGIN_PROFILE?: string;
  BPC_CODE?: string;

  AGENTIC_RUNTIME_API_BASE_URL?: string;
  UAT_AGENTIC_RUNTIME_API_BASE_URL?: string;
  DEV_AGENTIC_RUNTIME_API_BASE_URL?: string;
  QC_AGENTIC_RUNTIME_API_BASE_URL?: string;
  PROD_AGENTIC_RUNTIME_API_BASE_URL?: string;

  PORTAL_AGENTIC_RUNTIME_API_BASE_URL?: string;
  PORTAL_API_BASE_URL?: string;
  PORTAL_ORCHESTRATOR_API_BASE_URL?: string;

  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
  AZURE_OPENAI_API_VERSION?: string;
  QA_AUTOMATION_OPENAI_URL?: string;
  QA_AUTOMATION_OPENAI_API_KEY?: string;

  JUDGE_PASS_THRESHOLD?: string | number;
  AI_EVENTS_PILL_REGEX?: string;
  AI_EVENTS_TIMEOUT_MS?: string | number;
  BDD_STEP_TIMEOUT_MS?: string | number;
  BDD_CHAT_API_RESPONSE_TIMEOUT_MS?: string | number;
  BDD_LLM_RESPONSE_TIMEOUT_MS?: string | number;

  [key: string]: unknown;
};

export interface RuntimeLoginProfile {
  id: string;
  clientName: string;
  username: string;
  password: string;
  buyerPartnerCode: string;
  partnerCode: string;
  usernameEncrypted: string;
  passwordEncrypted: string;
  buyerPartnerCodeEncrypted: string;
  partnerCodeEncrypted: string;
}

function normalizeEnvName(value?: string): string {
  return String(value || '').trim().toUpperCase() || 'UAT';
}

export const TEST_ENV = normalizeEnvName(
  process.env.TEST_ENV || process.env.ENV || process.env.ENVIRONMENT_NAME || 'UAT',
).toLowerCase();

function readJsonFile(filePath: string): PortalConfigJson | undefined {
  if (!fs.existsSync(filePath)) return undefined;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as PortalConfigJson;
    }
  } catch (error) {
    throw new Error(
      `[configManager] Failed to parse ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return undefined;
}

function readFixtureConfigForEnv(envName: string): PortalConfigJson | undefined {
  const normalized = envName.trim().toLowerCase();
  const filePath = path.join(PROJECT_ROOT, 'fixtures', 'config', `${normalized}.json`);
  const config = readJsonFile(filePath);

  return config;
}

function readConfigJsonFromEnv(): PortalConfigJson | undefined {
  const raw = String(process.env[PLAYWRIGHT_ENV.CONFIG_JSON] ?? '').trim();
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as PortalConfigJson;
    }
  } catch (error) {
    throw new Error(
      `[configManager] CONFIG_JSON is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return undefined;
}

const fixtureCache = new Map<string, PortalConfigJson | undefined>();

function getFixtureForEnv(envName: string): PortalConfigJson | undefined {
  const normalized = normalizeEnvName(envName);
  if (!fixtureCache.has(normalized)) {
    const fixtureConfig = readFixtureConfigForEnv(normalized);
    fixtureCache.set(normalized, fixtureConfig ?? readConfigJsonFromEnv());
  }
  return fixtureCache.get(normalized);
}

const activeEnvName = normalizeEnvName(TEST_ENV);
const configJson = getFixtureForEnv(activeEnvName);

if (!configJson) {
  throw new Error(
    `[configManager] Missing configuration for ${activeEnvName}. Provide fixtures/config/${activeEnvName.toLowerCase()}.json, CONFIG_JSON, or pipeline environment variables.`,
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readTrimmed(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function pickString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function pickOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function pickConfigOrEnv(key: string, fallback = ''): string {
  return pickString(configJson?.[key], fallback);
}

export const BUILD_CONFIGURATION_URL = '';
export const BASE_URL: string = pickString(configJson.BASEURL);
export const APP_PATH: string = '';
export const APP_URL = BASE_URL;

function resolveApiBase(envName: 'UAT' | 'DEV' | 'QC' | 'PROD'): string {
  const fixture = getFixtureForEnv(envName);
  return (
    pickString(fixture?.[`${envName}_AGENTIC_RUNTIME_API_BASE_URL`]) ||
    pickString(fixture?.AGENTIC_RUNTIME_API_BASE_URL) ||
    pickString(fixture?.BASEURL)
  ).replace(/\/+$/, '');
}

export const API_CONFIG = {
  PORTAL_AGENTIC_RUNTIME_API_BASE_URL:
    pickString(configJson.PORTAL_AGENTIC_RUNTIME_API_BASE_URL) ||
    pickString(configJson.AGENTIC_RUNTIME_API_BASE_URL) ||
    pickString(configJson.BASEURL),

  UAT_AGENTIC_RUNTIME_API_BASE_URL: resolveApiBase('UAT'),
  DEV_AGENTIC_RUNTIME_API_BASE_URL: resolveApiBase('DEV'),
  QC_AGENTIC_RUNTIME_API_BASE_URL: resolveApiBase('QC'),
  PROD_AGENTIC_RUNTIME_API_BASE_URL: resolveApiBase('PROD'),

  PORTAL_API_BASE_URL:
    pickString(configJson.PORTAL_API_BASE_URL) ||
    pickString(configJson.BASEURL),

  PORTAL_ORCHESTRATOR_API_BASE_URL:
    pickString(configJson.PORTAL_ORCHESTRATOR_API_BASE_URL) ||
    pickString(configJson.BASEURL),
} as const;

function findClientAndProfile(
  fixture: PortalConfigJson,
  requestedClientName?: string,
  requestedProfileName?: string,
): { clientName: string; profileName: string; profileRecord: Record<string, unknown> } | undefined {
  const fixtureRecord = asRecord(fixture);
  const reserved = new Set([
    'BASEURL',
    'APIMSUBSCRIPTIONKEY',
    'APIURL',
    'CLIENT_NAME',
    'LOGIN_PROFILE',
    'BPC_CODE',
    'AGENTIC_RUNTIME_API_BASE_URL',
    'UAT_AGENTIC_RUNTIME_API_BASE_URL',
    'DEV_AGENTIC_RUNTIME_API_BASE_URL',
    'QC_AGENTIC_RUNTIME_API_BASE_URL',
    'PROD_AGENTIC_RUNTIME_API_BASE_URL',
    'PORTAL_AGENTIC_RUNTIME_API_BASE_URL',
    'PORTAL_API_BASE_URL',
    'PORTAL_ORCHESTRATOR_API_BASE_URL',
  ]);

  const clientEntries = Object.entries(fixtureRecord).filter(
    ([key, value]) =>
      !reserved.has(key.toUpperCase()) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value),
  );

  if (clientEntries.length === 0) return undefined;

  const selectedClient =
    requestedClientName
      ? clientEntries.find(([key]) => key.toUpperCase() === requestedClientName.toUpperCase())
      : undefined;

  const [clientName, clientValue] = selectedClient || clientEntries[0];
  const clientRecord = asRecord(clientValue);

  const profileEntries = Object.entries(clientRecord).filter(
    ([, value]) => value && typeof value === 'object' && !Array.isArray(value),
  );

  if (profileEntries.length === 0) return undefined;

  const defaultProfileName = `${clientName}_BuyerLogin`;

  const selectedProfile =
    requestedProfileName
      ? profileEntries.find(([key]) => key.toUpperCase() === requestedProfileName.toUpperCase())
      : undefined;

  const defaultProfile = profileEntries.find(
    ([key]) => key.toUpperCase() === defaultProfileName.toUpperCase(),
  );

  const [profileName, profileValue] = selectedProfile || defaultProfile || profileEntries[0];

  return {
    clientName,
    profileName,
    profileRecord: asRecord(profileValue),
  };
}

const activeLoginContext = findClientAndProfile(
  configJson,
  pickString(configJson.CLIENT_NAME),
  pickString(configJson.LOGIN_PROFILE),
);

export const CLIENT_NAME =
  pickString(configJson.CLIENT_NAME) ||
  activeLoginContext?.clientName ||
  'DEVELOPERDOMAIN';

export const LOGIN_PROFILE =
  pickString(configJson.LOGIN_PROFILE) ||
  activeLoginContext?.profileName ||
  `${CLIENT_NAME}_BuyerLogin`;

export const USER_ID = readTrimmed(activeLoginContext?.profileRecord ?? {}, 'USERNAME');
export const PASSWORD = readTrimmed(activeLoginContext?.profileRecord ?? {}, 'PASSWORD');

export const BPC_CODE =
  pickString(configJson.BPC_CODE) ||
  readTrimmed(activeLoginContext?.profileRecord ?? {}, 'BUYER_PARTNERCODE') ||
  readTrimmed(activeLoginContext?.profileRecord ?? {}, 'BUYERPARTNERCODE') ||
  '';

export const APP_NAME = 'qistudioAutomation';
export const APP_ID = '';
export const MODULE_NAME = 'Testcases';
export const MODULE_ID = '';

export const OCP_APIM_SUBSCRIPTION_KEY =
  pickString(configJson.APIMSUBSCRIPTIONKEY) ||
  pickString(configJson.OCP_APIM_SUBSCRIPTION_KEY);

export const DESIGN_TIME_LOGIN_URL = '';
export function resolveMergeQistudioUrl(): string {
  return '';
}

export function resolveRuntimeEnvName(): string {
  return activeEnvName;
}

export function resolveAuthApiUrl(targetEnv = resolveRuntimeEnvName()): string {
  const fixture = getFixtureForEnv(targetEnv);
  return pickString(fixture?.APIURL || fixture?.API_AUTH_URL || fixture?.AUTH_API_URL).replace(/\/+$/, '');
}

export function resolveRuntimeLoginProfile(
  targetEnv: string,
  requestedLoginProfile?: string,
): RuntimeLoginProfile | undefined {
  const envName = normalizeEnvName(targetEnv);
  const fixture = getFixtureForEnv(envName);
  if (!fixture) return undefined;

  const requestedClient =
    pickString(fixture.CLIENT_NAME) ||
    CLIENT_NAME;

  const requestedProfile =
    requestedLoginProfile ||
    pickString(fixture.LOGIN_PROFILE) ||
    LOGIN_PROFILE;

  const loginContext = findClientAndProfile(fixture, requestedClient, requestedProfile);
  if (!loginContext) return undefined;

  const profile = loginContext.profileRecord;

  const username = readTrimmed(profile, 'USERNAME');
  const password = readTrimmed(profile, 'PASSWORD');
  const buyerPartnerCode =
    readTrimmed(profile, 'BUYER_PARTNERCODE') ||
    readTrimmed(profile, 'BUYERPARTNERCODE') ||
    BPC_CODE;
  const partnerCode =
    readTrimmed(profile, 'PARTNERCODE') ||
    buyerPartnerCode;

  const usernameEncrypted = readTrimmed(profile, 'USERNAME_ENCRYPTED');
  const passwordEncrypted = readTrimmed(profile, 'PASSWORD_ENCRYPTED');
  const buyerPartnerCodeEncrypted =
    readTrimmed(profile, 'BUYERPARTNERCODE_ENCRYPTED') ||
    readTrimmed(profile, 'BUYER_PARTNERCODE_ENCRYPTED');
  const partnerCodeEncrypted =
    readTrimmed(profile, 'PARTNERCODE_ENCRYPTED') ||
    buyerPartnerCodeEncrypted;

  return {
    id: loginContext.profileName,
    clientName: loginContext.clientName,
    username,
    password,
    buyerPartnerCode,
    partnerCode,
    usernameEncrypted,
    passwordEncrypted,
    buyerPartnerCodeEncrypted,
    partnerCodeEncrypted,
  };
}

export function resolveRuntimeLoginCredentials(targetEnv: string): {
  runtimeUser: string;
  runtimePass: string;
  gepLoginUrl: string;
} {
  const profile = resolveRuntimeLoginProfile(targetEnv);

  return {
    runtimeUser: profile?.username ?? '',
    runtimePass: profile?.password ?? '',
    gepLoginUrl: '',
  };
}

export function resolveRuntimeApiToken(_envName: string): string {
  return '';
}

export function resolveDesignTimeUserIdForDraftCreation(runtimeEnvName?: string): string {
  const profile = resolveRuntimeLoginProfile(runtimeEnvName || resolveRuntimeEnvName());
  return profile?.username || 'unknown-user';
}

export const AZURE_OPENAI_ENDPOINT = pickString(configJson.AZURE_OPENAI_ENDPOINT);
export const AZURE_OPENAI_API_KEY = pickString(configJson.AZURE_OPENAI_API_KEY);
export const AZURE_OPENAI_DEPLOYMENT = pickString(configJson.AZURE_OPENAI_DEPLOYMENT);
export const AZURE_OPENAI_API_VERSION = pickString(configJson.AZURE_OPENAI_API_VERSION);

export const QA_AUTOMATION_OPENAI_URL =
  pickString(configJson.QA_AUTOMATION_OPENAI_URL) || AZURE_OPENAI_ENDPOINT;

export const QA_AUTOMATION_OPENAI_API_KEY =
  pickString(configJson.QA_AUTOMATION_OPENAI_API_KEY) || AZURE_OPENAI_API_KEY;

export const JUDGE_PASS_THRESHOLD = pickOptionalInt(configJson.JUDGE_PASS_THRESHOLD);

export const BDD_STEP_TIMEOUT_MS =
  pickOptionalInt(configJson.BDD_STEP_TIMEOUT_MS) ?? 120_000;

export const BDD_CHAT_API_RESPONSE_TIMEOUT_MS =
  pickOptionalInt(configJson.BDD_CHAT_API_RESPONSE_TIMEOUT_MS) ?? 120_000;

export const BDD_LLM_RESPONSE_TIMEOUT_MS =
  pickOptionalInt(configJson.BDD_LLM_RESPONSE_TIMEOUT_MS) ?? 180_000;

export const BDD_WORKFLOW_STREAM_TIMEOUT_MS = Math.max(
  BDD_CHAT_API_RESPONSE_TIMEOUT_MS,
  BDD_LLM_RESPONSE_TIMEOUT_MS,
);

export const AI_EVENTS_PILL_REGEX = pickString(configJson.AI_EVENTS_PILL_REGEX);

export const AI_EVENTS_TIMEOUT_MS = pickOptionalInt(configJson.AI_EVENTS_TIMEOUT_MS);
