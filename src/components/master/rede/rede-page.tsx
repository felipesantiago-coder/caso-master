"use client";

// Página do infográfico em tela cheia: rede 3D ocupando a viewport inteira,
// painel de detalhes do nó selecionado, legenda de grupos, modo tela cheia
// e fontes do esquema. Projetada para abrir em nova aba a partir do dossiê.

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Expand, Link2Off, List, Sparkles, X } from "lucide-react";
import { conexoesDe, fatosDeNo, redeOuPadrao, type Rede } from "@/lib/network";
import { grupos, pessoaPorId } from "@/lib/master";
import { Avatar, FontesList, GrauBadge, corStatus } from "../atoms";

const RedeCanvas = dynamic(() => import("./rede-canvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary/80">Preparando a rede 3D...</p>
    </div>
  ),
});

function abrirNovaAba(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function RedePage({ id }: { id: string }) {
  const rede = useMemo(() => redeOuPadrao(id), [id]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [idAnterior, setIdAnterior] = useState(id);
  // redes grandes abrem sem nomes; esquemas, com nomes
  const [mostrarNomes, setMostrarNomes] = useState(rede.nos.length <= 30);
  const [telaCheia, setTelaCheia] = useState(false);
  const [listaAberta, setListaAberta] = useState(false);

  // troca de rede: limpa a seleção durante a própria renderização
  if (id !== idAnterior) {
    setIdAnterior(id);
    setSelecionado(null);
    setMostrarNomes(rede.nos.length <= 30);
  }

  useEffect(() => {
    const aoMudar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelecionado(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("fullscreenchange", aoMudar);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  const alternarTelaCheia = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const noSel = selecionado ? rede.nos.find((n) => n.id === selecionado) ?? null : null;
  const conexoes = useMemo(() => (selecionado ? conexoesDe(rede, selecionado) : []), [rede, selecionado]);
  const fatos = useMemo(() => (selecionado ? fatosDeNo(rede, selecionado) : []), [rede, selecionado]);
  const isGeral = rede.id === "geral";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* barra superior */}
      <header className="z-30 flex shrink-0 items-center gap-3 border-b border-border bg-background/85 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-secondary text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
          aria-label="Voltar ao dossiê Caso Master"
          title="Voltar ao dossiê"
        >
          <X className="size-4.5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="kicker truncate !text-[10px]">
            {isGeral ? "Caso Master · visão geral" : `Caso Master · esquema · ${rede.periodo}`}
          </p>
          <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">{rede.titulo}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarNomes((v) => !v)}
            aria-pressed={mostrarNomes}
            className={`hidden h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors sm:inline-flex ${
              mostrarNomes
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-secondary text-foreground/75 hover:text-foreground"
            }`}
          >
            <List className="size-4" aria-hidden />
            {mostrarNomes ? "Ocultar nomes" : "Mostrar nomes"}
          </button>
          <button
            type="button"
            onClick={alternarTelaCheia}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3.5 text-sm font-semibold text-primary transition-transform hover:scale-[1.03] sm:px-5"
            title="Alternar tela cheia do navegador"
          >
            <Expand className="size-4" aria-hidden />
            <span className="hidden sm:inline">{telaCheia ? "Sair da tela cheia" : "Tela cheia"}</span>
          </button>
        </div>
      </header>

      {/* área da rede */}
      <div className="relative min-h-0 flex-1">
        <div className="rede-glow absolute inset-0" aria-hidden />
        <RedeCanvas
          rede={rede}
          noSelecionado={selecionado}
          aoSelecionar={setSelecionado}
          mostrarNomes={mostrarNomes}
        />

        {/* legenda de grupos */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-4">
          <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-border bg-background/85 px-3 py-2 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <span className="inline-block size-2.5 rounded-full border-2 border-primary" aria-hidden />
              Esquema
            </span>
            <span className="shrink-0 text-border" aria-hidden>
              |
            </span>
            {rede.gruposPresentes.map((g) => (
              <span
                key={g.id}
                className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80"
              >
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: g.cor, boxShadow: `0 0 6px ${g.cor}` }}
                  aria-hidden
                />
                {g.rotulo}
              </span>
            ))}
            <span className="shrink-0 text-border" aria-hidden>
              |
            </span>
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80">
              <span className="inline-block size-2.5 rounded-full bg-grau-alegacao" aria-hidden />
              Pessoa presa
            </span>
          </div>
        </div>

        {/* dica de controles: some após interação em telas pequenas */}
        <p className="pointer-events-none absolute left-1/2 top-3 z-10 max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate rounded-full border border-border bg-background/85 px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-xl sm:top-4 sm:text-[11px]">
          <span className="hidden sm:inline">Arraste para girar · Role ou pince para aproximar · Toque em um nó</span>
          <span className="sm:hidden">Arraste · Pince para aproximar · Toque em um nó</span>
        </p>

        {/* lista acessível de participantes */}
        {listaAberta && (
          <div className="absolute inset-x-3 top-12 z-30 mx-auto max-h-[70%] max-w-md overflow-y-auto rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Participantes ({rede.nos.length})
              </p>
              <button
                type="button"
                onClick={() => setListaAberta(false)}
                className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                aria-label="Fechar lista de participantes"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <ul className="space-y-1.5">
              {rede.nos.map((no) => (
                <li key={no.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelecionado(no.id);
                      setListaAberta(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: no.cor, boxShadow: `0 0 6px ${no.cor}` }}
                      aria-hidden
                    />
                    <span className="font-medium">{no.rotulo}</span>
                    <span className="ml-auto truncate pl-2 text-xs text-muted-foreground">
                      {no.tipo === "esquema" ? "esquema" : grupos[no.grupo ?? ""] ?? ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isGeral && !noSel && (
          <button
            type="button"
            onClick={() => setListaAberta((v) => !v)}
            className="absolute right-3 top-14 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background/85 px-4 text-sm text-foreground/80 backdrop-blur-xl transition-colors hover:border-primary/50 hover:text-primary sm:right-4 sm:top-16"
          >
            <List className="size-4" aria-hidden />
            Lista
          </button>
        )}

        {/* painel de detalhes do nó selecionado */}
        {noSel && (
          <PainelNo
            rede={rede}
            noId={noSel.id}
            conexoes={conexoes}
            fatos={fatos}
            aoFechar={() => setSelecionado(null)}
            aoEscolher={(nid) => setSelecionado(nid)}
          />
        )}
      </div>
    </div>
  );
}

function PainelNo({
  rede,
  noId,
  conexoes,
  fatos,
  aoFechar,
  aoEscolher,
}: {
  rede: Rede;
  noId: string;
  conexoes: ReturnType<typeof conexoesDe>;
  fatos: ReturnType<typeof fatosDeNo>;
  aoFechar: () => void;
  aoEscolher: (id: string) => void;
}) {
  const no = rede.nos.find((n) => n.id === noId);
  if (!no) return null;
  const pessoa = no.tipo === "pessoa" ? pessoaPorId.get(no.refId) : undefined;

  return (
    <aside className="absolute inset-x-0 bottom-0 z-30 flex max-h-[68dvh] flex-col rounded-t-3xl border-t border-primary/30 bg-background/95 shadow-[0_-18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:w-[400px] sm:rounded-3xl sm:border">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          {pessoa ? (
            <Avatar
              pessoa={{ id: pessoa.id, nome: pessoa.nome, foto: pessoa.foto }}
              className="size-14 shrink-0 rounded-2xl border border-border object-cover"
              inicialClassName="text-lg"
            />
          ) : (
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 font-mono text-xl font-bold text-primary"
              style={{ borderColor: no.cor, backgroundColor: `${no.cor}22` }}
              aria-hidden
            >
              <Sparkles className="size-6" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight tracking-tight sm:text-xl">{no.rotulo}</h2>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{no.subtitulo}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Fechar painel de detalhes"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {no.tipo === "pessoa" && no.grupo && (
            <span className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: `${no.cor}66`, color: no.cor, backgroundColor: `${no.cor}14` }}>
              {grupos[no.grupo] ?? no.grupo}
            </span>
          )}
          {pessoa && (
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${corStatus[pessoa.statusTipo]}`}>
              {pessoa.status}
            </span>
          )}
          {no.grau && <GrauBadge grau={no.grau} />}
        </div>

        <p className="text-[15px] leading-relaxed text-foreground/88">
          {no.tipo === "esquema" ? rede.resumo : pessoa?.resumo}
        </p>

        {no.tipo === "esquema" && rede.valores.length > 0 && (
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {rede.valores.map((v) => (
              <div key={v.rotulo} className="bg-card px-3.5 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{v.rotulo}</dt>
                <dd className="mt-1 text-base font-bold text-primary">{v.valor}</dd>
              </div>
            ))}
          </dl>
        )}

        {no.tipo === "esquema" && rede.statusApuracao && (
          <p className="rounded-xl border border-border bg-card p-3.5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground/85">Status da apuração: </span>
            {rede.statusApuracao}
          </p>
        )}

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Conexões diretas ({conexoes.length})
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {conexoes.map((c) => (
              <button
                key={c.no.id}
                type="button"
                onClick={() => aoEscolher(c.no.id)}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[13px] font-medium text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.no.cor, boxShadow: `0 0 5px ${c.no.cor}` }}
                  aria-hidden
                />
                <span className="truncate">{c.no.rotulo}</span>
                {c.fatosIds.length > 0 && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{c.fatosIds.length}f</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {fatos.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              {no.tipo === "esquema" ? "Fatos apurados deste esquema" : "Fatos que envolvem esta pessoa"} ({fatos.length})
            </p>
            <ul className="mt-2.5 max-h-64 space-y-2 overflow-y-auto pr-1">
              {fatos.map((f) => (
                <li key={f.id} className="rounded-xl border border-border bg-card px-3.5 py-2.5">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">{f.dataLabel}</span>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug">{f.titulo}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {no.tipo === "esquema" && rede.fontes.length > 0 && <FontesList fontes={rede.fontes} compacto />}
        {no.tipo === "pessoa" && pessoa && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => abrirNovaAba(`/?pessoa=${no.refId}#pessoas`)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Link2Off className="size-4 rotate-45" aria-hidden />
              Abrir ficha completa no dossiê
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A ficha no dossiê abre em nova aba, com resumo completo, situação processual e todas as fontes.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
