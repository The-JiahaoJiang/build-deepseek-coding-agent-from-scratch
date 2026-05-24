import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Steps from './pages/Steps'
import Features from './pages/Features'

function getPage(): string {
  const hash = window.location.hash.replace('#', '')
  return ['home', 'steps', 'features'].includes(hash) ? hash : 'home'
}

function App() {
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const handler = () => setPage(getPage())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  function navigate(id: string) {
    window.location.hash = id
    setPage(id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar current={page} onNavigate={navigate} />
      {page === 'home' && <Home onNavigate={navigate} />}
      {page === 'steps' && <Steps />}
      {page === 'features' && <Features />}
    </div>
  )
}

export default App

