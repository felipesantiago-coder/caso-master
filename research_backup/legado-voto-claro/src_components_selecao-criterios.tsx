"use client";

import { useState } from "react";
import {
  Briefcase,
  Bus,
  Check,
  Cpu,
  Eye,
  Gavel,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  HeartHandshake,
  Landmark,
  Scale,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trees,
  TrendingUp,
  Vote,
  Wallet,
} from "lucide-react";
import {
  APLICAVEIS_DF,
  APLICAVEIS_PRESIDENTE,
  CHAVES_SUGESTAO,
  CRITERIOS,
  NOMES_GRAU,
  grauDe,
  pesosGraus,
  type ChaveCriterio,
  type EscolhaCriterios,
  type GrauImportancia,
} from "@/lib/analise";
import { ThemeToggle } from "@/components/theme-toggle";

const ICONES: Record<ChaveCriterio, React.ElementType> = {
  transparencia: Eye,
  desenvolvimento: TrendingUp,
  honestidade: Scale,
  ambiental: Trees,
  soberania: ShieldCheck,
  tecnologia: Cpu,
  democracia: Gavel,
  gestao: Briefcase,
  fiscal: Wallet,
  social: HeartHandshake,
  mobilidade: Bus,
  saude: HeartPulse,
  educacao: GraduationCap,
  seguranca: Shield,
  emprego: HandCoins,
  moradia: Home,
};

const GRAUS: GrauImportancia[] = [2, 1, 0];

const pct = (p: number) => {
  const v = Math.round(p * 1000) / 10;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",")) + "%";
};

const pl = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

const abrangencia = (chave: ChaveCriterio): string =>
  chave === "soberania" || chave === "tecnologia"
    ? "Avalia somente o Presidente"
    : chave === "mobilidade"
      ? "Avalia o Governador do DF"
      : "Avalia todos os cargos";

const ANEL_GRAU: Record<GrauImportancia, string> = {
  2: "ring-2 ring-emerald-500 dark:ring-emerald-500",
  1: "ring-1 ring-emerald-300 dark:ring-emerald-700",
  0: "ring-zinc-100 dark:ring-zinc-800",
};

interface Props {
  valor: EscolhaCriterios;
  aoConfirmar: (escolha: EscolhaCriterios) => void;
  aoCancelar?: () => void;
}

