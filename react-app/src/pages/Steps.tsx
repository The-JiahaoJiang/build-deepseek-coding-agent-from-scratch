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
import openai

client = openai.OpenAI(
    api_key=open("deepseek.keys").read().strip(),
    base_url="https://api.deepseek.com",
)

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[{"role": "user", "content": input(" >> ")}],
)

print(response.choices[0].message.content)
`

const STEP2_CODE = `\
# Multi-turn loop with system prompt and conversation history

history = [{"role": "system", "content": build_system_prompt()}]

while True:
    user_input = input(" >> ")
    history.append({"role": "user", "content": user_input})

    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=history,
    )
    reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    print(f"[NanaCode] >> {reply}")
`

const STEP3_CODE = `\
# Full agent: tool-calling loop with ToolRegistry

while True:
    msg = self.get_response()               # call DeepSeek
    tool_calls = self.inspect_response_for_tools(msg)

    self.conversation_history.append(msg_dict)

    if not tool_calls:
        break                               # plain text reply — done

    for tc in tool_calls:
        tool = self.tool_registry.get_tool(tc["name"])
        result = self.tool_registry.execute_tool(tc)
        print(tool.format_call(tc["args"]))  # e.g. [tool] read_file  src/app.py
        self.conversation_history.append({
            "role": "tool",
            "tool_call_id": tc["id"],
            "content": str(result),
        })
    # loop → model sees tool results, decides next action
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
        </p>
        <div style={tagList}>
          {['ToolRegistry', 'tool-calling loop', 'read_file', 'write_file', 'edit_file', 'run_command', 'web_search'].map(t => (
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
    </main>
  )
}
