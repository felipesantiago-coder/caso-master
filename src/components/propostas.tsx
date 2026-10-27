"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  DraftingCompass,
  ExternalLink,
  FileSearch,
  Gavel,
  Hammer,
  Info,
  Landmark,
  ListChecks,
  MapPin,
  Milestone,
  Vote,
  Wallet,
} from "lucide-react";
import {
  contaClassificacoes,
  dataBr,
  DIMENSOES,
  ordenaPropostas,
  propostasDados,
  recorteCargo,
  type CandidatoPropostas,
  type Classificacao,
  type Dimensao,
  type Proposta,
} from "@/lib/propostas";

const ROTULO_CARGO: Record<CandidatoPropostas["cargo"], string> = {
  presidente: "Presidente",
  governador: "Governador do DF",
};

const ICONE_DIMENSAO: Record<Dimensao, React.ElementType> = {
  aprovacao: Landmark,
  fiscal: Wallet,
  juridico: Gavel,
  execucao: Hammer,
};

type Recorte = "todos" | "presidente" | "governador";

function ChipClassificacao({
  c,
  pequeno,
}: {
  c: Classificacao;
  pequeno?: boolean;
}) {
  const info = propostasDados.categorias[c];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-semibold ring-1 ${info.chip} ${
        pequeno ? "text-[0.625rem]" : "text-[0.6875rem]"
      }`}
    >
      {info.label}
    </span>
  );
}

function PropostaItem({ p }: { p: Proposta }) {
  const rotuloOrigem = propostasDados.origem_rotulos[p.origem.tipo];
  return (
    <li className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-start gap-2 [&::-webkit-details-marker]:hidden">
          <ChipClassificacao c={p.classificacao} />
          <span className="min-w-0 flex-1 text-[0.875rem] font-medium leading-snug text-zinc-900 dark:text-zinc-50 text-pretty">
            {p.titulo}
          </span>
          <span
            aria-hidden
            className="mt-0.5 shrink-0 text-xs font-semibold text-emerald-700 group-open:hidden dark:text-emerald-400"
          >
            ▾
          </span>
        </summary>

        <div className="mt-3 space-y-2.5">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 text-pretty">
            {p.resumo}
          </p>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                Origem ({rotuloOrigem}):
              </strong>{" "}
              {p.origem.contexto}, em {dataBr(p.origem.data)}.
            </span>
          </p>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <Milestone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">Caminho exigido:</strong>{" "}
              {p.caminho}.
            </span>
          </p>

          <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100 dark:bg-zinc-900/60 dark:ring-zinc-800">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 text-pretty">
              <FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span>
                <strong className="font-semibold">Análise técnica:</strong>{" "}
                {p.analise}
              </span>
            </p>
          </div>

          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            aria-label="Fatores de viabilidade"
          >
            {DIMENSOES.map((d) => {
              const Icone = ICONE_DIMENSAO[d];
              const info = propostasDados.dimensoes[d];
              return (
                <div
                  key={d}
                  className="rounded-2xl bg-white p-2.5 ring-1 ring-zinc-100 dark:bg-zinc-900/40 dark:ring-zinc-800"
                >
                  <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <Icone className="h-3 w-3" aria-hidden />
                    {info.nome}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
                    {p.fatores[d]}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {p.fontes.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{f.titulo}</span>
              </a>
            ))}
          </div>
        </div>
      </details>
    </li>
  );
}

function CardCandidato({ c }: { c: CandidatoPropostas }) {
  const contagem = contaClassificacoes(c.propostas);
  const lista = ordenaPropostas(c.propostas);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
          <Image
            src={c.foto}
            alt={`Foto de ${c.nome_urna}`}
            fill
            sizes="56px"
            className="object-cover object-top"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {c.nome_urna}{" "}
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              ({c.partido})
            </span>
          </h3>
          <p className="text-[0.75rem] leading-tight text-muted-foreground">
            {ROTULO_CARGO[c.cargo]}
          </p>
        </div>
        <p className="shrink-0 text-right text-[0.6875rem] leading-tight text-zinc-500 dark:text-zinc-400">
          {c.propostas.length} propostas
          <br />
          mapeadas
        </p>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        aria-label="Contagem por grau de viabilidade"
      >
        {(["improvavel", "razoavel", "facil"] as Classificacao[]).map((k) => {
          const n = contagem[k];
          if (n === 0) return null;
          const info = propostasDados.categorias[k];
          return (
            <span
              key={k}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ring-1 ${info.chip}`}
            >
              {n} {info.plural}
            </span>
          );
        })}
      </div>

      <ul className="mt-3 space-y-2">
        {lista.map((p) => (
          <PropostaItem key={p.id} p={p} />
        ))}
      </ul>
    </article>
  );
}

