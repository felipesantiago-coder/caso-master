"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Film, Info, ListChecks, Quote, SearchCheck, Tv } from "lucide-react";
import {
  afirmacoesRecorte,
  checagem,
  contaVereditos,
  ORDEM_VEREDITOS,
  ordenaAfirmacoes,
  totalFalsas,
  VEREDITO_INFO,
  type Afirmacao,
  type CandidatoChecagem,
  type RecorteChecagem,
  type Veredito,
} from "@/lib/checagem";

const ROTULO_CARGO: Record<CandidatoChecagem["cargo"], string> = {
  presidente: "Presidente",
  governador: "Governador do DF",
};

/** Resumo curto da afirmação para o sumário fechado. */
const resumo = (texto: string): string =>
  texto.length > 118 ? texto.slice(0, 115).replace(/\s+\S*$/, "") + "..." : texto;

function ChipVeredito({ v, pequeno }: { v: Veredito; pequeno?: boolean }) {
  const info = VEREDITO_INFO[v];
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

function Afirmação({ a, rotuloEvento }: { a: Afirmacao; rotuloEvento: string }) {
  return (
    <li className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-start gap-2 [&::-webkit-details-marker]:hidden">
          <ChipVeredito v={a.veredito} />
          <span className="min-w-0 flex-1 text-[0.875rem] font-medium leading-snug text-zinc-900 dark:text-zinc-50 text-pretty">
            &ldquo;{resumo(a.texto)}&rdquo;
          </span>
          <span
            aria-hidden
            className="mt-0.5 shrink-0 text-xs font-semibold text-emerald-700 group-open:hidden dark:text-emerald-400"
          >
            ▾
          </span>
        </summary>
        <div className="mt-3 space-y-2.5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-zinc-900 dark:text-zinc-50">
            <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            <span className="italic">&ldquo;{a.texto}&rdquo;</span>
          </p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Onde e quando:</strong>{" "}
            {a.contexto} ({rotuloEvento}).
          </p>
          <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100 dark:bg-zinc-900/60 dark:ring-zinc-800">
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 text-pretty">
              <strong className="font-semibold">O que os fatos dizem:</strong> {a.fatos}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {a.fontes.map((f, i) => (
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

function CardCandidato({ c, recorte }: { c: CandidatoChecagem; recorte: RecorteChecagem }) {
  const lista = ordenaAfirmacoes(afirmacoesRecorte(c, recorte));
  const contagem = contaVereditos(lista);
  const falsas = totalFalsas(lista);
  const checadas = lista.length;
  const enganosas = falsas + contagem.distorcida + contagem.exagerada + contagem.imprecisa;

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
            {c.nome_urna} <span className="font-medium text-zinc-500 dark:text-zinc-400">({c.partido})</span>
          </h3>
          <p className="text-[0.75rem] leading-tight text-muted-foreground">{ROTULO_CARGO[c.cargo]}</p>
        </div>
        <div className="text-right">
          <p
            className={`text-3xl font-bold leading-none ${
              falsas > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {falsas}
          </p>
          <p className="mt-0.5 text-[0.6875rem] leading-tight text-zinc-500 dark:text-zinc-400">
            {falsas === 1 ? "afirmação falsa" : "afirmações falsas"}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
        {checadas} {checadas === 1 ? "afirmação checada" : "afirmações checadas"} neste recorte,{" "}
        {enganosas} {enganosas === 1 ? "delas enganosa" : "delas enganosas"} (falsas, distorcidas, exageradas ou
        imprecisas).
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Contagem por veredito">
        {ORDEM_VEREDITOS.filter((v) => contagem[v] > 0).map((v) => {
          const n = contagem[v];
          const rotulo =
            v === "sem_checagem_formal" || n === 1
              ? VEREDITO_INFO[v].label.toLowerCase()
              : VEREDITO_INFO[v].label.toLowerCase() + "s";
          return (
            <span
              key={v}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ring-1 ${VEREDITO_INFO[v].chip}`}
            >
              {n} {rotulo}
            </span>
          );
        })}
      </div>

      {c.nota_extra && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-xs leading-relaxed text-sky-900 ring-1 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-900 text-pretty">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{c.nota_extra}</span>
        </p>
      )}

      {checadas === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Nenhuma afirmação do candidato foi checada neste recorte.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((a, i) => (
            <Afirmação key={i} a={a} rotuloEvento={checagem.evento_rotulos[a.evento] ?? a.evento} />
          ))}
        </ul>
      )}
    </article>
  );
}

