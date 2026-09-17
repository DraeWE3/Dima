# dima-mcp

DIMA's MCP server, published as a standalone package so any MCP-compatible
agent (Antigravity, Claude Code, Cursor, etc.) can call its QA, security-audit
and integration-verification tools with a single config line — no local path,
no separate install of the DIMA desktop app required on the machine running
the agent.

## Setup

Add this to the agent's MCP config file:

```json
{
  "mcpServers": {
    "dima": {
      "command": "npx",
      "args": ["-y", "dima-mcp"]
    }
  }
}
```

Restart the agent. It will show as connected in DIMA's own Settings page
(if you're also running the desktop app) via a heartbeat file.

## OpenAI API key

`dima-mcp` needs an OpenAI key to drive its own verification/reasoning calls.
It looks for one in this order:

1. `OPENAI_API_KEY` already set in the environment the agent spawns it with
   (set it in the MCP config's `env` field if your client supports one).
2. The key saved in the DIMA desktop app's Settings page, if it's installed
   on the same machine (`~/.dima_data/app_config.json`).

## Playwright

Browser-based checks use Playwright. The first time, run:

```bash
npx playwright install chromium
```
