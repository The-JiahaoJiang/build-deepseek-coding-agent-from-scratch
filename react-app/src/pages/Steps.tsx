const page: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '4rem 2.5rem',
  display: 'grid',
  gap: '4rem',
}

const stepWrap: React.CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
}

const stepHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '1rem',
}

const stepNum: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.75rem',
  color: 'var(--color-accent)',
  background: 'rgba(63,185,80,0.1)',
  border: '1px solid rgba(63,185,80,0.3)',
  borderRadius: '4px',
  padding: '0.2rem 0.5rem',
  flexShrink: 0,
}

const stepTitle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

const stepDesc: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--color-muted)',
  lineHeight: '1.7',
  maxWidth: '640px',
}

const codeBlock: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
}

const codeHeader: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const fileName: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.75rem',
  color: 'var(--color-muted)',
}

const pre: React.CSSProperties = {
  margin: 0,
  padding: '1.25rem 1.5rem',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  lineHeight: '1.7',
  color: 'var(--color-text)',
  overflowX: 'auto',
  whiteSpace: 'pre',
}

const tagList: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const tag: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.7rem',
  color: 'var(--color-primary)',
  background: 'rgba(88,166,255,0.08)',
  border: '1px solid rgba(88,166,255,0.2)',
  borderRadius: '4px',
  padding: '0.15rem 0.5rem',
}

const divider: React.CSSProperties = {
  borderTop: '1px solid var(--color-border)',
}

const STEP1_CODE = `\
class Agent:
    def __init__(self, name, role):
        self.name = name
        self.role = role
        self.conversation_history = []
        self.client = openai.OpenAI(
            api_key=self._read_api_key(),
            base_url="https://api.deepseek.com",
        )
        self.model_name = "deepseek-v4-pro"

    def send_message(self, message):
        self.conversation_history.append({"role": "user", "content": message})
        response = self.get_response()
        self.conversation_history.append({"role": "assistant", "content": response})
        print(f"{self.name} ({self.role}): {response}")

    def get_response(self):
        return self.client.chat.completions.create(
            model=self.model_name,
            messages=self.conversation_history,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        ).choices[0].message.content.strip()

    def start_loop(self):
        while True:
            user_input = input("user: ")
            if user_input.lower() in ["exit", "quit"]:
                break
            self.send_message(user_input)
`

const STEP2_CODE = `\
# step2 adds a structured system prompt injected at init time
from system_prompt import build_system_prompt

class Agent(...):
    def __init__(self, name, role):
        ...  # same as step 1

        # NEW: build system prompt and prepend to conversation history
        self._system_prompt = build_system_prompt({})
        self.conversation_history.append({
            "role": "system",
            "content": self._system_prompt,
        })

# system_prompt.py fills {{cwd}}, {{date}}, {{platform}},
# {{shell}}, {{git_context}} from the live environment
`

const STEP3_CODE = `\
# step3: ToolRegistry + tool-calling loop
from tools import ToolRegistry

class Agent(...):
    def __init__(self):
        self.tool_registry = ToolRegistry()
        self._system_prompt = build_system_prompt(self.tool_registry)
        ...

    def send_message(self, message):
        self.conversation_history.append({"role": "user", "content": message})

        while True:
            msg = self.get_response()          # call DeepSeek
            tool_calls = self.inspect_response_for_tools(msg)
            self.conversation_history.append(msg_dict)

            if not tool_calls:
                break                          # plain-text reply — done

            for tc in tool_calls:
                tool = self.tool_registry.get_tool(tc["name"])
                result = self.tool_registry.execute_tool(tc)
                print(tool.format_call(tc["args"]))  # [tool] read_file  src/app.py
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": str(result),
                })
            # loop → model sees tool results, decides next action

        self._print_agent(msg.content or "")
`

const STEP4_CODE = `\
# step4: permission system via pre-tool hooks
from permission import PermissionMode
from tools import OpType

class Agent(...):
    def __init__(self):
        ...  # same as step 3
        self._permission_mode = PermissionMode.DEFAULT
        self._accepted_files: set = set()
        self._pre_tool_hooks = []
        self.register_pre_tool_hook(self.inspect_permission)

    def inspect_permission(self, tc: dict) -> bool:
        tool = self.tool_registry.get_tool(tc["name"])
        if tool is None or tool.op_type != OpType.WRITE:
            return True   # READ ops always allowed
        if self._permission_mode == PermissionMode.ACCEPT_ALL:
            return True
        if self._permission_mode == PermissionMode.PLAN_ONLY:
            return False  # deny all writes
        # DEFAULT → interactive prompt
        print("[permission] Write operation requested:")
        print(f"  {tool.format_call(tc['args'])}")
        choice = input("  [a] Accept  [b] Accept file  [c] Accept all  [d] Deny: ")
        if choice == "a":  return True
        if choice == "c":  self._permission_mode = PermissionMode.ACCEPT_ALL; return True
        return False  # deny

    def send_message(self, message):
        ...
        for tc in tool_calls:
            # run hooks before each tool — denial skips execution
            if not all(hook(tc) for hook in self._pre_tool_hooks):
                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": "Tool call denied by user.",
                })
                continue
            tool_response = self.tool_registry.execute_tool(tc)
            ...
`

