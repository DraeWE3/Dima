import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * A user configures their OpenAI key once, in the DIMA desktop app's
 * Settings page. That writes to ~/.dima_data/app_config.json. This process
 * is spawned separately (by whatever MCP client points at it) and gets none
 * of the desktop app's own process.env, so it has to read that same file
 * itself before dima-mcp's own module code constructs its OpenAI client.
 */
function loadConfigIntoEnv() {
  try {
    const configPath = path.join(os.homedir(), '.dima_data', 'app_config.json');
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (raw.openaiApiKey && !process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = raw.openaiApiKey;
      if (raw.defaultModel && !process.env.DIMA_MODEL) process.env.DIMA_MODEL = raw.defaultModel;
    }
  } catch {
    // Best-effort only - dima-mcp itself logs a clear error if no key ends up set.
  }
}

loadConfigIntoEnv();

// Dynamic import so the env vars above are guaranteed to land before
// dima-mcp's module body runs (it builds its OpenAI client at import time).
import('../../../src/main/mcp/dima-mcp');
