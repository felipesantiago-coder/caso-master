"use client";

import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";

const links = [
  { href: "#esquemas", rotulo: "Esquemas" },
  { href: "#linha-do-tempo", rotulo: "Linha do tempo" },
  { href: "#pessoas", rotulo: "Pessoas" },
  { href: "#ranking", rotulo: "Ranking" },
  { href: "#busca", rotulo: "Busca" },
  { href: "#metodologia", rotulo: "Metodologia" },
];

export default function SiteHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [progresso, setProgresso] = useState(0);
  const [ativo, setAtivo] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [encolhido, setEncolhido] = useState(false);

  useEffect(() => {
    let raf = 0;
    const aoRolar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgresso(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
        setEncolhido(doc.scrollTop > 40);
      });
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const secoes = links
      .map((l) => document.querySelector(l.href))
      .filter((s): s is HTMLElement => Boolean(s));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setAtivo(`#${e.target.id}`);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    secoes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        encolhido ? "border-b border-border bg-background/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      {/* barra de progresso da leitura */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-transparent" aria-hidden>
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progresso * 100}%` }} />
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#inicio" className="group flex items-center gap-2.5" aria-label="Caso Master, voltar ao início">
          <span className="grid size-8 place-items-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground transition-transform group-hover:scale-105">
            M
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">Caso Master</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              dossiê público
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-active={ativo === l.href}
              className="nav-link text-[13px] font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {l.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/70 px-3.5 text-[13px] text-foreground/80 transition-colors hover:border-primary/50 hover:text-foreground"
            aria-label="Abrir busca"
          >
            <Search className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Buscar nome</span>
            <kbd className="hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
              /
            </kbd>
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-border bg-secondary/70 lg:hidden"
            onClick={() => setMenuAberto((v) => !v)}
            aria-expanded={menuAberto}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          >
            {menuAberto ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav
          className="border-t border-border bg-background lg:hidden"
          aria-label="Navegação móvel"
        >
          <ul className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenuAberto(false)}
                  className="block border-b border-border/60 py-3 text-sm font-medium text-foreground/85 last:border-0"
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
