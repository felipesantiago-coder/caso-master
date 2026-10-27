"use client";

import { contagens, grupos, rankingPessoas } from "@/lib/master";
import { Avatar, Kicker, Carimbo, EtiquetaArquivo, corStatus, useReveal } from "./atoms";
import { MousePointerClick } from "lucide-react";

export default function Pessoas({ onPessoa }: { onPessoa: (id: string) => void }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="pessoas" ref={ref} className="glow-soft scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Dossiê de personagens · Quem é quem</Kicker>
          <h2 className="display-sm mt-4">Quem é quem no caso: {contagens.pessoas} fichas abertas</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Banqueiro, servidores, ministros, senadores, governadores, operadores, jornalistas e familiares: cada pessoa
            mencionada nas apurações tem uma ficha com papel, situação, grau de comprovação e fontes. Todas são
            investigadas ou testemunhas: ninguém foi condenado até esta data.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rankingPessoas.map(({ pessoa, mencoes }, i) => (
            <button
              key={pessoa.id}
              type="button"
              onClick={() => onPessoa(pessoa.id)}
              className="card-hover reveal relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 pt-7 text-left"
              style={{ transitionDelay: `${(i % 3) * 60}ms` }}
            >
              <Carimbo grau={pessoa.grau} className="absolute -top-2.5 right-4" />
              <EtiquetaArquivo>{`FICHA-${String(i + 1).padStart(3, "0")}`}</EtiquetaArquivo>
              <Avatar
                pessoa={pessoa}
                className="size-16 shrink-0 rounded-xl border border-border"
                inicialClassName="text-base"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] font-bold tracking-tight">{pessoa.nome}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                  {pessoa.papel}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${corStatus[pessoa.statusTipo]}`}>
                    {pessoa.status.split(";")[0].split(" desde")[0]}
                  </span>
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {mencoes} {mencoes === 1 ? "menção" : "menções"}
                  </span>
                </span>
                <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {grupos[pessoa.grupo] ?? pessoa.grupo}
                </span>
                <span className="mt-2.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-primary/90">
                  <MousePointerClick className="size-3" aria-hidden />
                  Abrir ficha completa
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
