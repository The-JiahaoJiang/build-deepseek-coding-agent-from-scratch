# NanaCode — GitHub Pages Site

This is the **React + TypeScript + Vite** frontend for the [build-deepseek-coding-agent-from-scratch](https://github.com/jahojiang/nanacode) project. It is deployed automatically to GitHub Pages via the workflow at `../.github/workflows/static.yml`.

---

## Agent Instructions: How to Update This Site

> These instructions are written for an AI coding agent (such as NanaCode itself). Follow them when asked to update, redesign, or add content to the site.

### Project layout

```
react-app/
├── public/              # Static assets (favicon, images)
├── src/
│   ├── assets/          # Images imported by components
│   ├── components/      # Reusable UI components
│   ├── pages/           # Top-level page components
│   ├── App.tsx          # Root component and routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.ts       # base: '/nanacode/' — do NOT change this
└── package.json
```

### How to add or change a page

1. Create a new file in `src/pages/`, e.g. `src/pages/About.tsx`.
2. Import and add a route for it in `src/App.tsx`.
3. Link to it from the `<Navbar />` component in `src/components/Navbar.tsx`.

### How to update content that mirrors the Python repo

The Python source lives one directory above this folder (`../`). The agent is built in three progressive steps:

| Directory | What it contains |
|-----------|-----------------|
| `../step1/agent.py` | Minimal agent — single-turn DeepSeek chat loop |
| `../step2/agent.py` | Multi-turn agent with conversation history and a system prompt |
| `../step3/agent.py` | Full agent named **NanaCode** with a `ToolRegistry` (read_file, write_file, edit_file, list_files, grep_search, run_command, web_search) |
| `../step3/tools.py` | Tool definitions following the OpenAI function-calling schema |
| `../step3/system_prompt.py` | Builds the system prompt with git context, platform, cwd, and date |

When adding a **Features**, **Steps**, or **Docs** page, read the relevant Python files from `../step1`, `../step2`, `../step3` to extract accurate descriptions before writing JSX.

### Deployment

Pushing to `main` triggers the GitHub Actions workflow which runs:

```bash
npm ci
npm run build   # tsc -b && vite build → outputs to dist/
```

The `dist/` folder is then deployed to GitHub Pages. **Never commit the `dist/` folder.**

To preview locally:

```bash
npm install
npm run dev     # http://localhost:5173/nanacode/
```

---

## UI Style Requirements

Follow these conventions for all new components and pages.

### Color palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0d1117` | Page background |
| `--color-surface` | `#161b22` | Cards, panels, code blocks |
| `--color-border` | `#30363d` | Borders, dividers |
| `--color-primary` | `#58a6ff` | Links, active states, highlights |
| `--color-accent` | `#3fb950` | Success states, terminal output, badges |
| `--color-warn` | `#d29922` | Warnings |
| `--color-text` | `#e6edf3` | Body text |
| `--color-muted` | `#8b949e` | Captions, labels, secondary text |

Define these as CSS custom properties on `:root` in `src/index.css`.

### Typography

- **Font family:** `'JetBrains Mono', monospace` for code and terminal elements; `'Inter', sans-serif` for all other text.
- **Base size:** `16px`, line-height `1.6`.
- **Headings:** semi-bold (`600`), no uppercase transforms.
- Import both fonts from Google Fonts in `index.html`.

### Component conventions

- **No external UI libraries** (no MUI, no Shadcn, no Chakra). Build components from scratch with plain CSS modules or inline CSS custom properties.
- **Dark theme only.** There is no light-mode toggle.
- Prefer `display: grid` and `gap` over absolute positioning.
- All interactive elements must have a visible `:focus-visible` outline using `--color-primary`.
- Code snippets must use a `<pre><code>` block with `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, and monospace font.
- Terminal-style output (agent responses, tool calls) should use `color: var(--color-accent)` on a dark surface to mimic the CLI look of the Python agent.

### Layout

- Max content width: `860px`, centered with `margin: 0 auto`.
- Horizontal padding: `1.5rem` on mobile, `2.5rem` on desktop (`min-width: 768px`).
- Navbar: sticky, `background: var(--color-surface)`, `border-bottom: 1px solid var(--color-border)`.
- Section spacing: `4rem` vertical gap between sections.
