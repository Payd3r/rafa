export function Footer() {
  return (
    <footer className="border-t border-charcoal mt-16 p-6 text-sm">
      <span>© {new Date().getFullYear()} Andrea Farao</span> ·{" "}
      <a href="mailto:insidefaraostudio@gmail.com">Email</a> ·{" "}
      <a
        href="https://wa.me/393492152369"
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
    </footer>
  );
}
