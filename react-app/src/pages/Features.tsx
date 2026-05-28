const page: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '4rem 2.5rem',
  display: 'grid',
  gap: '3rem',
}

const intro: React.CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1px',
  background: 'var(--color-border)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
}

const cell: React.CSSProperties = {
  background: 'var(--color-surface)',
  padding: '1.5rem',
  display: 'grid',
  gap: '0.75rem',
}

const cellIcon: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.75rem',
  color: 'var(--color-accent)',
  background: 'rgba(63,185,80,0.08)',
  border: '1px solid rgba(63,185,80,0.2)',
  borderRadius: '4px',
  padding: '0.2rem 0.5rem',
  display: 'inline-block',
  width: 'fit-content',
}

const cellTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.9375rem',
  color: 'var(--color-text)',
}

const cellDesc: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-muted)',
  lineHeight: '1.6',
}

const sigLine: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.775rem',
  color: 'var(--color-primary)',
  background: 'rgba(88,166,255,0.06)',
  borderRadius: '4px',
  padding: '0.3rem 0.6rem',
  display: 'inline-block',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

const promptBox: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
}

const promptHeader: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
}

const promptFileName: React.CSSProperties = {
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

const PROMPT_SNIPPET = `\
def build_system_prompt(toolRegistry: ToolRegistry) -> str:
    git_context = get_git_context()   # repo name, branch, status, last 5 commits
    plat        = f"{platform.system()} {platform.machine()}"
    shell       = os.environ.get("SHELL", "/bin/sh")
    today       = date.today().isoformat()

    replacements = {
        "{{cwd}}": str(Path.cwd()),
        "{{date}}": today,
        "{{platform}}": plat,
        "{{shell}}": shell,
        "{{git_context}}": git_context,
        "{{tools}}": str(toolRegistry.to_openai_tools()),
        "{{claude_md}}": "Not available",
        "{{memory}}": "Not available",
        "{{skills}}": "Not available",
        "{{agents}}": "Not available",
    }
    result = SYSTEM_PROMPT_TEMPLATE
    for key, value in replacements.items():
        result = result.replace(key, value)
    return result
`

const tools = [
  {
    name: 'read_file',
    sig: 'read_file(file_path: str) → str',
    desc: 'Read the full text content of any file. Used to inspect source code before editing.',
  },
  {
    name: 'write_file',
    sig: 'write_file(file_path: str, content: str) → str',
    desc: 'Create or overwrite a file with the given content.',
  },
  {
    name: 'edit_file',
    sig: 'edit_file(file_path: str, old_lines: str, new_lines: str) → str',
    desc: 'Replace old_lines with new_lines in a file. Provides optimistic concurrency — the edit is rejected if old_lines no longer match.',
  },
  {
    name: 'list_files',
    sig: 'list_files(dir_path?: str) → str',
    desc: 'List all files in a directory. Defaults to the current working directory.',
  },
  {
    name: 'grep_search',
    sig: 'grep_search(file_path: str, pattern: str) → str',
    desc: 'Search for a regex pattern inside a file and return matching lines with line numbers.',
  },
  {
    name: 'run_command',
    sig: 'run_command(command: str) → str',
    desc: 'Execute any shell command and return stdout + stderr. Used for running tests, builds, and git operations.',
  },
  {
    name: 'web_search',
    sig: 'web_search(query: str) → str',
    desc: 'Search the web for up-to-date information, documentation, or error messages.',
  },
  {
    name: 'load_skill',
    sig: 'load_skill(name: str) → str',
    desc: 'Load a skill by name to get specialized instructions for a task. Skills are markdown files with YAML frontmatter stored in .skills/.',
  },
]

export default function Features() {
  return (
    <main style={page}>
      <div style={intro}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Features</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', maxWidth: '600px' }}>
          NanaCode exposes eight tools to the model via the OpenAI function-calling
          schema. Each tool maps to a single Python function registered in the{' '}
          <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>ToolRegistry</code>.
        </p>
      </div>

      {/* Tools grid */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <h2 style={sectionTitle}>ToolRegistry</h2>
        <div style={grid}>
          {tools.map(({ name, sig, desc }) => (
            <div key={name} style={cell}>
              <span style={cellIcon}>{name}</span>
              <div style={cellTitle}>{name}</div>
              <span style={sigLine}>{sig}</span>
              <div style={cellDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* System prompt */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <h2 style={sectionTitle}>System prompt</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
            At startup the system prompt is assembled from a template and injected
            as the first message. It gives the model situational awareness so it
            never has to guess where it is or what tools it has.
          </p>
        </div>
        <div style={promptBox}>
          <div style={promptHeader}>
            <span style={promptFileName}>step5/system_prompt.py</span>
          </div>
          <pre style={pre}><code>{PROMPT_SNIPPET}</code></pre>
        </div>

        {/* Context tokens */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            { token: '{{cwd}}', label: 'Working directory' },
            { token: '{{date}}', label: 'ISO date' },
            { token: '{{platform}}', label: 'OS + arch' },
            { token: '{{shell}}', label: 'Login shell' },
            { token: '{{git_context}}', label: 'Branch · status · log' },
            { token: '{{tools}}', label: 'Tool schemas (OpenAI format)' },
            { token: '{{claude_md}}', label: 'CLAUDE.md context' },
            { token: '{{memory}}', label: 'Persistent memory' },
            { token: '{{skills}}', label: 'Skill definitions' },
            { token: '{{agents}}', label: 'Sub-agent registry' },
          ].map(({ token, label }) => (
            <div
              key={token}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                display: 'grid',
                gap: '0.25rem',
              }}
            >
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                {token}
              </code>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Permission modes */}
      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <h2 style={sectionTitle}>Permission modes</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
            Every write operation passes through a pre-tool hook before execution.
            The active <code style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>PermissionMode</code> controls
            whether the agent prompts the user, auto-approves, or blocks the call entirely.
          </p>
        </div>
        <div style={grid}>
          {[
            {
              name: 'DEFAULT',
              sig: 'PermissionMode.DEFAULT',
              desc: 'Read ops run freely. Each write op triggers an interactive prompt — accept, accept-for-file, accept-all, or deny.',
            },
            {
              name: 'PLAN_ONLY',
              sig: 'PermissionMode.PLAN_ONLY',
              desc: 'All write ops are blocked. The agent can only read files and reason about a plan without modifying anything.',
            },
            {
              name: 'ACCEPT_EDITS',
              sig: 'PermissionMode.ACCEPT_EDITS',
              desc: 'Write ops on files the user has already approved run silently. New files still require a prompt.',
            },
            {
              name: 'ACCEPT_ALL',
              sig: 'PermissionMode.ACCEPT_ALL',
              desc: 'All tool calls — reads and writes — execute without any prompts for the rest of the session.',
            },
          ].map(({ name, sig, desc }) => (
            <div key={name} style={cell}>
              <span style={cellIcon}>{name}</span>
              <div style={cellTitle}>{name}</div>
              <span style={sigLine}>{sig}</span>
              <div style={cellDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
