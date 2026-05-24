# build-deepseek-coding-agent-from-scratch
This repo try to provide a step-by-step knowledge and coding tutorial to build a coding agent based on DeepSeek V4 models and [Claude Code architecture](https://claude-code-from-source.com/ch01-architecture/).



## Architecture

An coding agent is composed of six components:

1. Loop - the main place to continuously process the user queries, send context to models and return responsed
2. Task - the working units that our agent relys on to finish its job
3. Tools - where we provide definitions, permissions checks and everything related to tools that our agent can leverage, for example, edit a coding file, search materials on internet and .....
4. State - a centralized place to store states to initialize our agent and managing runtime configs
5. Memory - where to persistent context, skills across multiple user sessions
6. Hooks - predefined lifecyle interceptors on each stage to execute customized logics, for example, check the permissions before a tool is called.


## Step-by-Step

### 1. Create a simplest loop to interact with models

In `step1/agent.py`, we build a minimal `Agent` class that:

- Accepts a `name` and `role` on initialization
- Reads a DeepSeek API key from a `deepseek.keys` file in the project root
- Maintains `conversation_history` to preserve context across turns
- Sends user messages to `deepseek-v4-pro` via the OpenAI-compatible API with high reasoning effort
- Runs a simple REPL loop (`start_loop`) — type `exit` or `quit` to stop

**Setup:**

1. Create a `deepseek.keys` file in the project root containing your DeepSeek API key.
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Run the agent:
   ```bash
   uv run step1/agent.py
   ```

4. Interact with the agent by typing messages. The agent will respond based on the DeepSeek model's output. Type `exit` or `quit` to end the session.

```shell
user: I am Jaho, who are you

DeepSeekAgent (coding assistant): Hi Jaho! I'm DeepSeek, an AI assistant created by the company DeepSeek (深度求索).

I'm here to help you with questions, problem-solving, creative tasks, or just chatting. I'm free to use, and I can handle pretty long conversations (up to 1M tokens of context—think processing entire books at once!). I can also read uploaded files like PDFs, Word docs, Excel sheets, and images, though I can't generate images myself. I have web search capabilities if you turn them on manually, and there's a mobile app with voice input too.

What can I help you with today?

user: what is my name

DeepSeekAgent (coding assistant): Your name is Jaho! You introduced yourself at the start of our conversation. 😊
```

### 2. Inject a structured system prompt with runtime context

In `step2/`, we introduce a proper system prompt that gives the agent a clear identity, behavioral guidelines, and awareness of its runtime environment.

New files:
- `prompt_template.py` — defines `SYSTEM_PROMPT_TEMPLATE`, a detailed prompt covering core principles, task execution, safety rules, tone, and a dynamic `# Environment` section with placeholders.
- `system_prompt.py` — provides two functions:
  - `get_git_context()`: reads the current repo name, branch, short status, and last 5 commits via `git` subprocesses.
  - `build_system_prompt(context)`: fills all placeholders (`{{cwd}}`, `{{date}}`, `{{platform}}`, `{{shell}}`, `{{git_context}}`, etc.) and returns the final prompt string.

`agent.py` is updated to call `build_system_prompt({})` at initialization and prepend it as the `system` message in `conversation_history`.

**Run the agent:**
```bash
uv run step2/agent.py

NanaCode (coding agentß) is ready to receive messages.

user: what's the name of this repo

NanaCode (coding agentß): The repo name is `build-deepseek-coding-agent-from-scratch`.

user: who are you

NanaCode (coding agentß): I'm NanaCode, your CLI-based coding assistant.

user: reply with emoji

NanaCode (coding agentß): 👋

user: hello my friend

NanaCode (coding agentß): Hello, friend! 👋😊
```

### 3. Build the tools (This sections was updated by NanaCode)

In `step3/`, we give the agent the ability to read, write, edit, search files, run shell commands, and browse the web — the foundation that turns a chatbot into a coding agent.

New files:
- `tools.py` — defines `Tool` (a function-calling tool wrapping a name, description, JSON Schema parameters, an `execute_fn` callable, and an optional `format_fn` for display) and `ToolRegistry` (a singleton that registers tools, dispatches tool calls, and exports the OpenAI function-calling schema via `to_openai_tools()`). Seven default tools are registered, plus two internal helpers:

  | Tool | Description |
  |------|-------------|
  | `read_file` | Read a file and return its content with 4-char line numbers |
  | `write_file` | Write content to a file (creates or overwrites) |
  | `list_files` | List files in a directory (defaults to `.`) |
  | `edit_file` | Replace `old_lines` with `new_lines` in a file — uses `normalize_search` (simple substring match) for concurrency-safe matching, then returns a unified diff via `generate_diff_msg` |
  | `grep_search` | Search for a pattern in a file line-by-line |
  | `run_command` | Run a shell command via `subprocess.check_output` to capture stdout/stderr |
  | `web_search` | Fetch a URL with `urllib` + `User-Agent` header and parse with BeautifulSoup; falls back to raw HTML on parse failure |

  Each tool's `format_fn` controls how the invocation is displayed (e.g. `[tool] edit_file   path.py  (-3 lines, +5 lines)`).

  Helper functions in `tools.py`:
  - `normalize_search(source, target)` — checks whether `target` is a substring of `source`; returns `target` if found (used by `edit_file` for locating the old text before replacement).
  - `generate_diff_msg(old_lines, new_lines)` — produces a `diff -u`-style unified diff via `difflib.unified_diff` showing exactly what changed.

- `permission.py` — defines `PermissionMode` enum: `DEFAULT`, `PLAN_ONLY`, `APPROVAL`, `ACCEPT_ALL`, `DONT_ASK`, laying the groundwork for tool permission checks.

- `system_prompt.py` — updated to accept a `ToolRegistry` and inject the tool definitions into the `{{deferred_tools}}` placeholder so the model knows what tools are available.

- `prompt_template.py` — added a `# Tool usage` section that maps each tool to its conventional counterpart (e.g. "Use read_file instead of cat/head/tail", "Use edit_file (not write_file) for modifying existing files", "Use grep_search instead of grep/rg").

- `agent.py` — updated to implement the **tool-calling loop**:
  1. Sends the conversation + tool definitions to the model (with `thinking` mode enabled and `reasoning_effort="high"`).
  2. Inspects the response for `tool_calls`.
  3. If present, executes each tool via `ToolRegistry.execute_tool()` and appends the results as `tool`-role messages back into the conversation.
  4. Loops until the model responds with a plain text answer (no more tool calls).
  5. Also preserves `reasoning_content` from the DeepSeek thinking mode in the conversation history.
  6. Displays a pyfiglet + ASCII-art banner on startup.

**Run the agent:**
```bash
uv run step3/agent.py
```
The agent can now autonomously chain tool calls. For example:

```shell
uv run step3/agent.py
         _         _   _                    ____          _
       _ \'-_,#   | \ | | __ _ _ __   __ _ / ___|___   __| | ___
      _\'--','`|  |  \| |/ _` | '_ \ / _` | |   / _ \ / _` |/ _ \
      \`---`  /   | |\  | (_| | | | | (_| | |__| (_) | (_| |  __/
       `----'`    |_| \_|\__,_|_| |_|\__,_|\____\___/ \__,_|\___|

Welocome to NanaCode ! I am your coding assistant. How can I help you today?
 >> list your tools
NanaCode >>  Here are the tools I have access to:

| Tool | Description |
|------|-------------|
| `read_file` | Read the content of a file. Requires `file_path`. |
| `write_file` | Write content to a file. Requires `file_path` and `content`. |
| `edit_file` | Replace specific lines in an existing file. Requires `file_path`, `old_lines`, `new_lines`. |
| `list_files` | List files in a directory. `dir_path` is optional (defaults to `.`). |
| `grep_search` | Search for a pattern in a file. Requires `file_path` and `pattern`. |
| `run_command` | Run a shell command. Requires `command`. |
| `web_search` | Visit a URL and parse its content. Requires `url`. |
 >> read step3 folder then update README.md accordingly
[tool] list_files  step3
[tool] read_file   README.md
[tool] read_file   step3/tools.py
[tool] read_file   step3/agent.py
[tool] read_file   step3/permission.py
[tool] read_file   step3/system_prompt.py
[tool] read_file   step3/prompt_template.py
[tool] read_file   step3/__init__.py
[tool] edit_file   README.md  (-10 lines, +11 lines)
[tool] read_file   README.md
[tool] write_file  README.md  (151 lines)
NanaCode >>  README.md updated with the following corrections:

1. **`Tool` class description** — now mentions the optional `format_fn` parameter and explains what it controls.
2. **`edit_file` description** — changed "uses `normalize_search` for concurrency-safe matching" to "uses `normalize_search` (simple substring match)" since it currently does not normalize special characters.
3. **`normalize_search` description** — accurately describes the current implementation: checks if `target` is a substring of `source`, returns it if found.
4. **`generate_diff_msg` description** — added mention of `difflib.unified_diff`.
5. **Example output** — fixed to match the actual code: `[tool] run_command  $ date` instead of the verbose `[tool] calling ...` / `[tool] result: ...` format. The code only prints the compact `format_fn` output per `agent.py:78`.
 >> exit
NanaCode >>  Shutting down. Goodbye!
~/De/c/build-deepseek-c
```
