# DIMA — Autonomous Engineering Supervisor

DIMA is an Electron desktop app plus an MCP (Model Context Protocol) server that drives
autonomous QA: it generates and runs Playwright tests, fuzzes API routes, and evaluates
results with an LLM.

## Requirements

- Node.js 18+
- An OpenAI API key (optional — without one, DIMA falls back to minimal smoke-test scripts)
- Playwright browsers (`npx playwright install`) for the QA/verification tools

## Setup

```bash
npm install
cp .env.example .env   # then fill in OPENAI_API_KEY
```

## Running the desktop app

```bash
npm run dev
```

## Building

```bash
npm run build   # compiles main/preload/renderer via electron-vite
npm run dist    # also packages an installer via electron-builder
```

## Using the MCP server

The MCP server (`src/main/mcp/dima-mcp.ts`) is built to `out/main/dima-mcp.js` and speaks
MCP over stdio. To point an MCP-compatible client (Claude Code, etc.) at it, copy
[`.agents/mcp_config.example.json`](.agents/mcp_config.example.json) to your client's config
location and replace the placeholder with the **absolute path** to your local
`out/main/dima-mcp.js` — MCP stdio server configs require an absolute path, so this can't
be made portable automatically.

For ad-hoc manual testing of a single tool call without a full MCP client, use:

```bash
node scripts/call-mcp-tool.mjs <toolName> '<jsonArguments>'
```

## Environment variables

| Variable          | Required | Description                                      |
|-------------------|----------|---------------------------------------------------|
| `OPENAI_API_KEY`  | No       | Enables AI-generated QA scripts and evaluation.   |
| `DIMA_MODEL`      | No       | OpenAI model to use (default: `gpt-4o`).          |
| `DIMA_PYTHON_PATH`| No       | Override the Python executable used to run the Antigravity agent bridge (see below). |

## Logs & data

Mission history, screenshots, and application logs are stored per-user under:

```
~/.dima_data/missions.json
~/.dima_data/screenshots/
~/.dima_data/logs/
```

## Known limitations

- **The Antigravity agent bridge (`python-bridge/main.py`) is not included in this repo.**
  `PythonSDKAdapter` (used by the main mission loop) will log an error and mark the mission
  as `ERROR` if this script is missing. If you have a bridge implementation, place it at
  `python-bridge/main.py` relative to the project root, or point `DIMA_PYTHON_PATH` at a
  Python executable that can run it.
- The "Undo" feature runs `git reset --hard HEAD` in the mission's workspace. This is
  destructive and will discard uncommitted changes in that workspace — only use it in
  workspaces you're comfortable resetting.
- RPA/integration verifiers (`RPAVerifier`, `IntegrationVerifier`) drive real third-party
  services (Slack, Gmail, Notion, etc.) with test data when pointed at live connectors —
  do not run them against production accounts.
