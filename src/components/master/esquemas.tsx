"use client";

import { useState } from "react";
import { ArrowRight, Compass, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { esquemas, esquemaPorId, nomePessoa, type Esquema } from "@/lib/master";
import { FontesList, GrauBadge, Kicker, Carimbo, EtiquetaArquivo, useReveal } from "./atoms";

export function FlowEsquema({ esquema, onPessoa }: { esquema: Esquema; onPessoa: (id: string) => void }) {
  return (
    <div className="space-y-10">
      <p className="leading-relaxed text-foreground/85">{esquema.resumo}</p>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Como funcionava, passo a passo</p>
        <ol className="relative mt-5 space-y-6 pl-0">
          {esquema.passos.map((p, i) => (
            <li key={p.n} className="relative flex gap-4">
              {i < esquema.passos.length - 1 && (
                <span
                  className="absolute left-[1.15rem] top-10 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-primary/50 to-border"
                  aria-hidden
                />
              )}
              <span className="relative z-10 grid size-[2.3rem] shrink-0 place-items-center rounded-full border border-primary/45 bg-background font-mono text-sm font-bold text-primary">
                {p.n}
              </span>
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-sm font-bold tracking-tight sm:text-[0.95rem]">{p.titulo}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {esquema.valores.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Os números</p>
          <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {esquema.valores.map((v) => (
              <div key={v.rotulo} className="bg-card px-4 py-3.5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{v.rotulo}</dt>
                <dd className="mt-1 text-lg font-bold tracking-tight text-primary">{v.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Como foi descoberto</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{esquema.descoberta}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/85">Status da apuração: </span>
          {esquema.statusApuracao}
        </p>
      </div>

      {esquema.pessoas.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Pessoas ligadas a este esquema</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {esquema.pessoas.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onPessoa(id)}
                className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
              >
                {nomePessoa(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      <FontesList fontes={esquema.fontes} />
    </div>
  );
}

export default function Esquemas({
  onPessoa,
  focoEsquemaId,
  aoLimparFoco,
}: {
  onPessoa: (id: string) => void;
  focoEsquemaId: string | null;
  aoLimparFoco: () => void;
}) {
  const ref = useReveal<HTMLElement>();
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [focoAnterior, setFocoAnterior] = useState<string | null>(null);
  const destaque = esquemas.find((e) => e.id === "tirreno") ?? esquemas[0];
  const esquemaAberto = abertoId ? esquemaPorId.get(abertoId) : undefined;

  // abre o esquema focado (vindo da busca): ajuste de estado durante a renderização
  if (focoEsquemaId && focoEsquemaId !== focoAnterior) {
    setFocoAnterior(focoEsquemaId);
    setAbertoId(focoEsquemaId);
    aoLimparFoco();
  }

  return (
    <section id="esquemas" ref={ref} className="glow-soft scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Arquivo de operações · Peça por peça</Kicker>
          <h2 className="display-sm mt-4">Anatomia da fraude: onze engrenagens, uma máquina</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Cada esquema ligado a Vorcaro, do modelo de captação à milícia privada, explicado em passos numerados, com
            os números de cada engrenagem, como foi descoberto e quem participou. Clique em qualquer expediente para
            abrir o passo a passo completo.
          </p>
        </div>

        <Dialog open={Boolean(esquemaAberto)} onOpenChange={(v) => !v && setAbertoId(null)}>
          <div className="reveal relative mt-10 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-background">
            <span
              className="carimbo pointer-events-none absolute right-5 top-4 z-10 rounded-[4px] border-2 border-primary/70 bg-background/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary"
              aria-hidden
            >
              Peça-chave
            </span>
            <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
              <div className="p-6 pt-8 sm:p-9 sm:pt-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">O esquema central</span>
                <h3 className="display-sm mt-3">{destaque.nome}</h3>
                <p className="mt-3 text-muted-foreground">{destaque.subtitulo}</p>
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{destaque.resumo}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAbertoId(destaque.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03]"
                  >
                    <Compass className="size-4" aria-hidden />
                    Abrir infográfico do esquema
                  </button>
                  <a
                    href={`/rede/${destaque.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-5 text-sm font-bold text-primary transition-transform hover:scale-[1.03]"
                  >
                    <Share2 className="size-4" aria-hidden />
                    Rede 3D em tela cheia
                  </a>
                  <GrauBadge grau={destaque.grau} />
                </div>
              </div>
              <div className="relative hidden border-l border-border lg:block">
                <ol className="flex h-full flex-col justify-center gap-3 p-9">
                  {destaque.passos.slice(0, 5).map((p) => (
                    <li key={p.n} className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/45 font-mono text-xs font-bold text-primary">
                        {p.n}
                      </span>
                      <span className="text-[13px] font-medium text-foreground/80">{p.titulo}</span>
                    </li>
                  ))}
                  {destaque.valores[0] && (
                    <li className="mt-2 rounded-xl border border-border bg-card px-4 py-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        {destaque.valores[0].rotulo}
                      </span>
                      <p className="text-lg font-bold text-primary">{destaque.valores[0].valor}</p>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>

          <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
            {esquemaAberto && (
              <>
                <DialogHeader>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                      {`EXP-${String(esquemas.findIndex((x) => x.id === esquemaAberto.id) + 1).padStart(2, "0")}`}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {esquemaAberto.periodo}
                    </span>
                  </div>
                  <DialogTitle className="text-left text-2xl tracking-tight">{esquemaAberto.nome}</DialogTitle>
                  <p className="text-left text-sm text-muted-foreground">{esquemaAberto.subtitulo}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Carimbo grau={esquemaAberto.grau} className="static" />
                  </div>
                </DialogHeader>
                <FlowEsquema esquema={esquemaAberto} onPessoa={onPessoa} />
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {esquemas.map((e, i) => (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => setAbertoId(e.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  setAbertoId(e.id);
                }
              }}
              className="card-hover reveal group relative flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-6 pt-7 text-left"
              style={{ transitionDelay: `${(i % 3) * 70}ms` }}
            >
              <Carimbo grau={e.grau} className="absolute -top-2.5 right-4" />
              <EtiquetaArquivo>{`EXP-${String(i + 1).padStart(2, "0")}`}</EtiquetaArquivo>
              <h3 className="mt-3 text-xl font-bold tracking-tight group-hover:text-primary sm:text-[1.35rem]">
                {e.nome}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{e.subtitulo}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {e.periodo}
                </span>
              </div>
              <span className="mt-auto inline-flex items-center justify-between gap-1.5 pt-6">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Abrir expediente
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
                <a
                  href={`/rede/${e.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(ev) => ev.stopPropagation()}
                  title="Abrir a rede 3D de conexões deste esquema em nova aba, em tela cheia"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-[13px] font-semibold text-foreground/75 transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Share2 className="size-3.5" aria-hidden />
                  Rede 3D
                </a>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
