"use client";

import { contagens, meta } from "@/lib/master";
import { useReveal } from "./atoms";

const faixa = [
  "R$ 12,2 bi em carteiras sem lastro",
  "R$ 52 bi de prejuízo estimado ao FGC",
  "12 milhões de clientes afetados",
  "8 instituições liquidadas",
  "Operação Compliance Zero",
  "Mensagens, jatos e offshores",
];

export default function Hero() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="inicio" ref={ref} className="glow-gold relative overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal">
          <p className="kicker">Dossiê público, atualizado em {meta.atualizacao}</p>
        </div>

        <h1 className="display reveal mt-5 max-w-4xl">
          Caso Master.
          <br />
          <span className="text-muted-foreground">Tudo o que se sabe.</span>
        </h1>

        <p className="reveal mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {meta.subtitulo}. A linha do tempo completa das apurações, cada esquema explicado passo a passo, as pessoas
          mais mencionadas, a busca por qualquer nome e todas as fontes, com o grau de comprovação de cada fato.
        </p>

        <div className="reveal mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#esquemas"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Entender os esquemas
          </a>
          <a
            href="#linha-do-tempo"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground/85 transition-colors hover:border-primary/50"
          >
            Ler a linha do tempo
          </a>
          <a
            href="#metodologia"
            className="inline-flex h-11 items-center rounded-full px-3 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Como este dossiê foi feito
          </a>
        </div>

        <dl className="reveal mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {[
            { rotulo: "Fatos documentados", valor: String(contagens.fatos) },
            { rotulo: "Pessoas fichadas", valor: String(contagens.pessoas) },
            { rotulo: "Esquemas explicados", valor: String(contagens.esquemas) },
            { rotulo: "Fontes distintas", valor: String(contagens.fontes) },
            { rotulo: "Clientes afetados", valor: "12 mi" },
            { rotulo: "Prejuízo estimado", valor: "R$ 52 bi" },
          ].map((s) => (
            <div key={s.rotulo} className="bg-card px-4 py-5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.rotulo}</dt>
              <dd className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[1.7rem]">{s.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="marquee-fade mt-14 overflow-hidden border-y border-border py-3" aria-hidden>
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...faixa, ...faixa].map((t, i) => (
            <span key={i} className="flex items-center gap-10 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {t}
              <span className="text-primary">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
