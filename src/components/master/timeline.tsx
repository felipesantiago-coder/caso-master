"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Star } from "lucide-react";
import { contagens, escalaPorId, labelTipo, meta, nomePessoa, timeline, type Fato, type GrauId } from "@/lib/master";
import { FontesList, GrauBadge, Kicker, TipoBadges, bgGrau, corGrau, useReveal } from "./atoms";

interface Filtros {
  grau: GrauId | "todos";
  tipo: string | "todos";
  pessoa: string | "todas";
  soDestaques: boolean;
}

function CartaoFato({
  fato,
  aberto,
  alternar,
  onPessoa,
}: {
  fato: Fato;
  aberto: boolean;
  alternar: (id: string) => void;
  onPessoa: (id: string) => void;
}) {
  return (
    <article
      id={`fato-${fato.id}`}
      className={`card-hover scroll-mt-28 rounded-2xl border bg-card ${
        aberto ? "border-primary/40" : "border-border"
      } ${fato.destaque && !aberto ? "shadow-[inset_2px_0_0_0_var(--color-gold)]" : ""}`}
    >
      <button
        type="button"
        onClick={() => alternar(fato.id)}
        aria-expanded={aberto}
        className="w-full p-4 text-left sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden />
            {fato.dataLabel}
          </span>
          <GrauBadge grau={fato.grau} />
          {fato.destaque && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
              <Star className="size-2.5" aria-hidden />
              Marco do caso
            </span>
          )}
          <ChevronDown
            className={`ml-auto size-4 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
        <h3 className="mt-2.5 text-[1.05rem] font-bold leading-snug tracking-tight sm:text-lg">{fato.titulo}</h3>
        <p className={`mt-2 text-sm leading-relaxed text-muted-foreground ${aberto ? "" : "line-clamp-2"}`}>
          {fato.texto}
        </p>
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
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
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

  // abre o fato focado (vindo da busca ou de um perfil): ajuste de estado na renderização
  if (focoEventoId && focoEventoId !== focoAnterior) {
    setFocoAnterior(focoEventoId);
    setFiltros({ grau: "todos", tipo: "todos", pessoa: "todas", soDestaques: false });
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
      if (filtros.tipo !== "todos" && !f.tipos.includes(filtros.tipo)) return false;
      if (filtros.pessoa !== "todas" && !f.pessoas.includes(filtros.pessoa)) return false;
      if (filtros.soDestaques && !f.destaque) return false;
      return true;
    });
  }, [filtros]);

  const anosFiltrados = useMemo(() => {
    const mapa = new Map<string, Fato[]>();
    for (const f of filtrados) {
      const ano = f.data.slice(0, 4);
      if (!mapa.has(ano)) mapa.set(ano, []);
      mapa.get(ano)!.push(f);
    }
    return [...mapa.entries()];
  }, [filtrados]);

  function alternar(id: string) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  // rola até o fato focado depois que ele é renderizado aberto (apenas DOM, sem setState)
  useEffect(() => {
    if (!focoEventoId) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`fato-${focoEventoId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      aoLimparFoco();
    }, 250);
    return () => clearTimeout(t);
  }, [focoEventoId, aoLimparFoco]);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      ativo ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-foreground/75 hover:text-foreground"
    }`;

  return (
    <section id="linha-do-tempo" ref={ref} className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <Kicker>Linha do tempo</Kicker>
          <h2 className="display-sm mt-4">
            {contagens.fatos} fatos, de 2017 até hoje
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A cronologia completa do caso: decisões do Banco Central, operações da Polícia Federal, inquéritos do STF,
            reembolsos do FGC e o que a imprensa apurou. Filtre por grau de comprovação, por tipo de apuração ou por
            pessoa, e clique em qualquer fato para ver as fontes.
          </p>
        </div>

        <div className="reveal mt-8 space-y-3 rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Grau:</span>
            <button type="button" className={chip(filtros.grau === "todos")} onClick={() => setFiltros((f) => ({ ...f, grau: "todos" }))}>
              Todos
            </button>
            {meta.escala.map((e) => (
              <button key={e.id} type="button" className={chip(filtros.grau === e.id)} onClick={() => setFiltros((f) => ({ ...f, grau: e.id }))}>
                <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${bgGrau[e.id]}`} aria-hidden />
                {e.rotulo}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Tipo de apuração:</span>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
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
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Pessoa:</span>
              <select
                value={filtros.pessoa}
                onChange={(e) => setFiltros((f) => ({ ...f, pessoa: e.target.value }))}
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
              onClick={() => setFiltros((f) => ({ ...f, soDestaques: !f.soDestaques }))}
              aria-pressed={filtros.soDestaques}
            >
              ★ Só marcos do caso
            </button>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {filtrados.length} de {timeline.length} fatos
            </span>
          </div>
        </div>

        <div className="reveal relative mt-10">
          <div className="tl-line absolute bottom-0 left-[7px] top-0 w-px sm:left-[9px]" aria-hidden />
          <div className="space-y-10">
            {anosFiltrados.map(([ano, fatos]) => (
              <div key={ano}>
                <div className="relative flex items-center gap-4">
                  <span className="relative z-10 grid size-4 place-items-center sm:size-5">
                    <span className="size-2.5 rounded-full bg-primary sm:size-3" aria-hidden />
                  </span>
                  <h3 className="font-mono text-2xl font-bold tracking-tight text-foreground/85 sm:text-3xl">{ano}</h3>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {fatos.length} {fatos.length === 1 ? "fato" : "fatos"}
                  </span>
                </div>
                <div className="mt-5 space-y-3 pl-8 sm:pl-10">
                  {fatos.map((f) => (
                    <CartaoFato key={f.id} fato={f} aberto={abertos.has(f.id)} alternar={alternar} onPessoa={onPessoa} />
                  ))}
                </div>
              </div>
            ))}
            {filtrados.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum fato com os filtros atuais. Ajuste as combinações para ver outros resultados.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
