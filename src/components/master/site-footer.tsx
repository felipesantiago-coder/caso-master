"use client";

import { contagens, meta } from "@/lib/master";
import { FontesList, Kicker, useReveal } from "./atoms";

export default function SiteFooter() {
  const ref = useReveal<HTMLElement>();
  return (
    <footer id="metodologia" ref={ref} className="mt-auto scroll-mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Padrão editorial · Metodologia</Kicker>
          <h2 className="display-sm mt-4">Sob que regras este arquivo foi montado</h2>
        </div>

        <div className="reveal mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {meta.metodologia.map((m, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">{m}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
              <p className="text-sm leading-relaxed text-foreground/85">{meta.recorte}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{meta.disclaimer}</p>
            </div>
          </div>

          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {[
                { r: "Fatos", v: String(contagens.fatos) },
                { r: "Pessoas", v: String(contagens.pessoas) },
                { r: "Esquemas", v: String(contagens.esquemas) },
                { r: "Fontes", v: String(contagens.fontes) },
              ].map((s) => (
                <div key={s.r} className="bg-card px-4 py-5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.r}</dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight">{s.v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Números-chave do caso
              </p>
              <ul className="mt-3 space-y-3">
                {meta.numerosChave.map((n) => (
                  <li key={n.rotulo} className="text-sm">
                    <span className="font-bold text-primary">{n.valor}</span>
                    <span className="text-foreground/85"> {n.rotulo.toLowerCase()}</span>
                    <span className="block text-xs text-muted-foreground">{n.nota}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="reveal mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold text-foreground">Caso Master</span> · dossiê público compilado em{" "}
            {meta.atualizacao} · todas as informações provêm de documentos oficiais e matérias jornalísticas públicas.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
            Presunção de inocência · Fontes verificáveis · Transparência total
          </p>
        </div>
      </div>
    </footer>
  );
}
