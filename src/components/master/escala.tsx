"use client";

import { meta } from "@/lib/master";
import { Kicker, bgGrau, corGrau, useReveal } from "./atoms";

export default function Escala() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="como-ler" ref={ref} className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Manual de leitura · Cadeia de comprovação</Kicker>
          <h2 className="display-sm mt-4">Antes de entrar: o peso de cada fato</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Nada aqui é apresentado como verdade absoluta. Todo item da linha do tempo, de cada esquema e de cada ficha
            de pessoa carrega um dos quatro rótulos abaixo, e as fontes originais acompanham o texto para que você
            confira direto na origem.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meta.escala.map((e, i) => (
            <article
              key={e.id}
              className="reveal card-hover rounded-2xl border border-border bg-card p-5"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] ${corGrau[e.id]}`}>
                <span className={`size-2 rounded-full ${bgGrau[e.id]}`} aria-hidden />
                {e.rotulo}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e.descricao}</p>
            </article>
          ))}
        </div>

        <div className="reveal mt-8 rounded-2xl border border-primary/25 bg-primary/[0.04] p-6 sm:p-8">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Aviso de presunção de inocência</h3>
          <p className="mt-3 max-w-3xl leading-relaxed text-foreground/85">{meta.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
