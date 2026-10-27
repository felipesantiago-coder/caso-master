"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { escalaPorId, labelTipo, type Fonte, type GrauId, type Pessoa } from "@/lib/master";

export const corGrau: Record<GrauId, string> = {
  oficial: "text-grau-oficial",
  multifonte: "text-grau-multifonte",
  fonteunica: "text-grau-fonteunica",
  alegacao: "text-grau-alegacao",
};

export const bgGrau: Record<GrauId, string> = {
  oficial: "bg-grau-oficial",
  multifonte: "bg-grau-multifonte",
  fonteunica: "bg-grau-fonteunica",
  alegacao: "bg-grau-alegacao",
};

// Cores do carimbo de comprovação, estilo papel carimbado no arquivo
export const carimboCor: Record<GrauId, string> = {
  oficial: "border-emerald-400/80 text-emerald-300",
  multifonte: "border-teal-300/80 text-teal-200",
  fonteunica: "border-amber-400/80 text-amber-300",
  alegacao: "border-rose-400/80 text-rose-300",
};

/** Carimbo rotacionado do grau de comprovação, sobreposto ao documento */
export function Carimbo({ grau, className = "" }: { grau: GrauId; className?: string }) {
  const esc = escalaPorId.get(grau);
  if (!esc) return null;
  return (
    <span
      className={`carimbo pointer-events-none z-10 rounded-[4px] border-2 bg-card/95 px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${carimboCor[grau]} ${className}`}
      title={esc.descricao}
    >
      {esc.rotulo}
    </span>
  );
}

/** Etiqueta de registro no canto superior esquerdo do documento (REG-000, FICHA-001, EXP-01...) */
export function EtiquetaArquivo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute -top-2.5 left-4 z-10 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground ${className}`}
    >
      {children}
    </span>
  );
}

export const corStatus: Record<string, string> = {
  preso: "text-grau-alegacao border-grau-alegacao/40 bg-grau-alegacao/10",
  investigado: "text-grau-fonteunica border-grau-fonteunica/40 bg-grau-fonteunica/10",
  colaborador: "text-grau-oficial border-grau-oficial/40 bg-grau-oficial/10",
  institucional: "text-foreground/70 border-border bg-secondary",
  falecido: "text-muted-foreground border-border bg-secondary",
};

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function GrauBadge({ grau, className = "" }: { grau: GrauId; className?: string }) {
  const esc = escalaPorId.get(grau);
  if (!esc) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${corGrau[grau]} ${className}`}
      title={esc.descricao}
    >
      <span className={`size-1.5 rounded-full ${bgGrau[grau]}`} aria-hidden />
      {esc.rotulo}
    </span>
  );
}

export function TipoBadges({ tipos, max = 3 }: { tipos: string[]; max?: number }) {
  const visiveis = tipos.slice(0, max);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {visiveis.map((t) => (
        <span
          key={t}
          className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/80"
        >
          {labelTipo(t)}
        </span>
      ))}
      {tipos.length > max && (
        <span className="font-mono text-[10px] text-foreground/80">+{tipos.length - max}</span>
      )}
    </span>
  );
}

export function Avatar({
  pessoa,
  className = "",
  inicialClassName = "",
}: {
  pessoa: Pick<Pessoa, "id" | "nome" | "foto">;
  className?: string;
  inicialClassName?: string;
}) {
  const [erro, setErro] = useState(false);
  const iniciais = pessoa.nome
    .split(" ")
    .filter((s) => s.length > 2)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  if (!pessoa.foto || erro) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-secondary to-accent font-mono text-foreground/70 ${className} ${inicialClassName}`}
        aria-hidden
      >
        {iniciais}
      </div>
    );
  }
  return (
    <img
      src={pessoa.foto}
      alt={`Foto de ${pessoa.nome}`}
      loading="lazy"
      decoding="async"
      onError={() => setErro(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function FontesList({ fontes, compacto = false }: { fontes: Fonte[]; compacto?: boolean }) {
  if (!fontes.length) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Fontes ({fontes.length})
      </p>
      <ul className={`space-y-1.5 ${compacto ? "text-xs" : "text-sm"}`}>
        {fontes.map((f, i) => (
          <li key={`${f.url}-${i}`}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-wrap items-baseline gap-x-2 text-foreground/85 transition-colors hover:text-primary"
            >
              <span className="font-mono text-[10px] text-muted-foreground">{f.veiculo}</span>
              <span className="underline decoration-border underline-offset-4 group-hover:decoration-primary">
                {f.titulo}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{f.data}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Revela elementos ao entrarem na viewport */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const alvos = el.querySelectorAll<HTMLElement>(".reveal:not(.is-in), .reveal-item:not(.is-in)");
    if (!alvos.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      // threshold 0: dispara ao entrar 1px na viewport, essencial para contêineres altos (linha do tempo)
      { rootMargin: "0px 0px -6% 0px", threshold: 0 }
    );
    alvos.forEach((a) => {
      // já ficou acima da viewport (salto instantâneo, âncora): revela sem esperar
      if (a.getBoundingClientRect().bottom < 0) {
        a.classList.add("is-in");
        return;
      }
      io.observe(a);
    });
    return () => io.disconnect();
  });
  return ref;
}
