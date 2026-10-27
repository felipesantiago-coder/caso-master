"use client";

import { useState } from "react";
import { ArrowRight, Compass, Share2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { meta } from "@/lib/master";
import { esquemas, esquemaPorId, nomePessoa, type Esquema } from "@/lib/master";
import {
  FontesList,
  GrauBadge,
  Kicker,
  Carimbo,
  CarimboDoc,
  EtiquetaArquivo,
  EtiquetaParte,
  MarcaAgua,
  SeloCircular,
  useReveal,
} from "./atoms";

const rotuloStatus: Record<string, string> = {
  preso: "DETIDO",
  investigado: "SOB INVESTIGAÇÃO",
  colaborador: "COLABORADOR",
  institucional: "CARGO INSTITUCIONAL",
  falecido: "FALECIDO",
};

/* Tintas de status sobre papel claro */
const corStatusPapel: Record<string, string> = {
  preso: "#a03434",
  investigado: "#8a5410",
  colaborador: "#1c6b48",
  institucional: "#5d5138",
  falecido: "#5d5138",
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="campo-rotulo">{rotulo}</dt>
      <dd className="campo-valor mt-0.5 text-[0.92rem] leading-snug font-bold">{children}</dd>
    </div>
  );
}

export function FlowEsquema({
  esquema,
  onPessoa,
  registro,
}: {
  esquema: Esquema;
  onPessoa: (id: string) => void;
  registro: string;
}) {
  return (
    <div className="space-y-7">
      <p className="maquina text-[0.95rem] leading-relaxed text-[#241b0d]">{esquema.resumo}</p>

        <div className="mt-7">
          <h4 className="campo-rotulo flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-[3px] border border-[rgba(70,50,20,0.45)] text-[9px]">
              {String(esquema.passos.length).padStart(2, "0")}
            </span>
            Como funcionava, passo a passo
          </h4>
          <ol className="relative mt-4 space-y-5 pl-0">
            {esquema.passos.map((p, i) => (
              <li key={p.n} className="relative flex gap-4">
                {i < esquema.passos.length - 1 && (
                  <span
                    className="absolute left-[1.05rem] top-10 h-[calc(100%+1.25rem)] w-px bg-[repeating-linear-gradient(to_bottom,rgba(70,50,20,0.5)_0_4px,transparent_4px_8px)]"
                    aria-hidden
                  />
                )}
                <span className="relative z-10 maquina grid size-[2.1rem] shrink-0 place-items-center rounded-[3px] border-2 border-[#241b0d] bg-transparent text-sm font-bold text-[#241b0d]">
                  {p.n}
                </span>
                <div className="min-w-0 flex-1 rounded-[4px] border border-[rgba(70,50,20,0.3)] bg-[rgb(255,252,242,0.5)] px-3.5 py-2.5">
                  <h5 className="maquina text-[0.9rem] font-bold text-[#241b0d]">{p.titulo}</h5>
                  <p className="maquina mt-1 text-[0.82rem] leading-relaxed text-[#4c4229]">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {esquema.valores.length > 0 && (
          <div className="mt-7">
            <h4 className="campo-rotulo">Os números da operação</h4>
            <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-[rgba(70,50,20,0.35)] bg-[rgba(70,50,20,0.35)] sm:grid-cols-2">
              {esquema.valores.map((v) => (
                <div key={v.rotulo} className="bg-[rgb(255,252,242,0.72)] px-4 py-3">
                  <dt className="campo-rotulo">{v.rotulo}</dt>
                  <dd className="maquina mt-1 text-xl font-bold text-[#8a5410]">{v.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-7 rounded-[4px] border border-[rgba(70,50,20,0.3)] bg-[rgb(255,252,242,0.5)] p-4">
          <h4 className="campo-rotulo">Como foi descoberto</h4>
          <p className="maquina mt-2 text-[0.85rem] leading-relaxed text-[#4c4229]">{esquema.descoberta}</p>
          <p className="maquina mt-2.5 text-[0.85rem] leading-relaxed text-[#4c4229]">
            <span className="font-bold text-[#241b0d]">Status da apuração: </span>
            {esquema.statusApuracao}
          </p>
        </div>

        {esquema.pessoas.length > 0 && (
          <div className="mt-7">
            <h4 className="campo-rotulo">Indivíduos ligados a esta operação</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {esquema.pessoas.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPessoa(id)}
                  className="maquina rounded-[3px] border border-[rgba(70,50,20,0.45)] bg-[rgb(60,42,16,0.06)] px-2.5 py-1.5 text-[0.72rem] font-bold tracking-[0.08em] text-[#241b0d] uppercase transition-colors hover:bg-[rgb(60,42,16,0.13)]"
                >
                  {nomePessoa(id)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7">
          <FontesList fontes={esquema.fontes} papel />
        </div>

        {/* rodapé de formulário */}
        <div className="form-rodape mt-7 flex items-end justify-between gap-4 pt-3">
          <div className="min-w-0 flex-1">
            <div className="codigo-barras w-36 opacity-75" aria-hidden />
            <p className="maquina mt-1 text-[9px] tracking-[0.32em] text-[#5d5138] uppercase">7912-EXP-{registro}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="maquina text-[9.5px] leading-relaxed text-[#5d5138] uppercase">
              Expediente compilado em {meta.atualizacao}
            </p>
            <p className="maquina text-[9.5px] leading-relaxed text-[#5d5138] uppercase">
              Sem valor de acusação · Presunção de inocência
            </p>
          </div>
          <SeloCircular
            texto="DOSSIÊ PÚBLICO · FONTE VERIFICÁVEL ·"
            centro="PÚBLICO"
            className="size-[4.5rem] shrink-0 text-[#8a6a1c]"
          />
        </div>
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
          <EtiquetaParte n="01" folhas={`${esquemas.length} expedientes`} />
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

          <DialogContent
            showCloseButton={false}
            className="max-h-[92vh] gap-0 overflow-y-auto rounded-md border-0 bg-transparent p-0 shadow-none sm:max-w-3xl"
          >
            {esquemaAberto && (
              <div className="folha relative overflow-hidden rounded-md">
                <MarcaAgua texto="OPERAÇÃO · MATERIAL PÚBLICO" />
                {/* furos de arquivo */}
                <div
                  className="absolute top-0 left-3.5 hidden h-full flex-col items-center justify-center gap-28 sm:flex"
                  aria-hidden
                >
                  <span className="furo" />
                  <span className="furo" />
                  <span className="furo" />
                </div>
                {/* botão de fechar, em tinta sobre o papel */}
                <button
                  type="button"
                  onClick={() => setAbertoId(null)}
                  aria-label="Fechar expediente"
                  className="absolute top-3 right-3 z-20 grid size-8 place-items-center rounded-sm border border-[rgba(70,50,20,0.4)] text-[#241b0d] transition-colors hover:bg-[rgb(60,42,16,0.1)]"
                >
                  <X className="size-4" aria-hidden />
                </button>
                <div className="relative z-10 px-5 py-6 sm:px-10 sm:py-8 sm:pl-14">
                  <DialogHeader>
                    <div className="form-topo flex items-start justify-between gap-4 pb-3.5">
                      <div className="min-w-0">
                        <p className="campo-rotulo !text-[0.6rem]">
                          Expediente de operação · EXP-{String(esquemas.findIndex((x) => x.id === esquemaAberto.id) + 1).padStart(2, "0")} · {esquemaAberto.periodo}
                        </p>
                        <DialogTitle className="manchete mt-1.5 text-left text-3xl leading-[1.02] font-bold text-[#241b0d] sm:text-4xl">
                          {esquemaAberto.nome}
                        </DialogTitle>
                        <p className="maquina mt-1 text-[0.82rem] text-[#5d5138]">{esquemaAberto.subtitulo}</p>
                      </div>
                      <CarimboDoc grau={esquemaAberto.grau} className="mt-1 shrink-0 !text-[0.78rem] sm:!text-[0.9rem]" />
                    </div>
                  </DialogHeader>
                  <div className="mt-5">
                    <FlowEsquema
                      esquema={esquemaAberto}
                      onPessoa={onPessoa}
                      registro={String(esquemas.findIndex((x) => x.id === esquemaAberto.id) + 1).padStart(2, "0")}
                    />
                  </div>
                </div>
              </div>
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