export default function Steps() {
  return (
    <main style={page}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Building NanaCode
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
          Three incremental steps from a bare API call to a full agentic coding assistant.
        </p>
      </div>

      <hr style={divider} />

      {/* Step 1 */}
      <div style={stepWrap}>
        <div style={stepHeader}>
          <span style={stepNum}>step 1</span>
          <h2 style={stepTitle}>Single-turn chat</h2>
        </div>
        <p style={stepDesc}>
          The simplest possible agent: one user message, one DeepSeek response, done.
          No memory, no tools, no system prompt — just the raw API call to establish
          the foundation.
        </p>
        <div style={tagList}>
          {['openai SDK', 'deepseek-v4-pro', 'single turn'].map(t => (
            <span key={t} style={tag}>{t}</span>
          ))}
        </div>
        <div style={codeBlock}>
          <div style={codeHeader}>
            <span style={fileName}>step1/agent.py</span>
          </div>
          <pre style={pre}><code>{STEP1_CODE}</code></pre>
        </div>
      </div>

      <hr style={divider} />

      {/* Step 2 */}
      <div style={stepWrap}>
        <div style={stepHeader}>
          <span style={stepNum}>step 2</span>
          <h2 style={stepTitle}>Multi-turn with system prompt</h2>
        </div>
        <p style={stepDesc}>
          Add a <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>conversation_history</code> list
          so the model remembers prior turns. Introduce a system prompt built
          from a template that includes the current date, platform, working
          directory, and recent git log.
        </p>
        <div style={tagList}>
          {['conversation history', 'system prompt', 'git context', 'prompt template'].map(t => (
            <span key={t} style={tag}>{t}</span>
          ))}
        </div>
        <div style={codeBlock}>
          <div style={codeHeader}>
            <span style={fileName}>step2/agent.py</span>
          </div>
          <pre style={pre}><code>{STEP2_CODE}</code></pre>
        </div>
      </div>

      <hr style={divider} />

      {/* Step 3 */}
      <div style={stepWrap}>
        <div style={stepHeader}>
          <span style={stepNum}>step 3</span>
          <h2 style={stepTitle}>Full agent — NanaCode</h2>
        </div>
        <p style={stepDesc}>
          Plug in a <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>ToolRegistry</code> and
          implement the tool-calling loop. After each API response, check for
          tool calls, execute them, append the results to history, and loop
          back until the model returns a plain text reply with no tool calls.
          DeepSeek's <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>reasoning_content</code> is
          also preserved in history so the model retains chain-of-thought across turns.
        </p>
        <div style={tagList}>
          {['ToolRegistry', 'tool-calling loop', 'read_file', 'write_file', 'edit_file', 'run_command', 'web_search', 'reasoning_content'].map(t => (
            <span key={t} style={tag}>{t}</span>
          ))}
        </div>
        <div style={codeBlock}>
          <div style={codeHeader}>
            <span style={fileName}>step3/agent.py</span>
          </div>
          <pre style={pre}><code>{STEP3_CODE}</code></pre>
        </div>
      </div>

      <hr style={divider} />

      {/* Step 4 */}
      <div style={stepWrap}>
        <div style={stepHeader}>
          <span style={stepNum}>step 4</span>
          <h2 style={stepTitle}>Permission system</h2>
        </div>
        <p style={stepDesc}>
          Add a <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>PermissionMode</code> enum
          and a pre-tool hook pipeline so users control which write operations the agent
          may execute. Each tool now carries an{' '}
          <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>OpType</code> ({' '}
          <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>READ</code> /{' '}
          <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>WRITE</code>)
          and the hook intercepts writes to prompt for approval.
        </p>
        <div style={tagList}>
          {['PermissionMode', 'OpType', 'pre-tool hooks', 'PLAN_ONLY', 'ACCEPT_EDITS', 'ACCEPT_ALL', 'interactive prompt'].map(t => (
            <span key={t} style={tag}>{t}</span>
          ))}
        </div>
        <div style={codeBlock}>
          <div style={codeHeader}>
            <span style={fileName}>step4/agent.py</span>
          </div>
          <pre style={pre}><code>{STEP4_CODE}</code></pre>
        </div>
      </div>
    </main>
  )
}
