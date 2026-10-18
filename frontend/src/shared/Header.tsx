import { Link } from "react-router-dom";
export function Header() {
  return (
    <header className="border-b border-charcoal bg-white">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">ANDREA FARAO</Link>
        <Link to="/gallery">Fotografie</Link>
        <Link to="/projects">Progetti</Link>
      </nav>
    </header>
  );
}
