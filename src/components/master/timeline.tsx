"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Keyboard,
  MousePointerClick,
  Star,
  MoveVertical,
} from "lucide-react";
import {
  contagens,
  escalaPorId,
  meta,
  nomePessoa,
  timeline,
  type Fato,
  type GrauId,
} from "@/lib/master";
import {
  FontesList,
  GrauBadge,
  Kicker,
  TipoBadges,
  bgGrau,
  corGrau,
  useReveal,
} from "./atoms";

interface Filtros {
  grau: GrauId | "todos";
  tipo: string | "todos";
  pessoa: string | "todas";
  soDestaques: boolean;
}

const carimboCor: Record<GrauId, string> = {
  oficial: "border-emerald-400/80 text-emerald-300",
  multifonte: "border-teal-300/80 text-teal-200",
  fonteunica: "border-amber-400/80 text-amber-300",
  alegacao: "border-rose-400/80 text-rose-300",
};

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
  const esc = escalaPorId.get(fato.grau);
  return (
    <article
      id={`fato-${fato.id}`}
      className={`card-hover relative scroll-mt-44 rounded-2xl border bg-card ${
        aberto ? "border-primary/45" : "border-border"
      } ${fato.destaque && !aberto ? "shadow-[inset_2px_0_0_0_var(--color-gold)]" : ""}`}
    >
      <span
        className={`carimbo pointer-events-none absolute -top-2.5 right-4 z-10 rounded-[4px] border-2 bg-card/95 px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${carimboCor[fato.grau]}`}
        title={esc?.descricao}
      >
        {esc?.rotulo ?? fato.grau}
      </span>
      <span className="pointer-events-none absolute -top-2.5 left-4 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
        REG-{String(registro).padStart(3, "0")}
      </span>
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
        <h3 className="mt-2.5 pr-6 text-[1.08rem] font-bold leading-snug tracking-tight sm:text-lg">
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

  const [idxAtivo, setIdxAtivo] = useState(-1);
  const [anoAtivo, setAnoAtivo] = useState<string | null>(null);
  const [secaoVisivel, setSecaoVisivel] = useState(false);
  const [corpoVisivel, setCorpoVisivel] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  const eixoRef = useRef<HTMLDivElement | null>(null);
  const preencherRef = useRef<HTMLSpanElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const saltandoRef = useRef(false);
  const tempoSaltoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idxAtivoRef = useRef(-1);
  const listaRef = useRef<{ id: string; ano: string }[]>([]);

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
  }

  const anos = useMemo(() => {
    const mapa = new Map<string, Fato[]>();
    for (const f of timeline) {
      const ano = f.data.slice(0, 4);
      if (!mapa.has(ano)) mapa.set(ano, []);
      mapa.get(ano)!.push(f);
    }
    return [...mapa.entries()];
  }, []);

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

  const saltarPara = useCallback((i: number) => {
    const alvo = listaRef.current[i];
    if (!alvo) return;
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    saltandoRef.current = true;
    if (tempoSaltoRef.current) clearTimeout(tempoSaltoRef.current);
    tempoSaltoRef.current = setTimeout(() => {
      saltandoRef.current = false;
    }, 1100);
    setAbertos((prev) => new Set(prev).add(alvo.id));
    idxAtivoRef.current = i;
    setIdxAtivo(i);
    setAnoAtivo(alvo.ano);
    setAnuncio(
      `Fato ${i + 1} de ${listaRef.current.length}: ${alvo.id.replace(/^tl-/, "").replaceAll("-", " ")}`,
    );
    const el = document.getElementById(`fato-${alvo.id}`);
    el?.scrollIntoView({
      behavior: reduz ? "auto" : "smooth",
      block: "center",
    });
  }, []);

  // medição contínua: preenchimento do eixo, cursor e espionagem do fato ativo
  useEffect(() => {
    let raf = 0;
    const medir = () => {
      raf = 0;
      const eixo = eixoRef.current;
      if (!eixo) return;
      const rect = eixo.getBoundingClientRect();
      const centro = window.innerHeight * 0.55;
      const p = Math.min(1, Math.max(0, (centro - rect.top) / rect.height));
      if (preencherRef.current)
        preencherRef.current.style.transform = `scaleY(${p})`;
      if (cursorRef.current) cursorRef.current.style.top = `${p * 100}%`;
      if (saltandoRef.current) return;
      const lista = listaRef.current;
      let idx = -1;
      for (let i = 0; i < lista.length; i++) {
        const el = document.getElementById(`fato-${lista[i].id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= centro) idx = i;
        else break;
      }
      if (idx !== idxAtivoRef.current) {
        idxAtivoRef.current = idx;
        setIdxAtivo(idx);
        setAnoAtivo(
          idx >= 0 ? lista[idx].ano : lista.length ? lista[0].ano : null,
        );
      } else if (idx < 0 && lista.length && anoAtivo === null) {
        setAnoAtivo(lista[0].ano);
      }
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      window.removeEventListener("scroll", pedir);
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

  // visibilidade do corpo do arquivo: controla a barra de navegação inferior
  useEffect(() => {
    const el = eixoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setCorpoVisivel(entries[0]?.isIntersecting ?? false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // atalhos J e K: próximo e anterior fato
  useEffect(() => {
    if (!secaoVisivel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName))
        return;
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        saltarPara(
          Math.min(listaRef.current.length - 1, idxAtivoRef.current + 1),
        );
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        saltarPara(Math.max(0, idxAtivoRef.current));
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [secaoVisivel, saltarPara]);

  // rola até o fato focado (busca/perfil): repete a rolagem para vencer o lock de
  // rolagem da sobreposição de busca enquanto a animação de saída termina
  useEffect(() => {
    if (!focoEventoId) return;
    const tentativas = [250, 700, 1200].map((atraso, i) =>
      setTimeout(
        () => {
          const el = document.getElementById(`fato-${focoEventoId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (i === tentativas.length - 1) aoLimparFoco();
        },
        atraso,
      ),
    );
    return () => tentativas.forEach(clearTimeout);
  }, [focoEventoId, aoLimparFoco]);

  const saltarAno = (ano: string) => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.getElementById(`ano-${ano}`);
    el?.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "start" });
  };

  const chip = (ativo: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      ativo
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-secondary text-foreground/85 hover:text-foreground"
    }`;

  const total = listaFatos.length;
  const fatoAtual = idxAtivo >= 0 ? filtrados[idxAtivo] : null;
  const divisor = Math.max(1, total - 1);

  return (
    <section
      id="linha-do-tempo"
      ref={ref}
      className="scroll-mt-24 py-16 sm:py-24"
    >
      <div className="vinheta-tl mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Arquivo · Cronologia</Kicker>
          <h2 className="display-sm mt-4">
            {contagens.fatos} fatos, de 2017 até hoje
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A cronologia completa do caso, como um arquivo que se percorre:
            decisões do Banco Central, operações da Polícia Federal, inquéritos
            do STF, reembolsos do FGC e o que a imprensa apurou. Percorra o
            eixo, abra qualquer documento e confira as fontes originais.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <MoveVertical className="size-3.5 text-primary" aria-hidden />O
              cursor segue a sua leitura pelo eixo
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
              Teclas J e K saltam entre fatos
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

        {/* corpo do arquivo: eixo, capítulos e scrubber */}
        <div className="reveal mt-4 xl:flex xl:items-start xl:gap-10">
          <div ref={eixoRef} className="relative min-w-0 flex-1 py-4">
            <div
              className="absolute inset-y-0 left-[11px] w-px sm:left-[13px] lg:left-1/2"
              aria-hidden
            >
              <span className="tl-eixo absolute inset-0" />
              <span
                ref={preencherRef}
                className="tl-preenchimento absolute inset-0"
                style={{ transform: "scaleY(0)" }}
              />
              <span
                ref={cursorRef}
                className="tl-cursor absolute -left-[4px] size-2.5 rounded-full"
                style={{ top: "0%" }}
              />
            </div>

            {anosFiltrados.map(([ano, fatos]) => (
              <div
                key={ano}
                id={`ano-${ano}`}
                className="scroll-mt-40 pb-4 pt-6 first:pt-2"
              >
                <div className="relative flex min-h-[3.2rem] items-center">
                  <span className="ano-selo relative z-10 inline-flex items-center gap-2.5 rounded-full border border-primary/30 px-4 py-2 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                    <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                      {ano}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {fatos.length} {fatos.length === 1 ? "fato" : "fatos"}
                    </span>
                  </span>
                  <span
                    className="ml-4 h-px flex-1 bg-border lg:hidden"
                    aria-hidden
                  />
                </div>
                <div className="mt-5 space-y-5">
                  {fatos.map((f, i) => {
                    const par = registroPorId.get(f.id)! % 2 === 0;
                    return (
                      <div
                        key={f.id}
                        className="tl-item reveal-item relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
                        style={
                          { "--atraso": `${(i % 4) * 60}ms` } as CSSProperties
                        }
                      >
                        <span
                          className="tl-no absolute left-[11px] top-7 z-10 size-3.5 rounded-full sm:left-[13px] lg:left-1/2 lg:-translate-x-1/2"
                          data-grau={f.grau}
                          data-destaque={f.destaque ? "1" : "0"}
                          aria-hidden
                        />
                        <div
                          className={`pl-9 sm:pl-11 lg:pl-0 ${par ? "lg:col-start-2" : "lg:col-start-1"}`}
                        >
                          <CartaoFato
                            fato={f}
                            registro={registroPorId.get(f.id) ?? 0}
                            aberto={abertos.has(f.id)}
                            alternar={alternar}
                            onPessoa={onPessoa}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filtrados.length === 0 && (
              <p className="ml-9 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:ml-11 lg:ml-0">
                Nenhum fato com os filtros atuais. Ajuste as combinações para
                ver outros resultados.
              </p>
            )}
          </div>

          {/* scrubber lateral (desktop amplo): salto direto a qualquer fato */}
          {total > 1 && (
            <aside
              className="hidden xl:sticky xl:top-32 xl:block xl:w-60 xl:shrink-0 xl:self-start"
              aria-label="Navegação rápida entre os fatos"
            >
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Navegação rápida
                </p>
                <div className="mb-4 min-h-[4.1rem] rounded-xl border border-border bg-card px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {fatoAtual ? fatoAtual.dataLabel : "Início do arquivo"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground/90">
                    {fatoAtual ? fatoAtual.titulo : "Percorra a linha do tempo"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-primary">
                    {idxAtivo >= 0 ? idxAtivo + 1 : 1} / {total}
                  </p>
                </div>
                <div className="relative ml-2 h-[52vh] max-h-[560px] min-h-[340px] w-[3px] rounded bg-border">
                  {listaFatos.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => saltarPara(i)}
                      data-ativo={i === idxAtivo ? "1" : "0"}
                      title={`${filtrados[i].dataLabel} · ${filtrados[i].titulo}`}
                      className="scrubber-dot absolute -left-[4.5px] grid size-[13px] place-items-center rounded-full opacity-55"
                      style={{ top: `calc(${(i / divisor) * 100}% - 6px)` }}
                    >
                      <span
                        className={`size-[5px] rounded-full ${bgGrau[filtrados[i].grau]}`}
                        aria-hidden
                      />
                    </button>
                  ))}
                  <span
                    className="pointer-events-none absolute -left-[3px] size-[9px] rounded-full bg-primary shadow-[0_0_12px_3px_rgb(238_194_87/0.6)] transition-[top] duration-150"
                    style={{
                      top: `${(Math.max(0, idxAtivo) / divisor) * 100}%`,
                    }}
                    aria-hidden
                  />
                </div>
                <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Cada ponto é um documento. A cor segue o grau de comprovação.
                </p>
              </div>
            </aside>
          )}
        </div>

        {/* barra de navegação entre fatos: fixa durante o percurso do arquivo */}
        {total > 0 && (
          <div
            className={`pointer-events-none sticky bottom-4 z-30 mt-8 flex justify-center transition-opacity duration-500 ${
              corpoVisivel ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background/92 py-1.5 pl-2 pr-2 shadow-[0_10px_34px_rgb(0_0_0/0.55)] backdrop-blur-md sm:gap-2 sm:pl-3">
              <button
                type="button"
                onClick={() => saltarPara(Math.max(0, idxAtivoRef.current - 1))}
                disabled={idxAtivo <= 0}
                aria-label="Fato anterior"
                className="grid size-8 place-items-center rounded-full border border-border text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-35"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="min-w-0 max-w-[46vw] truncate px-1 text-center font-mono text-[11px] text-muted-foreground sm:max-w-[420px]">
                {fatoAtual ? (
                  <>
                    <span className="text-primary">
                      Fato {idxAtivo + 1}/{total}
                    </span>{" "}
                    · {fatoAtual.dataLabel} · {fatoAtual.titulo}
                  </>
                ) : (
                  <>Fato 1/{total} · role para percorrer o arquivo</>
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  saltarPara(Math.min(total - 1, idxAtivoRef.current + 1))
                }
                disabled={idxAtivo >= total - 1}
                aria-label="Próximo fato"
                className="grid size-8 place-items-center rounded-full border border-border text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-35"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
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
