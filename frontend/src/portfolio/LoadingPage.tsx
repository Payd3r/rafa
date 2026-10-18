export function Header() {
  return <header className="site-header">
    <a className="brand" href="/#top" aria-label="Andrea Farao, inizio home">ANDREA FARAO</a>
    <nav className="nav" aria-label="Navigazione principale"><a href="/#work">Progetti</a><a href="/#about">Chi sono</a><a href="/#contact">Contatti</a></nav>
  </header>
}
export function LoadingContent({ detail = false, gallery = false }: { detail?: boolean; gallery?: boolean }) {
  return <main className={`page-loading ${detail ? 'loading-detail' : gallery ? 'loading-gallery' : 'loading-home'}`} aria-busy="true" aria-label="Caricamento fotografie">
    {detail && <div className="loading-heading"><span className="loading-meta"/><span className="loading-title"/></div>}
    <div className="loading-photos">{Array.from({length: detail || gallery ? 6 : 5},(_,i) => <span key={i}/>)}</div>
  </main>
}
export function LoadingPage() {
  const path = window.location.pathname
  return <div className="portfolio" id="top"><Header/><LoadingContent detail={path.startsWith('/projects/')} gallery={path === '/gallery'}/></div>
}