export default function SelecaoCriterios({ valor, aoConfirmar, aoCancelar }: Props) {
  const [escolha, setEscolha] = useState<EscolhaCriterios>(valor);

  const definir = (chave: ChaveCriterio, grau: GrauImportancia) =>
    setEscolha((atual) => ({ ...atual, [chave]: grau }));

  const usarSugestao = () => {
    const nova: EscolhaCriterios = {};
    for (const c of CRITERIOS) {
      nova[c.chave] = CHAVES_SUGESTAO.includes(c.chave) ? 2 : 1;
    }
    setEscolha(nova);
  };

  const total = (grau: GrauImportancia, chaves: ChaveCriterio[]) =>
    chaves.filter((c) => grauDe(escolha, c) === grau).length;

  const eTotal = total(2, CRITERIOS.map((c) => c.chave));
  const mTotal = total(1, CRITERIOS.map((c) => c.chave));
  const iTotais = CRITERIOS.length - eTotal - mTotal;

  const ePres = total(2, APLICAVEIS_PRESIDENTE);
  const mPres = total(1, APLICAVEIS_PRESIDENTE);
  const gPres = pesosGraus(ePres, mPres, APLICAVEIS_PRESIDENTE.length - ePres - mPres);
  const eDf = total(2, APLICAVEIS_DF);
  const mDf = total(1, APLICAVEIS_DF);
  const gDf = pesosGraus(eDf, mDf, APLICAVEIS_DF.length - eDf - mDf);

  const nomesDe = (grau: GrauImportancia, chaves: ChaveCriterio[]) =>
    chaves
      .filter((c) => grauDe(escolha, c) === grau)
      .map((c) => CRITERIOS.find((x) => x.chave === c)!.curto.toLowerCase());

  const resumoAbrangencia = (
    titulo: string,
    chaves: ChaveCriterio[],
    g: { essencial: number; importante: number; irrelevante: number },
  ) => {
    const e = nomesDe(2, chaves);
    const m = nomesDe(1, chaves);
    const qtdE = chaves.filter((c) => grauDe(escolha, c) === 2).length;
    const qtdM = chaves.filter((c) => grauDe(escolha, c) === 1).length;
    const qtdI = chaves.length - qtdE - qtdM;
    const soIrrelevantes = qtdE === 0 && qtdM === 0;
    const umComPeso = [qtdE, qtdM].filter((q) => q > 0).length === 1;
    const pesoUnico = qtdE > 0 ? g.essencial : g.importante;
    return (
      <div className="rounded-2xl bg-white/70 p-3.5 dark:bg-zinc-900/60">
        <p className="font-semibold">{titulo}</p>
        <p className="mt-1">
          Essenciais: {e.length > 0 ? e.join(", ") : "nenhum"}
        </p>
        <p className="mt-1">
          Importantes: {m.length > 0 ? m.join(", ") : "nenhum"}
        </p>
        <p className="mt-1">
          {soIrrelevantes
            ? "Com todos os critérios irrelevantes, a régua pesa todos igualmente para o ranking seguir possível"
            : umComPeso
              ? `Com um só grau com peso, todos os critérios com peso valem ${pct(pesoUnico)}`
              : `Pesos: ${pct(g.essencial)} cada essencial, ${pct(g.importante)} cada importante`
                + (qtdI > 0 ? "; irrelevante fica de fora do cálculo" : "")}
        </p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft">
              <Vote className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                Voto Claro
              </p>
              <p className="hidden min-[400px]:block truncate text-[0.75rem] leading-tight text-muted-foreground">
                Sua régua, seus critérios
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-40">
        {/* Hero */}
        <section className="pt-7 sm:pt-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Antes do ranking, a sua escolha
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 text-balance sm:text-3xl">
            Quais critérios são <span className="text-emerald-600 dark:text-emerald-400">mais importantes</span> para você?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            Para cada critério, escolha um dos três graus:{" "}
            <strong className="font-semibold text-zinc-700 dark:text-zinc-200">essencial</strong>,{" "}
            <strong className="font-semibold text-zinc-700 dark:text-zinc-200">importante</strong> ou{" "}
            <strong className="font-semibold text-zinc-700 dark:text-zinc-200">irrelevante</strong>. O peso segue o
            grau: cada critério essencial pesa 3 vezes um critério importante, e critérios irrelevantes ficam de fora
            do cálculo; os critérios com peso somam 100% no total de cada cargo. O Voto Claro não impõe valores: a
            classificação de todos os cargos segue a régua que você montar aqui, respeitando os critérios aplicáveis
            a cada disputa. No 2º turno de 25/10/2026 estão em jogo dois cargos: Presidente da República
            e Governador do Distrito Federal; o ranking cobre os 2 finalistas de cada um.
          </p>
        </section>

        {/* Cartões de critérios */}
        <section className="mt-6" aria-label="Escolha dos critérios">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CRITERIOS.map((c) => {
              const Icone = ICONES[c.chave];
              const grau = grauDe(escolha, c.chave);
              return (
                <div
                  key={c.chave}
                  className={`rounded-3xl bg-white dark:bg-card p-4 shadow-soft ring-1 transition-colors ${ANEL_GRAU[grau]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                        <Icone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </span>
                      <span className="leading-tight">{c.curto}</span>
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${
                        grau === 2
                          ? "bg-emerald-600 text-white"
                          : grau === 1
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {NOMES_GRAU[grau].um}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {c.descricao}
                  </p>
                  <details className="group mt-1.5">
                    <summary className="cursor-pointer list-none text-[0.6875rem] font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                      Como avaliamos ▾
                    </summary>
                    <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                      {c.medicao}
                    </p>
                  </details>
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-600 dark:text-zinc-400">
                    {abrangencia(c.chave)}
                  </p>
                  <div
                    role="group"
                    aria-label={`Grau de importância do critério ${c.curto} na sua régua`}
                    className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800"
                  >
                    {GRAUS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => definir(c.chave, g)}
                        aria-pressed={grau === g}
                        className={`rounded-xl px-1.5 py-1.5 text-[0.6875rem] font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          grau === g
                            ? g === 2
                              ? "bg-emerald-600 text-white shadow-sm"
                              : g === 1
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-white text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        }`}
                      >
                        {g === 2 ? "Essencial" : g === 1 ? "Importante" : "Irrelevante"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Resumo da régua escolhida */}
        <section className="mt-6 rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900" aria-live="polite">
          <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            Sua régua até agora:{" "}
            {eTotal === 0 && mTotal === 0
              ? `todos os ${CRITERIOS.length} critérios no grau irrelevante`
              : `${eTotal} ${pl(eTotal, "essencial", "essenciais")} e ${mTotal} ${pl(mTotal, "importante", "importantes")} de ${CRITERIOS.length} critérios`}
          </h2>
          <div className="mt-3 grid gap-3 text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 sm:grid-cols-2">
            {resumoAbrangencia(
              `No Presidente (${APLICAVEIS_PRESIDENTE.length} critérios)`,
              APLICAVEIS_PRESIDENTE,
              gPres,
            )}
            {resumoAbrangencia(
              `No Governador do DF (${APLICAVEIS_DF.length} critérios)`,
              APLICAVEIS_DF,
              gDf,
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            A defesa dos interesses nacionais e a fronteira tecnológica avaliam somente o Presidente; a mobilidade
            avalia somente o Governador do DF. A régua é aplicada aos candidatos aptos de cada cargo.
          </p>
        </section>
      </main>

      {/* Barra de confirmação */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-semibold text-zinc-900 dark:text-zinc-50">
              {eTotal} {pl(eTotal, "essencial", "essenciais")} · {mTotal}{" "}
              {pl(mTotal, "importante", "importantes")} · {iTotais}{" "}
              {pl(iTotais, "irrelevante", "irrelevantes")}
            </p>
            <p className="text-[0.6875rem] leading-tight text-muted-foreground">
              Você pode alterar essa escolha a qualquer momento no ranking.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {aoCancelar && (
              <button
                type="button"
                onClick={aoCancelar}
                className="rounded-full px-4 py-2.5 text-[0.8125rem] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={usarSugestao}
              className="rounded-full bg-white dark:bg-card px-4 py-2.5 text-[0.8125rem] font-semibold text-emerald-700 shadow-soft ring-1 ring-zinc-100 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:text-emerald-400 dark:ring-zinc-800 dark:hover:bg-emerald-950/40"
            >
              Usar sugestão da redação
            </button>
            <button
              type="button"
              onClick={() => aoConfirmar(escolha)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-[0.8125rem] font-bold text-white shadow-soft transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <Check className="h-4 w-4" aria-hidden />
              Ver meu ranking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