const OPCOES_RECORTE: {
  chave: RecorteChecagem;
  rotulo: string;
  desc?: string;
  icone?: boolean;
}[] = [
  { chave: "todas", rotulo: "Toda a campanha" },
  {
    chave: "debate_band",
    rotulo: "Debate da Band (18/10)",
    desc: checagem.debate_band.desc,
    icone: true,
  },
  {
    chave: "debate_globo",
    rotulo: "Debate da Globo (23/10)",
    desc: checagem.debate_globo.desc,
    icone: true,
  },
];

export default function SecaoChecagem() {
  const [recorte, setRecorte] = useState<RecorteChecagem>("todas");

  const candidatos = checagem.candidatos;
  const totalAfirmações = candidatos.reduce((s, c) => s + afirmacoesRecorte(c, recorte).length, 0);
  const totalFalsasRecorte = candidatos.reduce(
    (s, c) => s + totalFalsas(afirmacoesRecorte(c, recorte)),
    0,
  );
  const descAtual = OPCOES_RECORTE.find((o) => o.chave === recorte)?.desc;

  return (
    <section id="checagem" aria-label="Checagem de afirmações" className="mt-10 scroll-mt-40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50 text-balance">
            <SearchCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Checagem de afirmações
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            O que cada finalista disse na campanha de {checagem.periodo} e o que dizem os fatos verificados.
            Cada declaração foi confrontada com checagens publicadas por agências profissionais e recebeu um
            veredito com link da verificação original. Atualizado em{" "}
            {checagem.atualizado_em.split("-").reverse().join("/")}.
          </p>
        </div>
        <div
          className="inline-flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
          role="group"
          aria-label="Recorte das afirmações"
        >
          {OPCOES_RECORTE.map((o) => (
            <button
              key={o.chave}
              type="button"
              onClick={() => setRecorte(o.chave)}
              aria-pressed={recorte === o.chave}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none ${
                recorte === o.chave
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {o.icone &&
                (o.chave === "debate_globo" ? (
                  <Tv className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Film className="h-3.5 w-3.5" aria-hidden />
                ))}
              {o.rotulo}
            </button>
          ))}
        </div>
      </div>

      {descAtual && (
        <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900 text-pretty">
          {descAtual}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
        Neste recorte: {totalAfirmações} {totalAfirmações === 1 ? "afirmação checada" : "afirmações checadas"},{" "}
        <strong className="font-semibold text-rose-600 dark:text-rose-400">
          {totalFalsasRecorte} {totalFalsasRecorte === 1 ? "delas falsa" : "delas falsas"}
        </strong>{" "}
        entre os quatro finalistas.
      </p>

      {/* Resumo por candidato */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {candidatos.map((c) => {
          const lista = afirmacoesRecorte(c, recorte);
          const falsas = totalFalsas(lista);
          const checadas = lista.length;
          return (
            <div
              key={c.slug}
              className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800"
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                <Image
                  src={c.foto}
                  alt={`Foto de ${c.nome_urna}`}
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{c.nome_urna}</p>
                <p className="text-[0.6875rem] leading-tight text-muted-foreground">
                  {checadas} {checadas === 1 ? "afirmação checada" : "afirmações checadas"}
                </p>
              </div>
              <p
                className={`shrink-0 text-2xl font-bold leading-none ${
                  falsas > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
                title={`${falsas} afirmações falsas`}
              >
                {falsas}
              </p>
            </div>
          );
        })}
      </div>

      {/* Fichas completas por candidato */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {candidatos.map((c) => (
          <CardCandidato key={c.slug} c={c} recorte={recorte} />
        ))}
      </div>

      {/* Metodologia e legenda */}
      <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-zinc-100 dark:bg-card dark:ring-zinc-800">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          <ListChecks className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
          Como a contagem funciona
        </h3>
        <div className="mt-2 space-y-2">
          {checagem.metodologia.map((m, i) => (
            <p key={i} className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
              {m}
            </p>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {ORDEM_VEREDITOS.map((v) => (
            <p key={v} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <ChipVeredito v={v} pequeno />
              <span className="min-w-0 flex-1 text-pretty">{VEREDITO_INFO[v].desc}</span>
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 text-pretty">
          Agências de checagem consultadas:{" "}
          {checagem.agencias.map((a, i) => (
            <span key={a.nome}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {a.nome}
              </a>
              {i < checagem.agencias.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
