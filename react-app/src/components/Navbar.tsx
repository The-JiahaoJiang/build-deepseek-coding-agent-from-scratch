const navStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
}

const innerStyle: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '0 2.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '56px',
}

const logoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
  fontSize: '1rem',
  color: 'var(--color-accent)',
  textDecoration: 'none',
  letterSpacing: '-0.02em',
}

const linksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  listStyle: 'none',
}

const linkStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.875rem',
  color: 'var(--color-muted)',
  textDecoration: 'none',
  transition: 'color 0.15s',
}

interface NavbarProps {
  current: string
  onNavigate: (page: string) => void
}

export default function Navbar({ current, onNavigate }: NavbarProps) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'steps', label: 'Steps' },
    { id: 'features', label: 'Features' },
  ]

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <a
          href="#home"
          style={logoStyle}
          onClick={(e) => { e.preventDefault(); onNavigate('home') }}
        >
          {'> NanaCode'}
        </a>
        <ul style={linksStyle}>
          {links.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                style={{
                  ...linkStyle,
                  color: current === id ? 'var(--color-text)' : 'var(--color-muted)',
                }}
                onClick={(e) => { e.preventDefault(); onNavigate(id) }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
