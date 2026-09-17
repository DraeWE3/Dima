# DIMA — Autonomous Engineering Supervisor

DIMA is a desktop app that verifies (and can directly build) software, three ways at once:

1. **As an MCP server** — any MCP-compatible agent (Antigravity, Claude Code, Cursor, etc.)
   can call DIMA's own QA, security-audit, and integration-verification tools.
2. **As a standalone agent** — for anyone without a separate AI coding tool, DIMA can drive
   its own OpenAI-powered agent loop directly against a project folder: read/write files,
   run shell commands, and verify the result, end to end, from the desktop app itself.
3. **As an MCP client** — DIMA can connect out to other MCP servers you configure, folding
   their tools into its own agent loop.

## Requirements

- Node.js 18+
- An OpenAI API key (set it in the app's **Settings** page — no `.env` editing required)
- Playwright browsers (`npx playwright install`) for browser-based QA checks

## Setup

```bash
npm install
npm run dev
```

Open **Settings** in the app and paste in your OpenAI API key. That's the only required setup —
everything else (models, MCP connections) is configurable from there too.

## Building

```bash
npm run build   # compiles main/preload/renderer via electron-vite
npm run dist    # also packages an installer via electron-builder
```

## Using DIMA

- **Mission** — pick a workspace folder and describe an objective. DIMA plans acceptance
  criteria, drives its own agent loop against the folder, verifies the result (build, tests,
  browser checks across desktop/mobile/dark-mode), and iterates until it passes or needs you.
  You can stop a running mission, and send follow-up instructions once it pauses or finishes.
- **Dashboard** — real KPIs (success rate, active/errored counts) and a live feed of recent
  and current missions, computed from actual mission history.
- **History** (sidebar) — every mission ever run, with status and a jump back into its full
  transcript.
- **Settings**:
  - **OpenAI API key** — stored locally, applied immediately, never sent anywhere but OpenAI.
  - **Models** — add or remove any model id without a rebuild; whichever you mark default
    shows up as the Mission page's default. Not every model supports the same request shape
    (e.g. some reasoning models require a specific `reasoning_effort` for function-tool use);
    DIMA detects and adapts to this automatically per model.
  - **MCP Servers** — connect DIMA out to other MCP servers (`command` + `args`, with
    reconnect on failure).
  - **Connect an Agent** — the exact MCP config to paste into Antigravity, Claude Code,
    Cursor, or any other MCP client, with a live "is something actually connected" status.

## Connecting an external agent to DIMA

Preferred (works on any machine, no path to configure) — once
[`dima-mcp`](packages/dima-mcp) is published to npm:

```json
{
  "mcpServers": {
    "dima": { "command": "npx", "args": ["-y", "dima-mcp"] }
  }
}
```

Until then, or when testing a local checkout, use the absolute path shown in Settings →
Connect an Agent (also in [`.agents/mcp_config.example.json`](.agents/mcp_config.example.json)):

```json
{
  "mcpServers": {
    "dima": { "command": "node", "args": ["/absolute/path/to/out/main/dima-mcp.js"] }
  }
}
```

For ad-hoc manual testing of a single tool call without a full MCP client, use:

```bash
node scripts/call-mcp-tool.mjs <toolName> '<jsonArguments>'
```

## Environment variables

Settings is the primary way to configure these now; env vars still work as a fallback/override
(useful for CI or headless runs):

| Variable          | Required | Description                                      |
|-------------------|----------|---------------------------------------------------|
| `OPENAI_API_KEY`  | No       | Overrides the key saved in Settings.              |
| `DIMA_MODEL`      | No       | Overrides the default model saved in Settings.    |

## Data & logs

Mission history, the OpenAI key, MCP server configs, screenshots, and application logs are
stored per-OS-user under (not shared between different people on the same machine unless they
share the same OS login, and never committed to git):

```
~/.dima_data/missions.json
~/.dima_data/app_config.json
~/.dima_data/mcp_servers.json
~/.dima_data/screenshots/
~/.dima_data/logs/
```

If DIMA is killed or crashes mid-mission, that mission is swept to `ERROR` the next time the
app starts (its in-memory progress can't be resumed, but it won't hang forever either — send
it a follow-up message to try again).

## Known limitations

- The "Undo" feature runs `git reset --hard HEAD` in the mission's workspace. This is
  destructive and will discard uncommitted changes in that workspace — only use it in
  workspaces you're comfortable resetting.
- RPA/integration verifiers (`RPAVerifier`, `IntegrationVerifier`) drive real third-party
  services (Slack, Gmail, Notion, etc.) with test data when pointed at live connectors —
  do not run them against production accounts.
- No multi-user/profile separation: everyone using the same OS login shares one mission
  history, one API key, and one set of MCP connections.
