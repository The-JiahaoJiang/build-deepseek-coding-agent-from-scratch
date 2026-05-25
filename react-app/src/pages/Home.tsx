const page: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '4rem 2.5rem',
}

const hero: React.CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  paddingBottom: '4rem',
  borderBottom: '1px solid var(--color-border)',
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.75rem',
  color: 'var(--color-accent)',
  background: 'rgba(63,185,80,0.1)',
  border: '1px solid rgba(63,185,80,0.3)',
  borderRadius: '4px',
  padding: '0.2rem 0.6rem',
}

const h1Style: React.CSSProperties = {
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 600,
  letterSpacing: '-0.03em',
  color: 'var(--color-text)',
}

const subtitle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: 'var(--color-muted)',
  maxWidth: '560px',
}

const ctaRow: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
}

const primaryBtn: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-bg)',
  background: 'var(--color-primary)',
  border: 'none',
  borderRadius: '6px',
  padding: '0.6rem 1.25rem',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
}

const ghostBtn: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0.6rem 1.25rem',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
}

const terminal: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
}

const terminalBar: React.CSSProperties = {
  padding: '0.6rem 1rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  gap: '0.4rem',
  alignItems: 'center',
}

const dot = (color: string): React.CSSProperties => ({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: color,
})

const terminalBody: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  lineHeight: '1.8',
}

const dim: React.CSSProperties = { color: 'var(--color-muted)' }
const green: React.CSSProperties = { color: 'var(--color-accent)' }
const blue: React.CSSProperties = { color: 'var(--color-primary)' }
const warn: React.CSSProperties = { color: 'var(--color-warn)' }

const section: React.CSSProperties = {
  paddingTop: '4rem',
  display: 'grid',
  gap: '2rem',
}

const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
}

const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  padding: '1.5rem',
  display: 'grid',
  gap: '0.5rem',
}

const cardTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.95rem',
  color: 'var(--color-text)',
}

const cardDesc: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-muted)',
  lineHeight: '1.6',
}

interface HomeProps {
  onNavigate: (page: string) => void
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <main style={page}>
      {/* Hero */}
      <section style={hero}>
        <span style={badge}>v3 · DeepSeek · OpenAI tool-calling</span>
        <h1 style={h1Style}>Build a coding agent<br />from scratch</h1>
        <p style={subtitle}>
          A step-by-step tutorial for building <strong>NanaCode</strong> —
          a DeepSeek-powered coding agent with file tools, shell execution,
          and a structured system prompt.
        </p>
        <div style={ctaRow}>
          <a
            href="#steps"
            style={primaryBtn}
            onClick={(e) => { e.preventDefault(); onNavigate('steps') }}
          >
            View the steps →
          </a>
          <a
            href="https://github.com/The-Jiahaojiang/build-deepseek-coding-agent-from-scratch"
            target="_blank"
            rel="noreferrer"
            style={ghostBtn}
          >
            GitHub
          </a>
        </div>

        {/* Terminal demo */}
        <div style={terminal}>
          <div style={terminalBar}>
            <span style={dot('#ff5f57')} />
            <span style={dot('#febc2e')} />
            <span style={dot('#28c840')} />
            <span style={{ ...dim, marginLeft: '0.5rem', fontSize: '0.75rem' }}>
              step3/agent.py
            </span>
          </div>
          <div style={terminalBody}>
            <div><span style={green}>NanaCode</span> <span style={dim}>Coding Agent · DeepSeek v4 pro</span></div>
            <div style={dim}>─────────────────────────────────────</div>
            <div><span style={dim}> &gt;&gt; </span>refactor the read_file tool to handle binary files</div>
            <br />
            <div><span style={blue}>[NanaCode]</span> <span style={green}>&gt;&gt;</span> I'll read the current implementation first.</div>
            <div><span style={warn}>[tool]</span> read_file   step3/tools.py</div>
            <div><span style={warn}>[tool]</span> edit_file   step3/tools.py  (-3 lines, +8 lines)</div>
            <div><span style={blue}>[NanaCode]</span> <span style={green}>&gt;&gt;</span> Done. Added binary detection and base64 fallback.</div>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section style={section}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>What's inside</h2>
        <div style={cardsGrid}>
          {[
            {
              title: '4 progressive steps',
              desc: 'From a single-turn chat loop to a full tool-calling agent with a permission system — each step builds on the last.',
            },
            {
              title: 'ToolRegistry',
              desc: 'read_file, write_file, edit_file, list_files, grep_search, run_command, web_search.',
            },
            {
              title: 'Structured system prompt',
              desc: 'Git context, platform, cwd, and date injected at runtime so the agent always knows where it is.',
            },
            {
              title: 'DeepSeek API',
              desc: 'Uses the OpenAI-compatible endpoint with deepseek-v4-pro and native tool-calling.',
            },
          ].map(({ title, desc }) => (
            <div key={title} style={card}>
              <div style={cardTitle}>{title}</div>
              <div style={cardDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
