import os from 'os';
import path from 'path';
import fs from 'fs';

// Centralized file + console logger shared by the Electron main process and the MCP server.
// Writes to ~/.dima_data/logs so any user's crash/error history lives in one predictable place.
const logDir = path.join(os.homedir(), '.dima_data', 'logs');
const logFile = path.join(logDir, `dima-${new Date().toISOString().slice(0, 10)}.log`);

function ensureLogDir() {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch {
    // If we can't create the log dir, fall back to console-only logging.
  }
}

function write(level: string, message: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${meta !== undefined ? ' ' + formatMeta(meta) : ''}`;
  // Always log to stderr, never stdout: the MCP server speaks JSON-RPC over
  // stdout, and any stray stdout write there would corrupt that stream.
  console.error(line);
  try {
    ensureLogDir();
    fs.appendFileSync(logFile, line + '\n');
  } catch {
    // Best-effort: never let logging failures crash the app.
  }
}

function formatMeta(meta: unknown): string {
  if (meta instanceof Error) return meta.stack || meta.message;
  if (typeof meta === 'string') return meta;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

export const log = {
  info: (message: string, meta?: unknown) => write('INFO', message, meta),
  warn: (message: string, meta?: unknown) => write('WARN', message, meta),
  error: (message: string, meta?: unknown) => write('ERROR', message, meta),
};

export function installGlobalErrorHandlers(context: string) {
  process.on('uncaughtException', (err) => {
    log.error(`[${context}] Uncaught exception`, err);
  });
  process.on('unhandledRejection', (reason) => {
    log.error(`[${context}] Unhandled rejection`, reason);
  });
}
