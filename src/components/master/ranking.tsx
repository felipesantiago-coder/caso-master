"use client";

import { useEffect, useRef, useState } from "react";
import { rankingPessoas } from "@/lib/master";
import { Avatar, Kicker, useReveal } from "./atoms";

const TOP = 20;

export default function Ranking({ onPessoa }: { onPessoa: (id: string) => void }) {
  const ref = useReveal<HTMLElement>();
  const barraRef = useRef<HTMLDivElement | null>(null);
  const [animar, setAnimar] = useState(false);
  const top = rankingPessoas.slice(0, TOP);
  const max = top[0]?.mencoes || 1;

  useEffect(() => {
    const el = barraRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setAnimar(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="ranking" ref={ref} className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Ranking de menções</Kicker>
          <h2 className="display-sm mt-4">Quem mais aparece nas apurações</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Contagem objetiva de quantas vezes cada pessoa aparece nos fatos documentados deste dossiê e nos esquemas
            explicados. Menções são indicativos de envolvimento na narrativa das apurações, não de culpa: leia cada
            ficha com o respectivo grau de comprovação.
          </p>
        </div>

        <div ref={barraRef} className="reveal mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <ol>
            {top.map(({ pessoa, mencoes }, i) => (
              <li key={pessoa.id} className={i < top.length - 1 ? "border-b border-border" : ""}>
                <button
                  type="button"
                  onClick={() => onPessoa(pessoa.id)}
                  className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/60 sm:gap-4 sm:px-6"
                >
                  <span className="w-7 shrink-0 font-mono text-sm font-bold text-muted-foreground sm:w-8 sm:text-base">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Avatar
                    pessoa={pessoa}
                    className="size-10 shrink-0 rounded-lg border border-border sm:size-11"
                    inicialClassName="text-xs"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="truncate text-sm font-bold tracking-tight group-hover:text-primary sm:text-[0.95rem]">
                        {pessoa.nome}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {mencoes} {mencoes === 1 ? "menção" : "menções"}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="bar-fill block h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                        style={{ width: animar ? `${Math.max(4, (mencoes / max) * 100)}%` : "0%" }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
