export const RYVON_ARCHITECTURE_CONTEXT = `
Ryvon AI Architecture & Codebase Context
Compiled for DIMA Autonomous QA Engine

1. System Overview
Ryvon AI is a unified command center managing Chat Agents, Voice AI Assistants, Automations, Workflows, and over 1,000 App Connectors (Native + Composio). The core philosophy is "One Command. Infinite Execution."

2. Core Components
A. The Chat Agent (Core Intelligence)
Location: app/(chat)/api/chat/handler.ts, lib/ai/prompts.ts, lib/ai/tools/
Behavior: The agent acts as a central orchestrator. It uses tool calling to interface with the digital ecosystem.
Tools:
executeConnector: The primary execution engine for all 3rd-party integrations (Slack, Notion, GitHub, etc.).
discoverComposioActions: Before executing a Composio app, the agent must call this tool to dynamically map the natural language request to an exact Composio actionId.
manageWorkflows: Can enable/disable automated pipelines directly from chat.
Rule: Never expose the term "Composio" to the user; present everything as a native Ryvon capability.

B. The Connectors & Integrations Matrix
Location: lib/connectors/, lib/ai/tools/execute-connector.ts
Native vs. Composio:
Native Connectors: Handled via local OAuth tokens and executed via Registry.getAction(targetProvider, targetAction). Includes core tools like Discord, Google Suite, and Slack.
Composio Fallback Matrix: If a native plugin is missing or a token is unavailable, the system automatically falls back to executeComposioAction(userId, appName, actionId, params).
Dynamic Routing: The execute-connector tool seamlessly routes requests between native implementations and Composio's API based on token availability and registry mappings.

C. Workflow Automation Engine (The Canvas)
Location: features/workflows/canvas/, lib/workflows/agent-step.ts
The UI: A visual node-based canvas. Dynamically fetches all available integrations via useSWR('/api/connectors').
Composio AI Agent Node: A universal node template (features/workflows/canvas/nodeLibrary.ts) that allows users to orchestrate any of the 800+ Composio apps by simply passing a natural language prompt (e.g., "Use Notion to...").
Intelligent Agent Step (agent-step.ts):
When a step is configured as an 'agent', Ryvon spins up a mini LLM loop inside the background workflow engine. This background agent has access to the full suite of connector tools, allowing it to perform multi-step reasoning completely autonomously during a workflow run.

3. Data Flow Example
User Request: "Create a GitHub issue."
Chat Agent: Calls discoverComposioActions(appName: 'github') to find the exact action ID.
Execution: Calls executeConnector with the exact ID.
Router: execute-connector.ts detects the Composio prefix or missing native plugin and routes the payload to lib/connectors/composio.ts.
Composio API: Executes the action via the user's connected sandbox entity.
`;
