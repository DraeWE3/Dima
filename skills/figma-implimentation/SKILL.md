---
name: figma-implement-design
description: Translates Figma designs into production-ready application code with 1:1 visual fidelity. Use when implementing UI code from Figma files, when user mentions "implement design", "generate code", "implement component", provides Figma URLs, or asks to build components matching Figma specs. For Figma canvas writes via `use_figma`, use `figma-use`.
---

# Implement Design

## Overview

This skill provides a structured workflow for translating Figma designs into production-ready code with pixel-perfect accuracy. It ensures consistent integration with the Figma MCP server, proper use of design tokens, and 1:1 visual parity with designs.

## Skill Boundaries

- Use this skill when the deliverable is code in the user's repository.
- If the user asks to create/edit/delete nodes inside Figma itself, switch to [figma-use](../figma-use/SKILL.md).
- If the user asks to build or update a full-page screen in Figma from code or a description, switch to [figma-generate-design](../figma-generate-design/SKILL.md).
- If the user asks only for Code Connect mappings, switch to [figma-code-connect-components](../figma-code-connect-components/SKILL.md).
- If the user asks to author reusable agent rules (`CLAUDE.md`/`AGENTS.md`), switch to [figma-create-design-system-rules](../figma-create-design-system-rules/SKILL.md).

## Prerequisites

