---
name: step-updates
description: Find the latest stepN folder then update README.md and all react-app pages accordingly
triggers: [step, update, readme, react]
---

# Step Updates

Your task is to document the latest step added to this coding tutorial project.

## Instructions

### 1. Find the latest step

Use `list_files` on `.` (project root) to list all top-level folders. Find all folders matching the pattern `stepN` where N is a number. The folder with the highest N is the latest step.

### 2. Read the latest step code

Read every Python file in that step directory. Look for:
- New files introduced (compared to the previous step)
- New classes, mechanisms, or patterns added
- New tools registered in ToolRegistry
- New `{{placeholder}}` variables added to the system prompt template

### 3. Update README.md

Read the current README.md to understand the exact format of existing `### N.` sections under `## Step-by-Step`. Then append a new section in the same style:

```
### N. <Descriptive title>

In `stepN/`, we add ...

New files:
- `filename.py` — brief description

Key changes from stepN-1:
- **`file.py`** — what changed and why

**Run the agent:**
\`\`\`bash
uv run stepN/agent.py
\`\`\`

Example interaction: (include a short shell session showing the new feature in action)
```

Match the level of detail and formatting of existing sections precisely.

### 4. Update react-app/src/pages/Steps.tsx

Read the current Steps.tsx. Then:

1. Add a `STEPN_CODE` constant just before the `export default` line, following the pattern of `STEP1_CODE`, `STEP2_CODE`, etc. The snippet should show the key new concept in ~20-30 lines.
2. Add a new `<div style={stepWrap}>` block for step N inside `<main>`, following the exact JSX structure of existing steps:
   - `<span style={stepNum}>step N</span>` badge
   - `<h2 style={stepTitle}>` short title
   - `<p style={stepDesc}>` 2-3 sentence description
   - `<div style={tagList}>` with relevant technology tags
   - `<div style={codeBlock}>` with `<pre><code>{STEPN_CODE}</code></pre>`
3. Add `<hr style={divider} />` before the new step block.
4. Update the intro paragraph if it references a step count (e.g. "Three incremental steps" → "Four incremental steps").

### 5. Update react-app/src/pages/Features.tsx

Read the current Features.tsx. Then update as needed:

- **New tools**: If the new step registers new tools in ToolRegistry, add them to the `tools` array with `name`, `sig`, and `desc` fields, following the existing entries.
- **New prompt placeholders**: If new `{{placeholder}}` variables were added to the system prompt template, add them to the context tokens grid (token + label).
- **Prompt snippet file reference**: Update the `promptFileName` span to point to the latest step's `system_prompt.py` (e.g. `step5/system_prompt.py`).
- **New permission modes**: If new `PermissionMode` values were added, update the permission modes section.

### 6. Update react-app/src/pages/Home.tsx

Read the current Home.tsx. Then update as needed:

- **"What's inside" cards**: Update the step count card text (e.g. "4 progressive steps" → "5 progressive steps"). Add a new card for the primary new capability introduced in this step, with a `title` and `desc` following the existing card format.
- **Terminal demo**: If the `terminalBar` label references an older step (e.g. `step3/agent.py`), update it to the latest step.
- **Hero/subtitle**: If the subtitle or badge mentions specific step counts or capabilities that are now outdated, update them.

## Notes

- Always read before writing. Use `read_file` on each target file before editing it.
- Follow existing code style and formatting precisely — do not reformat untouched code.
- Use `edit_file` (not `write_file`) for all modifications to existing files.
- Be thorough: all four files must be updated in a single task run.