export default function SecaoPropostas() {
  const [recorte, setRecorte] = useState<Recorte>("todos");

  const candidatos = recorteCargo(propostasDados.candidatos, recorte);
  const todas = candidatos.flatMap((c) => c.propostas);
  const total = todas.length;
  const porGrau = contaClassificacoes(todas);

  const opcoes: { valor: Recorte; rotulo: string; icone?: React.ElementType }[] =
    [
      { valor: "todos", rotulo: "Todos" },
      { valor: "presidente", rotulo: "Presidente", icone: Vote },
      { valor: "governador", rotulo: "Governador do DF", icone: MapPin },
    ];

  return (
    <section
      id="propostas"
      aria-label="Viabilidade das propostas"
      className="mt-10 scroll-mt-40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50 text-balance">
            <DraftingCompass
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            Viabilidade das propostas
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            As propostas centrais dos finalistas no plano de governo e nas
            declarações oficiais até {dataBr(propostasDados.corte)}, analisadas
            tecnicamente tema a tema: o que depende só de execução, o que tem
            caminho real de aprovação e o que provavelmente não funcionará como
            anunciado. Atualizado em {dataBr(propostasDados.atualizado_em)}.
          </p>
        </div>
        <div
          className="inline-flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
          role="group"
          aria-label="Recorte das propostas"
        >
          {opcoes.map((o) => {
            const Icone = o.icone;
            const ativo = recorte === o.valor;
            return (
              <button
                key={o.valor}
                type="button"
                onClick={() => setRecorte(o.valor)}
                aria-pressed={ativo}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none ${
                  ativo
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {Icone && <Icone className="h-3.5 w-3.5" aria-hidden />}
                {o.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
        Neste recorte: {total} propostas mapeadas,{" "}
        <strong className="font-semibold text-rose-600 dark:text-rose-400">
          {porGrau.improvavel} altamente improváveis
        </strong>
        , {porGrau.razoavel} com possibilidade razoável e {porGrau.facil} fáceis
        de implementar entre os finalistas do recorte.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {candidatos.map((c) => (
          <CardCandidato key={c.slug} c={c} />
        ))}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          <ListChecks
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          Como a classificação funciona
        </h3>
        <div className="mt-2 space-y-2">
          {propostasDados.metodologia.map((m, i) => (
            <p
              key={i}
              className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty"
            >
              {m}
            </p>
          ))}
        </div>

        <div className="mt-4 space-y-1.5" aria-label="Graus de viabilidade">
          {(["improvavel", "razoavel", "facil"] as Classificacao[]).map((k) => (
            <p
              key={k}
              className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
            >
              <ChipClassificacao c={k} pequeno />
              <span className="min-w-0 flex-1 text-pretty">
                {propostasDados.categorias[k].desc}
              </span>
            </p>
          ))}
        </div>

        <div
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
          aria-label="Dimensões avaliadas"
        >
          {DIMENSOES.map((d) => {
            const Icone = ICONE_DIMENSAO[d];
            const info = propostasDados.dimensoes[d];
            return (
              <p
                key={d}
                className="flex items-start gap-2 rounded-2xl bg-zinc-50 p-2.5 text-xs leading-relaxed text-zinc-600 ring-1 ring-zinc-100 dark:bg-zinc-900/60 dark:text-zinc-400 dark:ring-zinc-800"
              >
                <Icone
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>
                  <strong className="font-semibold">{info.nome}:</strong>{" "}
                  {info.desc}
                </span>
              </p>
            );
          })}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-xs leading-relaxed text-sky-900 ring-1 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-900 text-pretty">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            A classificação mede viabilidade de funcionar, e não mérito: uma
            proposta difícil não é pior, e uma fácil não é automaticamente
            melhor. O que está aqui é o juízo técnico aberto sobre trilha de
            aprovação, custo, risco jurídico e prazo de cada compromisso
            assumido até 18/10/2026.
          </span>
        </p>
      </div>
    </section>
  );
}