- Figma MCP server must be connected and accessible
- **Active Project Setup (Ryvon.ai):**
  - **MCP Endpoint:** `http://127.0.0.1:3845/mcp` (`Figma Desktop`)
  - **Default File Key:** `qktjfY3MiRUrtSuZB4e2lW` ([Ryvon.ai Figma Design](https://www.figma.com/design/qktjfY3MiRUrtSuZB4e2lW/Ryvon.ai))
- User must provide a Figma URL in the format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - `:fileKey` is the file key
  - `1-2` is the node ID (the specific component or frame to implement)
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app (no URL required)
- Project should have an established design system or component library (preferred)
- **A way to view the running implementation and capture a screenshot of it** (e.g. a local dev server plus a browser/screenshot tool such as a Playwright MCP, Antigravity's built-in browser, or an equivalent). This is required for Step 7's iterative visual comparison loop — without it, validation falls back to a single manual pass and should be flagged to the user as lower-confidence.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Get Node ID

#### Option A: Parse from Figma URL

When the user provides a Figma URL, extract the file key and node ID to pass as arguments to MCP tools.

**URL format:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**Extract:**

- **File key:** `:fileKey` (the segment after `/design/`)
- **Node ID:** `1-2` (the value of the `node-id` query parameter)

**Note:** When using the local desktop MCP (`figma-desktop`), `fileKey` is not passed as a parameter to tool calls. The server automatically uses the currently open file, so only `nodeId` is needed.

**Example:**

- URL: `https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key: `kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID: `42-15`

#### Option B: Use Current Selection from Figma Desktop App (figma-desktop MCP only)

When using the `figma-desktop` MCP and the user has NOT provided a URL, the tools automatically use the currently selected node from the open Figma file in the desktop app.

**Note:** Selection-based prompting only works with the `figma-desktop` MCP server. The remote server requires a link to a frame or layer to extract context. The user must have the Figma desktop app open with a node selected.

### Step 2: Fetch Design Context

Run `get_design_context` with the extracted file key and node ID.

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

This provides the structured data including:

- Layout properties (Auto Layout, constraints, sizing)
- Typography specifications
- Color values and design tokens
- Component structure and variants
- Spacing and padding values

**If the response is too large or truncated:**

1. Run `get_metadata(fileKey=":fileKey", nodeId="1-2")` to get the high-level node map
2. Identify the specific child nodes needed from the metadata
3. Fetch individual child nodes with `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`

### Step 3: Capture Visual Reference

Run `get_screenshot` with the same file key and node ID for a visual reference.

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

This screenshot serves as the source of truth for visual validation. Keep it accessible throughout implementation.

### Step 4: Download Required Assets

**Before downloading, build an explicit asset inventory.** Do not rely on only the assets that happen to appear in the `get_design_context` payload — nested icons and images inside collapsed/truncated subtrees are easy to miss. Run `get_metadata` for the full node tree and list every node of type `VECTOR`, `INSTANCE` (icon components), `IMAGE` fill, or `BOOLEAN_OPERATION`. Check this list off one-by-one as each asset is fetched — if a node from the inventory has no corresponding downloaded asset, go back and fetch it individually with `get_design_context`/`get_screenshot` on that node ID before moving on.

Download every asset (images, icons, SVGs) on the inventory.

**IMPORTANT:** Follow these asset rules:

- If the Figma MCP server returns a `localhost` source for an image or SVG, use that source directly
- DO NOT import or add new icon packages - all assets should come from the Figma payload
- DO NOT use or create placeholders if a `localhost` source is provided
- Assets are served through the Figma MCP server's built-in assets endpoint
- If any inventoried icon/image node has no available `localhost` source after fetching, flag it explicitly to the user rather than silently substituting a generic icon or omitting it

### Step 5: Translate to Project Conventions

Translate the Figma output into this project's framework, styles, and conventions.

**Key principles:**

- Treat the Figma MCP output (typically React + Tailwind) as a representation of design and behavior, not as final code style
- Replace Tailwind utility classes with the project's preferred utilities or design system tokens
- Reuse existing components (buttons, inputs, typography, icon wrappers) instead of duplicating functionality
- Use the project's color system, typography scale, and spacing tokens consistently
- Respect existing routing, state management, and data-fetch patterns

### Step 6: Achieve 1:1 Visual Parity

Strive for pixel-perfect visual parity with the Figma design.

**Guidelines:**

- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values - use design tokens from Figma where available
- When conflicts arise between design system tokens and Figma specs, prefer design system tokens but adjust spacing or sizes minimally to match visuals
- **Gradients, multi-stop colors, shadows, and blend effects are exempt from the "prefer nearest token" rule above.** These must be reproduced with their exact values (stop colors, positions, angle, opacity) from `get_design_context`, even if that means using a raw CSS value or a new token rather than snapping to the closest existing solid-color token. Flattening a gradient to a solid design-system color is a fidelity bug, not an acceptable simplification — only do this if the user explicitly says approximate matches are fine.
- Follow WCAG requirements for accessibility
- Add component documentation as needed

### Step 7: Iterative Visual Comparison Loop

**This step is mandatory and blocking — do not tell the user the implementation is done until it's been completed.** Do not settle for a single pass. Run the following loop until the rendered result matches the Figma screenshot or you hit the iteration cap:

1. **Load the live implementation.** Start/confirm the dev server is running, then use the available browser/screenshot tool to open the actual implemented component or page — not a static export, the real running app in the real project context (correct route, correct viewport size matching the Figma frame).
2. **Screenshot it.** Capture the rendered output at the same dimensions/breakpoint as the Step 3 Figma screenshot.
3. **Compare directly, side by side.** Look at the Figma screenshot and the new rendered screenshot together and enumerate concrete, specific mismatches — not a generic "looks close." Check explicitly for:
   - Layout: spacing, alignment, sizing, padding
   - Typography: font, size, weight, line height, letter spacing
   - Colors, **including gradients, shadows, and multi-stop values** — these must match exactly, not be approximated to the nearest design-system token
   - Every icon/image from the Step 4 asset inventory: present, correctly sourced, correct size/color (no placeholders, no substituted generic icons)
   - Interactive states (hover, active, disabled) if inspectable
   - Responsive behavior against Figma constraints
4. **If any mismatch is found:** fix the code, then go back to step 1 and re-capture. Report each fix as you make it (e.g. "CTA button gradient was flattened to `primary-500`, corrected to the 3-stop gradient from Figma").
5. **If no mismatch is found:** stop and report the match explicitly, e.g. "Compared rendered output against Figma screenshot — layout, typography, colors/gradients, and all 4 inventoried icons match."
6. **Iteration cap:** after 4 fix-and-recheck cycles, if mismatches remain, stop, show the current screenshot next to the Figma reference, and describe the specific remaining gaps to the user rather than silently looping forever or declaring false success.

Never report the task as complete based on code review alone — completion requires a passing screenshot comparison from this loop, or an explicit note to the user that the comparison couldn't be run because no dev server/screenshot tool was available (see Prerequisites).

## Implementation Rules

### Component Organization

- Place UI components in the project's designated design system directory
- Follow the project's component naming conventions
- Avoid inline styles unless truly necessary for dynamic values

### Design System Integration

- ALWAYS use components from the project's design system when possible
- Map Figma design tokens to project design tokens
- When a matching component exists, extend it rather than creating a new one
- Document any new components added to the design system

### Code Quality

- Avoid hardcoded values - extract to constants or design tokens
- Keep components composable and reusable
- Add TypeScript types for component props
- Include JSDoc comments for exported components

## Examples

### Example 1: Implementing a Button Component

User says: "Implement this Figma button component: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**Actions:**

1. Parse URL to extract fileKey=`kL9xQn2VwM8pYrTb4ZcHjF` and nodeId=`42-15`
2. Run `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. Run `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` for visual reference
4. Download any button icons from the assets endpoint
5. Check if project has existing button component
6. If yes, extend it with new variant; if no, create new component using project conventions
7. Map Figma colors to project design tokens (e.g., `primary-500`, `primary-hover`)
8. Validate against screenshot for padding, border radius, typography

**Result:** Button component matching Figma design, integrated with project design system.

### Example 2: Building a Dashboard Layout

User says: "Build this dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**Actions:**

1. Parse URL to extract fileKey=`pR8mNv5KqXzGwY2JtCfL4D` and nodeId=`10-5`
2. Run `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` to understand the page structure
3. Identify main sections from metadata (header, sidebar, content area, cards) and their child node IDs
4. Run `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` for each major section
5. Run `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` for the full page
6. Download all assets (logos, icons, charts)
7. Build layout using project's layout primitives
8. Implement each section using existing components where possible
9. Validate responsive behavior against Figma constraints

**Result:** Complete dashboard matching Figma design with responsive layout.

## Best Practices

### Always Start with Context

Never implement based on assumptions. Always fetch `get_design_context` and `get_screenshot` first.

### Incremental Validation

Validate frequently during implementation, not just at the end. This catches issues early.

### Document Deviations

If you must deviate from the Figma design (e.g., for accessibility or technical constraints), document why in code comments.

### Reuse Over Recreation

Always check for existing components before creating new ones. Consistency across the codebase is more important than exact Figma replication.

### Design System First

When in doubt, prefer the project's design system patterns over literal Figma translation.

## Common Issues and Solutions

### Issue: Figma output is truncated

**Cause:** The design is too complex or has too many nested layers to return in a single response.
**Solution:** Use `get_metadata` to get the node structure, then fetch specific nodes individually with `get_design_context`.

### Issue: Design doesn't match after implementation

**Cause:** Visual discrepancies between the implemented code and the original Figma design.
**Solution:** Compare side-by-side with the screenshot from Step 3. Check spacing, colors, and typography values in the design context data.

### Issue: Assets not loading

**Cause:** The Figma MCP server's assets endpoint is not accessible or the URLs are being modified.
**Solution:** Verify the Figma MCP server's assets endpoint is accessible. The server serves assets at `localhost` URLs. Use these directly without modification.

### Issue: Design token values differ from Figma

**Cause:** The project's design system tokens have different values than those specified in the Figma design.
**Solution:** When project tokens differ from Figma values, prefer project tokens for consistency but adjust spacing/sizing to maintain visual fidelity.

## Understanding Design Implementation

The Figma implementation workflow establishes a reliable process for translating designs to code:

**For designers:** Confidence that implementations will match their designs with pixel-perfect accuracy.
**For developers:** A structured approach that eliminates guesswork and reduces back-and-forth revisions.
**For teams:** Consistent, high-quality implementations that maintain design system integrity.

By following this workflow, you ensure that every Figma design is implemented with the same level of care and attention to detail.

## Additional Resources

- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP Server Tools and Prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma Variables and Design Tokens](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
