import os from 'os';
import path from 'path';
import fs from 'fs';
import { log } from '../utils/logger';

const configPath = path.join(os.homedir(), '.dima_data', 'app_config.json');

export interface AppConfig {
  openaiApiKey: string;
  defaultModel: string;
  models: string[];
}

// Seeded with the models known at the time of writing, plus whatever the
// user has explicitly asked DIMA to support - added here so it shows up in
// the picker even before OpenAI's SDK types know about it. If the exact
// model id turns out to differ once it's actually released, update it from
// Settings without needing a new build.
const DEFAULT_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-6-astra'];

function load(): AppConfig {
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return {
        openaiApiKey: typeof raw.openaiApiKey === 'string' ? raw.openaiApiKey : '',
        defaultModel: raw.defaultModel || DEFAULT_MODELS[0],
        models: Array.isArray(raw.models) && raw.models.length ? raw.models : DEFAULT_MODELS,
      };
    }
  } catch (e) {
    log.error('Failed to load app config', e);
  }
  return { openaiApiKey: '', defaultModel: DEFAULT_MODELS[0], models: DEFAULT_MODELS };
}

function save(config: AppConfig) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Pushes the persisted config into process.env so every existing
 * process.env.OPENAI_API_KEY / DIMA_MODEL read site (OpenAIBrain,
 * NativeAgentAdapter, DimaEngine) picks it up without each having to be
 * rewritten to import this module directly.
 */
function applyToEnv(config: AppConfig) {
  if (config.openaiApiKey) process.env.OPENAI_API_KEY = config.openaiApiKey;
  if (config.defaultModel) process.env.DIMA_MODEL = config.defaultModel;
}

export function initAppConfig(): void {
  applyToEnv(load());
}

function mask(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return '••••••••';
  const prefix = key.slice(0, Math.min(7, key.length - 4));
  const suffix = key.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}

export function getAppConfigForUI() {
  const config = load();
  return {
    hasApiKey: !!config.openaiApiKey,
    maskedApiKey: mask(config.openaiApiKey),
    defaultModel: config.defaultModel,
    models: config.models,
  };
}

export function setApiKey(apiKey: string) {
  const config = load();
  config.openaiApiKey = apiKey.trim();
  save(config);
  applyToEnv(config);
  return getAppConfigForUI();
}

export function setModelConfig(defaultModel: string, models: string[]) {
  const config = load();
  config.defaultModel = defaultModel;
  config.models = models;
  save(config);
  applyToEnv(config);
  return getAppConfigForUI();
}
