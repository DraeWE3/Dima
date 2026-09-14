// Dev helper: connects to the local dima-mcp server over stdio and calls a tool.
//
// Usage:
//   node scripts/call-mcp-tool.mjs <toolName> '<jsonArguments>'
//
// Example:
//   node scripts/call-mcp-tool.mjs dima_launch_fullstack_audit \
//     '{"appUrl":"http://localhost:3000","workspacePath":"/path/to/your/project"}'
import { fileURLToPath } from "url";
import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(__dirname, "../out/main/dima-mcp.js");

async function main() {
  const [toolName, argsJson] = process.argv.slice(2);
  if (!toolName) {
    console.error("Usage: node scripts/call-mcp-tool.mjs <toolName> '<jsonArguments>'");
    process.exit(1);
  }
  const args = argsJson ? JSON.parse(argsJson) : {};

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverEntry],
  });

  const client = new Client(
    { name: "dima-dev-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);
  console.log(`Connected to MCP server. Calling "${toolName}"...`);

  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Tool call failed:", err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
