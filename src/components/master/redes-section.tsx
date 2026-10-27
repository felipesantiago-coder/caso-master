"use client";

// Seção "Redes de conexão" do dossiê: rede 3D interativa embutida,
// seletor de esquemas e botão para abrir o infográfico em nova aba,
// em tela cheia, com mais espaço e mais detalhes.

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Expand, Eye, EyeOff, MousePointerClick } from "lucide-react";
import { listaRedes, redeOuPadrao } from "@/lib/network";
import { pessoaPorId } from "@/lib/master";
import { Kicker, useReveal, Avatar } from "./atoms";

const RedeCanvas = dynamic(() => import("./rede/rede-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary/80">Preparando a rede 3D...</p>
    </div>
  ),
});

export default function RedesSection({ onPessoa }: { onPessoa: (id: string) => void }) {
  const ref = useReveal<HTMLElement>();
  const redes = useMemo(() => listaRedes(), []);
  const [ativo, setAtivo] = useState("geral");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [mostrarNomes, setMostrarNomes] = useState(false);

  const rede = useMemo(() => redeOuPadrao(ativo), [ativo]);
  const noSel = selecionado ? rede.nos.find((n) => n.id === selecionado) ?? null : null;
  const pessoaSel = noSel && noSel.tipo === "pessoa" ? pessoaPorId.get(noSel.refId) : undefined;

  const trocar = (id: string) => {
    const r = redeOuPadrao(id);
    setAtivo(id);
    setSelecionado(null);
    // redes grandes abrem sem nomes para não poluir; esquemas pequenos, com nomes
    setMostrarNomes(r.nos.length <= 30);
  };

  return (
    <section id="redes" ref={ref} className="glow-soft scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-3xl">
          <Kicker>Redes de conexão</Kicker>
          <h2 className="display-sm mt-4">A rede do caso, girando em 3D</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Cada nó é uma pessoa e cada nó dourado é um esquema. Arraste para girar a rede, aproxime com a roda ou
            pinça e toque em qualquer nó para ver com quem a pessoa se conecta e em quais fatos. Prefere a vista
            completa? Abra o infográfico em nova aba, em tela cheia.
          </p>
        </div>

        {/* seletor de rede */}
        <div
          className="reveal mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Escolher a rede para visualizar"
        >
          {redes.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={ativo === r.id}
              onClick={() => trocar(r.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                ativo === r.id
                  ? "border-primary/60 bg-primary/12 text-primary shadow-[0_0_18px_rgba(227,179,65,0.18)]"
                  : "border-border bg-secondary text-foreground/75 hover:border-primary/35 hover:text-foreground"
              }`}
            >
              {r.nome}
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">{r.totalNos}</span>
            </button>
          ))}
        </div>

        {/* palco da rede */}
        <div className="reveal relative mt-4 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-b from-card to-background shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="rede-glow absolute inset-0" aria-hidden />
          <div className="relative h-[480px] sm:h-[560px] lg:h-[620px]">
            <RedeCanvas
              rede={rede}
              noSelecionado={selecionado}
              aoSelecionar={setSelecionado}
              mostrarNomes={mostrarNomes}
            />

            {/* controles flutuantes */}
            <div className="absolute left-3 top-3 z-20 flex gap-2 sm:left-4 sm:top-4">
              <button
                type="button"
                onClick={() => setMostrarNomes((v) => !v)}
                aria-pressed={mostrarNomes}
                title={mostrarNomes ? "Ocultar os nomes dos nós" : "Mostrar os nomes dos nós"}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background/85 px-3.5 text-[13px] font-medium text-foreground/80 backdrop-blur-xl transition-colors hover:border-primary/50 hover:text-primary"
              >
                {mostrarNomes ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                <span className="hidden sm:inline">{mostrarNomes ? "Nomes" : "Nomes ocultos"}</span>
              </button>
              <a
                href={`/rede/${rede.id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/55 bg-primary/12 px-3.5 text-[13px] font-bold text-primary backdrop-blur-xl transition-transform hover:scale-[1.04]"
              >
                <Expand className="size-4" aria-hidden />
                <span className="hidden sm:inline">Abrir em tela cheia, em nova aba</span>
                <span className="sm:hidden">Tela cheia</span>
              </a>
            </div>

            {/* dica de interação */}
            <p className="pointer-events-none absolute bottom-3 right-3 z-10 hidden rounded-full border border-border bg-background/85 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-xl sm:block">
              <MousePointerClick className="mr-1.5 inline size-3" aria-hidden />
              Arraste para girar · Role para aproximar · Toque em um nó
            </p>

            {/* cartão do nó selecionado */}
            {noSel && (
              <div className="absolute bottom-3 left-3 z-20 w-[calc(100%-1.5rem)] max-w-sm rounded-2xl border border-primary/30 bg-background/92 p-4 shadow-2xl backdrop-blur-2xl sm:bottom-4 sm:left-4">
                <div className="flex items-start gap-3">
                  {pessoaSel ? (
                    <Avatar
                      pessoa={pessoaSel}
                      className="size-12 shrink-0 rounded-xl border border-border object-cover"
                      inicialClassName="text-base"
                    />
                  ) : (
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-xl border-2 text-primary"
                      style={{ borderColor: noSel.cor, backgroundColor: `${noSel.cor}1f` }}
                      aria-hidden
                    >
                      <Expand className="size-5" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold leading-tight">{noSel.rotulo}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{noSel.subtitulo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelecionado(null)}
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                    aria-label="Fechar cartão do nó"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  {pessoaSel && (
                    <button
                      type="button"
                      onClick={() => onPessoa(pessoaSel.id)}
                      className="h-9 flex-1 rounded-full bg-primary text-[13px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
                    >
                      Ver ficha completa
                    </button>
                  )}
                  <a
                    href={`/rede/${rede.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 flex-1 rounded-full border border-border bg-secondary text-center text-[13px] font-semibold leading-9 text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    Explorar na rede completa
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="reveal mt-4 text-sm leading-relaxed text-muted-foreground">
          Legenda: nó dourado de contorno duplo = esquema; nós coloridos = pessoas, coloridas pelo grupo de atuação
          (núcleo Master, família, operadores, BRB e governo do DF, Banco Central e governo federal, STF e Justiça,
          política, mídia). Ponto vermelho no nó = pessoa presa. Linhas ligam pessoas aos esquemas e, entre si, aos
          fatos apurados em que aparecem juntas. Todos os dados vêm do dossiê, com grau de comprovação e fontes.
        </p>
      </div>
    </section>
  );
}
