"use client";

// Secao da linha do tempo: arquivo lateral. Os fatos correm em uma trilha
// horizontal com eixo dourado, marcadores de ano e documentos que abrem no
// lugar. Navegacao: setas nas bordas da trilha, console com anterior/proxima,
// arrasto com o mouse, swipe no toque e teclado (setas, J e K).

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  MousePointerClick,
  MoveHorizontal,
  Star,
} from "lucide-react";
import {
  contagens,
  meta,
  nomePessoa,
  timeline,
  type Fato,
  type GrauId,
} from "@/lib/master";
import {
  bgGrau,
  Carimbo,
  EtiquetaArquivo,
  EtiquetaParte,
  FontesList,
  Kicker,
  TipoBadges,
  useReveal,
} from "./atoms";

interface Filtros {
  grau: GrauId | "todos";
  tipo: string | "todos";
  pessoa: string | "todas";
  soDestaques: boolean;
}

// padding lateral da trilha (px-6 / scroll-pl-6): usado para alinhar o salto
const TRILHA_PAD = 24;

function CartaoFato({
  fato,
  registro,
  aberto,
  alternar,
  onPessoa,
}: {
  fato: Fato;
  registro: number;
  aberto: boolean;
  alternar: (id: string) => void;
  onPessoa: (id: string) => void;
}) {
  return (
    <article
      id={`fato-${fato.id}`}
      className={`card-hover relative scroll-mt-44 w-full rounded-2xl border bg-card ${
        aberto ? "border-primary/45" : "border-border"
      } ${fato.destaque && !aberto ? "shadow-[inset_2px_0_0_0_var(--color-gold)]" : ""}`}
    >
      <Carimbo grau={fato.grau} className="absolute -top-2.5 right-4" />
      <EtiquetaArquivo>REG-{String(registro).padStart(3, "0")}</EtiquetaArquivo>
      <button
        type="button"
        onClick={() => alternar(fato.id)}
        aria-expanded={aberto}
        className="w-full rounded-2xl p-4 pt-5 text-left sm:p-5 sm:pt-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden />
            {fato.dataLabel}
          </span>
          {fato.destaque && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
              <Star className="size-2.5" aria-hidden />
              Marco do caso
            </span>
          )}
          <ChevronDown
            className={`ml-auto size-4 text-muted-foreground transition-transform duration-300 ${aberto ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
        <h3 className="mt-2.5 pr-6 text-[1.05rem] font-bold leading-snug tracking-tight sm:text-[1.08rem]">
          {fato.titulo}
        </h3>
        <p
          className={`mt-2 text-[0.94rem] leading-relaxed text-foreground/85 ${aberto ? "" : "line-clamp-2"}`}
        >
          {fato.texto}
        </p>
        {!aberto && (
          <span className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary/90">
            <MousePointerClick className="size-3" aria-hidden />
            Abrir documento
          </span>
        )}
      </button>
      {aberto && (
        <div className="space-y-4 border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <TipoBadges tipos={fato.tipos} max={4} />
          {fato.pessoas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fato.pessoas.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPessoa(id)}
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {nomePessoa(id)}
                </button>
              ))}
            </div>
          )}
          <FontesList fontes={fato.fontes} compacto />
        </div>
      )}
    </article>
  );
}

export default function Timeline({
  onPessoa,
  focoEventoId,
  aoLimparFoco,
}: {
  onPessoa: (id: string) => void;
  focoEventoId: string | null;
  aoLimparFoco: () => void;
}) {
  const ref = useReveal<HTMLElement>();
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [focoAnterior, setFocoAnterior] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    grau: "todos",
    tipo: "todos",
    pessoa: "todas",
    soDestaques: false,
  });

  const [idxAtivo, setIdxAtivo] = useState(0);
  const [anoAtivo, setAnoAtivo] = useState<string | null>(null);
  const [secaoVisivel, setSecaoVisivel] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  const trilhoRef = useRef<HTMLDivElement | null>(null);
  const preencherRef = useRef<HTMLSpanElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const idxAtivoRef = useRef(0);
  const listaRef = useRef<{ id: string; ano: string }[]>([]);
  const arrastoRef = useRef({ ativo: false, moveu: false, x: 0, scroll: 0 });

  // abre o fato focado (vindo da busca ou de um perfil): ajuste de estado na renderização
  if (focoEventoId && focoEventoId !== focoAnterior) {
    setFocoAnterior(focoEventoId);
    setFiltros({
      grau: "todos",
      tipo: "todos",
      pessoa: "todas",
      soDestaques: false,
    });
    setAbertos((prev) => new Set(prev).add(focoEventoId));
    const i = timeline.findIndex((f) => f.id === focoEventoId);
    if (i >= 0) {
      setIdxAtivo(i);
      setAnoAtivo(timeline[i].data.slice(0, 4));
    }
  }

  const filtrados = useMemo(() => {
    return timeline.filter((f) => {
      if (filtros.grau !== "todos" && f.grau !== filtros.grau) return false;
      if (filtros.tipo !== "todos" && !f.tipos.includes(filtros.tipo))
        return false;
      if (filtros.pessoa !== "todas" && !f.pessoas.includes(filtros.pessoa))
        return false;
      if (filtros.soDestaques && !f.destaque) return false;
      return true;
    });
  }, [filtros]);

  const listaFatos = useMemo(
    () => filtrados.map((f) => ({ id: f.id, ano: f.data.slice(0, 4) })),
    [filtrados],
  );

  useEffect(() => {
    listaRef.current = listaFatos;
  }, [listaFatos]);

  const anosFiltrados = useMemo(() => {
    const mapa = new Map<string, Fato[]>();
    for (const f of filtrados) {
      const ano = f.data.slice(0, 4);
      if (!mapa.has(ano)) mapa.set(ano, []);
      mapa.get(ano)!.push(f);
    }
    return [...mapa.entries()];
  }, [filtrados]);

  const registroPorId = useMemo(() => {
    const mapa = new Map<string, number>();
    filtrados.forEach((f, i) => mapa.set(f.id, i + 1));
    return mapa;
  }, [filtrados]);

  function alternar(id: string) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const irPara = useCallback((i: number) => {
    const total = listaRef.current.length;
    const pos = Math.min(total - 1, Math.max(0, i));
    const alvo = listaRef.current[pos];
    const trilho = trilhoRef.current;
    if (!alvo || !trilho) return;
    const col = trilho.querySelector<HTMLElement>(
      `[data-fato-col="${alvo.id}"]`,
    );
    if (!col) return;
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trilho.scrollTo({
      left: Math.max(0, col.offsetLeft - TRILHA_PAD),
      behavior: reduz ? "auto" : "smooth",
    });
    idxAtivoRef.current = pos;
    setIdxAtivo(pos);
    setAnoAtivo(alvo.ano);
    setAnuncio(
      `Fato ${pos + 1} de ${total}: ${alvo.id.replace(/^tl-/, "").replaceAll("-", " ")}`,
    );
  }, []);

  // medição contínua da trilha: documento ativo, cursor e preenchimento do eixo
  useEffect(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;
    let raf = 0;
    const medir = () => {
      raf = 0;
      const cols = trilho.querySelectorAll<HTMLElement>("[data-fato-col]");
      if (!cols.length) return;
      const referencia = trilho.scrollLeft + TRILHA_PAD + 8;
      let idx = 0;
      let melhor = Infinity;
      cols.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft - referencia);
        if (d < melhor) {
          melhor = d;
          idx = i;
        }
      });
      const atual = cols[idx];
      const centro = atual.offsetLeft + atual.offsetWidth / 2;
      if (cursorRef.current) cursorRef.current.style.left = `${centro}px`;
      if (preencherRef.current)
        preencherRef.current.style.transform = `scaleX(${Math.min(1, centro / Math.max(1, trilho.scrollWidth))})`;
      if (idx !== idxAtivoRef.current) {
        idxAtivoRef.current = idx;
        setIdxAtivo(idx);
        setAnoAtivo(listaRef.current[idx]?.ano ?? null);
      }
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    trilho.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      trilho.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [filtrados]);

  // visibilidade da seção: habilita os atalhos de teclado
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setSecaoVisivel(entries[0]?.isIntersecting ?? false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  // teclado: setas avançam e recuam a trilha; J e K mantidos do eixo antigo
  useEffect(() => {
    if (!secaoVisivel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName))
        return;
      const total = listaRef.current.length;
      if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        irPara(idxAtivoRef.current + 1 >= total ? total - 1 : idxAtivoRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        irPara(idxAtivoRef.current - 1 <= 0 ? 0 : idxAtivoRef.current - 1);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [secaoVisivel, irPara]);

  // rola até o fato focado (busca/perfil): alinha a trilha no documento e
  // repete a rolagem para vencer o lock da sobreposição de busca
  useEffect(() => {
    if (!focoEventoId) return;
    const tentativas = [250, 700, 1200].map((atraso, i) =>
      setTimeout(
        () => {
          const trilho = trilhoRef.current;
          const col = trilho?.querySelector<HTMLElement>(
            `[data-fato-col="${focoEventoId}"]`,
          );
          if (trilho && col) {
            const reduz = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            trilho.scrollTo({
              left: Math.max(0, col.offsetLeft - TRILHA_PAD),
              behavior: reduz ? "auto" : "smooth",
            });
            trilho.scrollIntoView({
              behavior: reduz ? "auto" : "smooth",
              block: "center",
            });
          }
          if (i === tentativas.length - 1) aoLimparFoco();
        },
        atraso,
      ),
    );
    return () => tentativas.forEach(clearTimeout);
  }, [focoEventoId, aoLimparFoco]);

  const saltarAno = (ano: string) => {
    const i = listaRef.current.findIndex((f) => f.ano === ano);
    if (i >= 0) irPara(i);
  };

  // arrasto com o mouse: converte o deslize lateral em rolagem da trilha
  const aoPonteiroAbaixo = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const trilho = trilhoRef.current;
    if (!trilho) return;
    const a = arrastoRef.current;
    a.ativo = true;
    a.moveu = false;
    a.x = e.clientX;
    a.scroll = trilho.scrollLeft;
    const mover = (ev: PointerEvent) => {
      if (!a.ativo) return;
      const dx = ev.clientX - a.x;
      if (!a.moveu && Math.abs(dx) > 6) {
        a.moveu = true;
        trilho.style.userSelect = "none";
      }
      if (a.moveu) trilho.scrollLeft = a.scroll - dx;
    };
    const soltar = () => {
      a.ativo = false;
      trilho.style.userSelect = "";
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  };

  // um arrasto real não pode terminar em clique (abriria o documento)
  const aoCliqueCapturado = (e: ReactMouseEvent) => {
    if (!arrastoRef.current.moveu) return;
    e.preventDefault();
    e.stopPropagation();
    arrastoRef.current.moveu = false;
  };

  const chip = (ativo: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      ativo
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-secondary text-foreground/85 hover:text-foreground"
    }`;

  const total = listaFatos.length;
  const fatoAtual = idxAtivo >= 0 ? (filtrados[idxAtivo] ?? null) : null;
  const podeAnterior = idxAtivo > 0;
  const podeProxima = idxAtivo < total - 1;

  return (
    <section
      id="linha-do-tempo"
      ref={ref}
      className="scroll-mt-24 py-16 sm:py-24"
    >
      <div className="vinheta-tl mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <EtiquetaParte n="03" folhas={`${contagens.fatos} registros datados`} />
          <Kicker>Arquivo · Cronologia datada</Kicker>
          <h2 className="display-sm mt-4">
            Do sigilo ao arquivo aberto: {contagens.fatos} fatos datados
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A cronologia completa do caso, disposta em uma trilha lateral como
            fichas de um arquivo: decisões do Banco Central, operações da
            Polícia Federal, inquéritos do STF, reembolsos do FGC e o que a
            imprensa apurou. Percorra a trilha para os lados, abra qualquer
            documento e confira as fontes originais.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <MoveHorizontal className="size-3.5 text-primary" aria-hidden />
              Arraste a trilha para o lado ou use os botões de navegação
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MousePointerClick
                className="size-3.5 text-primary"
                aria-hidden
              />
              Clique em um fato para abrir o documento
            </li>
            <li className="hidden items-center gap-1.5 sm:inline-flex">
              <Keyboard className="size-3.5 text-primary" aria-hidden />
              Setas, J e K navegam entre os fatos
            </li>
          </ul>
        </div>

        <div className="reveal mt-8 space-y-3 rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Grau:
            </span>
            <button
              type="button"
              className={chip(filtros.grau === "todos")}
              onClick={() => setFiltros((f) => ({ ...f, grau: "todos" }))}
            >
              Todos
            </button>
            {meta.escala.map((e) => (
              <button
                key={e.id}
                type="button"
                className={chip(filtros.grau === e.id)}
                onClick={() => setFiltros((f) => ({ ...f, grau: e.id }))}
              >
                <span
                  className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${bgGrau[e.id]}`}
                  aria-hidden
                />
                {e.rotulo}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                Tipo de apuração:
              </span>
              <select
                value={filtros.tipo}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, tipo: e.target.value }))
                }
                className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-primary"
              >
                <option value="todos">Todos</option>
                {meta.tiposApuracao.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                Pessoa:
              </span>
              <select
                value={filtros.pessoa}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, pessoa: e.target.value }))
                }
                className="max-w-[220px] rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-primary"
              >
                <option value="todas">Todas</option>
                {[...new Set(timeline.flatMap((f) => f.pessoas))]
                  .map((id) => ({ id, nome: nomePessoa(id) }))
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="button"
              className={chip(filtros.soDestaques)}
              onClick={() =>
                setFiltros((f) => ({ ...f, soDestaques: !f.soDestaques }))
              }
              aria-pressed={filtros.soDestaques}
            >
              ★ Só marcos do caso
            </button>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {filtrados.length} de {timeline.length} fatos
            </span>
          </div>
        </div>

        {/* trilho fixo de anos: navegação rápida por capítulo */}
        {total > 0 && (
          <nav
            aria-label="Anos da linha do tempo"
            className="sticky top-[4.4rem] z-20 -mx-4 mt-6 border-y border-border/70 bg-background/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6"
          >
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {anosFiltrados.map(([ano, fatos]) => (
                <button
                  key={ano}
                  type="button"
                  onClick={() => saltarAno(ano)}
                  aria-current={anoAtivo === ano ? "true" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 transition-all ${
                    anoAtivo === ano
                      ? "border-primary bg-primary/15 text-primary shadow-[0_0_16px_rgb(238_194_87/0.25)]"
                      : "border-border bg-secondary/80 text-foreground/85 hover:border-primary/40"
                  }`}
                >
                  <span className="font-mono text-sm font-bold">{ano}</span>
                  <span
                    className={`font-mono text-[10px] ${anoAtivo === ano ? "text-primary/80" : "text-muted-foreground"}`}
                  >
                    {fatos.length}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* trilha lateral do arquivo: documentos correm para os lados */}
        <div className="reveal relative mt-5">
          <div
            ref={trilhoRef}
            onPointerDown={aoPonteiroAbaixo}
            onClickCapture={aoCliqueCapturado}
            tabIndex={0}
            role="region"
            aria-label="Trilha lateral de fatos da linha do tempo"
            className="no-scrollbar relative snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card/40 scroll-pl-6 focus-visible:outline-primary active:cursor-grabbing cursor-grab"
          >
            <div className="relative flex w-max items-start gap-3 px-6 pb-6 sm:gap-4">
              {/* eixo dourado da cronologia */}
              <div
                className="pointer-events-none absolute inset-x-0 top-4 h-px"
                aria-hidden
              >
                <span className="tl-eixo-x absolute inset-0" />
                <span
                  ref={preencherRef}
                  className="tl-preenchimento-x absolute inset-0"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <span
                ref={cursorRef}
                className="tl-cursor-x pointer-events-none absolute top-2 z-10 h-4 w-[3px] -ml-[1.5px] rounded-full"
                style={{ left: "24px" }}
                aria-hidden
              />

              {anosFiltrados.map(([ano, fatosDoAno]) => (
                <Fragment key={ano}>
                  {/* marcador de capítulo do ano */}
                  <button
                    type="button"
                    id={`ano-${ano}`}
                    onClick={() => saltarAno(ano)}
                    title={`Ir para ${ano}`}
                    className="group relative flex w-11 shrink-0 snap-start flex-col items-center sm:w-12"
                  >
                    <span className="relative z-10 flex h-8 items-center">
                      <span className="ano-selo inline-flex rounded-full border border-primary/30 bg-background px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight text-primary transition-colors group-hover:border-primary/70">
                        {ano}
                      </span>
                    </span>
                    <span className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground [writing-mode:vertical-rl]">
                      {fatosDoAno.length}{" "}
                      {fatosDoAno.length === 1 ? "fato" : "fatos"}
                    </span>
                  </button>
                  {fatosDoAno.map((f, i) => (
                    <div
                      key={f.id}
                      data-fato-col={f.id}
                      className="tl-item reveal-item-x relative flex w-[min(86vw,400px)] shrink-0 snap-start flex-col"
                      style={
                        { "--atraso": `${(i % 4) * 60}ms` } as CSSProperties
                      }
                    >
                      <span className="relative z-10 flex h-8 items-center justify-center">
                        <span
                          className="tl-no size-3.5 rounded-full"
                          data-grau={f.grau}
                          data-destaque={f.destaque ? "1" : "0"}
                          aria-hidden
                        />
                      </span>
                      <div className="mt-3 flex min-w-0 flex-1">
                        <CartaoFato
                          fato={f}
                          registro={registroPorId.get(f.id) ?? 0}
                          aberto={abertos.has(f.id)}
                          alternar={alternar}
                          onPessoa={onPessoa}
                        />
                      </div>
                    </div>
                  ))}
                </Fragment>
              ))}

              {total === 0 && (
                <p className="w-[min(86vw,560px)] shrink-0 self-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum fato com os filtros atuais. Ajuste as combinações para
                  ver outros resultados.
                </p>
              )}
            </div>
          </div>

          {/* setas de navegação sobre as bordas da trilha */}
          <button
            type="button"
            onClick={() => irPara(idxAtivo - 1)}
            disabled={!podeAnterior}
            aria-label="Fato anterior"
            className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 shadow-[0_8px_28px_rgb(0_0_0/0.5)] backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary disabled:pointer-events-none disabled:opacity-0 sm:grid"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => irPara(idxAtivo + 1)}
            disabled={!podeProxima}
            aria-label="Próximo fato"
            className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 shadow-[0_8px_28px_rgb(0_0_0/0.5)] backdrop-blur-md transition-colors hover:border-primary/60 hover:text-primary disabled:pointer-events-none disabled:opacity-0 sm:grid"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {/* console de navegação: anterior/próxima, posição e saltos por ano */}
        {total > 0 && (
          <div className="reveal mt-4 rounded-2xl border border-border bg-card/70 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => irPara(idxAtivo - 1)}
                disabled={!podeAnterior}
                aria-label="Fato anterior"
                className="inline-flex size-10 shrink-0 items-center justify-center gap-1 rounded-full border border-border text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-35 sm:size-11"
              >
                <ChevronLeft className="size-4" aria-hidden />
                <span className="hidden pr-1 text-xs font-medium sm:inline">
                  Anterior
                </span>
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {fatoAtual ? (
                    <>
                      <span className="text-primary">
                        Fato {idxAtivo + 1}/{total}
                      </span>{" "}
                      · {fatoAtual.dataLabel} · {fatoAtual.titulo}
                    </>
                  ) : (
                    <>Percorra a trilha com os botões</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => irPara(idxAtivo + 1)}
                disabled={!podeProxima}
                aria-label="Próximo fato"
                className="inline-flex size-10 shrink-0 items-center justify-center gap-1 rounded-full border border-border text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-35 sm:size-11"
              >
                <span className="hidden pl-1 text-xs font-medium sm:inline">
                  Próxima
                </span>
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            {/* distribuição dos fatos por ano, com cursor da posição atual */}
            <div className="relative mt-3 h-7 overflow-hidden rounded-full border border-border bg-background/60">
              <div className="flex h-full">
                {anosFiltrados.map(([ano, fatosDoAno]) => {
                  const primeiro = listaFatos.findIndex((x) => x.ano === ano);
                  return (
                    <button
                      key={ano}
                      type="button"
                      onClick={() => irPara(primeiro)}
                      title={`${ano} · ${fatosDoAno.length} fatos`}
                      className="relative h-full border-r border-border/50 transition-colors last:border-r-0 hover:bg-primary/10"
                      style={{
                        width: `${(fatosDoAno.length / total) * 100}%`,
                      }}
                    >
                      {fatosDoAno.length / total >= 0.06 && (
                        <span className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-[10px] font-bold text-muted-foreground">
                          {ano}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span
                className="pointer-events-none absolute top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_rgb(238_194_87/0.55)] transition-[left] duration-300"
                style={{
                  left: `${((Math.max(0, idxAtivo) + 0.5) / total) * 100}%`,
                }}
                aria-hidden
              />
            </div>
            <p className="mt-2 hidden text-center font-mono text-[10px] text-muted-foreground sm:block">
              Cada posição da trilha é um documento; a cor do nó segue o grau de
              comprovação.
            </p>
          </div>
        )}
      </div>

      {/* anúncio acessível dos saltos de navegação */}
      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>
    </section>
  );
}
