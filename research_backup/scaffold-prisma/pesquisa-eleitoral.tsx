"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Check,
  EyeOff,
  Info,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { dados, formatPct, iniciais, type Candidato } from "@/lib/analise";
import { CHAVE_PARTICIPOU, impressaoEleitor } from "@/lib/pesquisa-cliente";

/* ------------------------------------------------------------------ */
/* Pesquisa eleitoral: urna anônima com um voto por pessoa em cada     */
/* cargo, seguida dos resultados agregados.                            */
/* ------------------------------------------------------------------ */

const BRANCO = "__branco";
const INTERVALO_ATUALIZACAO_MS = 45_000;

interface ResultadoItem {
  slug: string;
  votos: number;
}

interface ResultadoCargo {
  cargo: string;
  titulo: string;
  total: number;
  candidatos: ResultadoItem[];
}

interface ResultadosPesquisa {
  participantes: number;
  resultados: ResultadoCargo[];
  geradoEm: string;
}

const rotuloCurto = (titulo: string) =>
  titulo
    .replace(" da República", "")
    .replace(" do Distrito Federal", "")
    .replace(/\s*\(\d+ vagas?\)/, "");

export default function PesquisaEleitoral() {
  const cargos = dados.cargos;

  const [fase, setFase] = useState<"urna" | "resultado">("urna");
  const [enviando, setEnviando] = useState(false);
  const [jaVotou, setJaVotou] = useState(false);
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const [resultados, setResultados] = useState<ResultadosPesquisa | null>(null);
  const [erroResultados, setErroResultados] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [isca, setIsca] = useState("");

  const montadoEm = useRef(Date.now());

  // Mapa cargo → dados de exibição por slug (inclui o voto em branco).
  const catalogo = useMemo(() => {
    const mapa = new Map<string, Map<string, Candidato | null>>();
    for (const cargo of cargos) {
      const interno = new Map<string, Candidato | null>();
      for (const cand of cargo.candidatos) interno.set(cand.slug, cand);
      interno.set(BRANCO, null);
      mapa.set(cargo.cargo, interno);
    }
    return mapa;
  }, [cargos]);

  const carregarResultados = useCallback(async () => {
    try {
      const res = await fetch("/api/pesquisa/resultados", { cache: "no-store" });
      if (!res.ok) throw new Error("resposta com erro");
      const json = (await res.json()) as ResultadosPesquisa;
      setResultados(json);
      setErroResultados(false);
    } catch {
      setErroResultados(true);
    }
  }, []);

  // Participou em visita anterior? Vai direto aos resultados.
  useEffect(() => {
    let participou = false;
    try {
      participou = localStorage.getItem(CHAVE_PARTICIPOU) !== null;
    } catch {
      /* armazenamento indisponível */
    }
    if (participou) {
      setJaVotou(true);
      setFase("resultado");
      void carregarResultados();
    }
  }, [carregarResultados]);

  // Atualização periódica dos resultados enquanto a seção está visível.
  useEffect(() => {
    if (fase !== "resultado") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void carregarResultados();
    }, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(id);
  }, [fase, carregarResultados]);

  const escolher = (cargo: string, slug: string) =>
    setSelecoes((atual) => ({ ...atual, [cargo]: slug }));

  const cedulaCompleta = cargos.every(
    (c) => selecoes[c.cargo] !== undefined,
  );

  const enviar = async () => {
    if (!cedulaCompleta || enviando) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const impressao = await impressaoEleitor();
      const res = await fetch("/api/pesquisa/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escolhas: cargos.map((c) => ({
            cargo: c.cargo,
            candidato: selecoes[c.cargo],
          })),
          impressao,
          decorridoMs: Date.now() - montadoEm.current,
          isca,
        }),
      });
      if (res.status === 201 || res.status === 409) {
        try {
          localStorage.setItem(CHAVE_PARTICIPOU, new Date().toISOString());
        } catch {
          /* sem persistência: o servidor continua recusando o 2º voto */
        }
        setJaVotou(true);
        await carregarResultados();
        setFase("resultado");
      } else if (res.status === 429) {
        setErroEnvio(
          "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar de novo.",
        );
      } else {
        setErroEnvio(
          "Não foi possível registrar seu voto agora. Verifique sua conexão e tente novamente.",
        );
      }
    } catch {
      setErroEnvio(
        "Não foi possível registrar seu voto agora. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const nomeDe = (cargo: string, slug: string): string => {
    if (slug === BRANCO) return "Voto em branco";
    const cand = catalogo.get(cargo)?.get(slug);
    return cand?.nome_urna ?? slug;
  };

  const subtituloDe = (cargo: string, slug: string): string => {
    if (slug === BRANCO) return "Nenhum dos finalistas";
    const cand = catalogo.get(cargo)?.get(slug);
    return cand ? `${cand.partido} · ${cand.numero}` : "";
  };

  return (
    <section
      id="pesquisa"
      aria-label="Pesquisa eleitoral"
      className="mt-10 scroll-mt-40"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 text-balance">
          Pesquisa Voto Claro: em quem você vota no 2º turno?
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
        Uma urna anônima para os cargos ainda em disputa em 25/10/2026. Sem
        login, sem e-mail, sem CPF: você responde uma vez e acompanha os
        resultados agregados dos demais participantes.
      </p>

      {fase === "urna" ? (
        <div className="mt-4">
          {/* Como protegemos o anonimato e o voto único */}
          <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900 sm:p-5">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div className="flex min-w-[240px] flex-1 items-start gap-2.5">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                <p className="text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                  <strong className="font-semibold">Anônimo de verdade.</strong>{" "}
                  Não pedimos nenhum dado pessoal e os votos ficam guardados
                  separados de qualquer identificador: nem nós conseguimos ligar
                  um voto a uma pessoa.
                </p>
              </div>
              <div className="flex min-w-[240px] flex-1 items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                <p className="text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                  <strong className="font-semibold">Um voto por pessoa.</strong>{" "}
                  O servidor combina pistas não-identificáveis (perfil do
                  navegador e da rede) numa assinatura criptográfica de mão
                  única para recusar voto repetido.
                </p>
              </div>
              <div className="flex min-w-[240px] flex-1 items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                <p className="text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                  <strong className="font-semibold">Transparência honesta.</strong>{" "}
                  Sem identificação oficial é impossível garantir 100%; montamos
                  várias barreiras independentes para tornar o voto repetido
                  difícil e custoso.
                </p>
              </div>
            </div>
          </div>

          {/* Urna: uma escolha por cargo */}
          <div className="mt-4 grid gap-4">
            {cargos.map((cargo) => (
              <fieldset
                key={cargo.cargo}
                className="rounded-3xl bg-white dark:bg-card p-4 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 sm:p-5"
              >
                <legend className="sr-only">
                  Escolha um candidato para {rotuloCurto(cargo.titulo)}
                </legend>
                <p
                  className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                  aria-hidden
                >
                  {rotuloCurto(cargo.titulo)}
                  <span className="ml-2 font-normal text-muted-foreground">
                    escolha 1 opção
                  </span>
                </p>
                <div
                  className="mt-3 grid gap-2.5 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label={`Candidatos a ${rotuloCurto(cargo.titulo)}`}
                >
                  {cargo.candidatos.map((cand) => {
                    const ativo = selecoes[cargo.cargo] === cand.slug;
                    return (
                      <label
                        key={cand.slug}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 motion-reduce:transition-none ${
                          ativo
                            ? "bg-emerald-50 ring-emerald-400 dark:bg-emerald-950/60 dark:ring-emerald-500"
                            : "bg-white ring-zinc-100 hover:bg-zinc-50 dark:bg-transparent dark:ring-zinc-800 dark:hover:bg-zinc-900/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pesquisa-${cargo.cargo}`}
                          value={cand.slug}
                          checked={ativo}
                          onChange={() => escolher(cargo.cargo, cand.slug)}
                          className="sr-only"
                        />
                        {cand.foto_url ? (
                          <Image
                            src={cand.foto_url}
                            alt={`Foto de ${cand.nome_urna}`}
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {iniciais(cand.nome_urna)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {cand.nome_urna}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {cand.partido} · {cand.numero}
                          </span>
                        </span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${
                            ativo
                              ? "bg-emerald-600 text-white ring-emerald-600"
                              : "bg-white text-transparent ring-zinc-200 dark:bg-transparent dark:ring-zinc-700"
                          }`}
                          aria-hidden
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </label>
                    );
                  })}
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 motion-reduce:transition-none ${
                      selecoes[cargo.cargo] === BRANCO
                        ? "bg-emerald-50 ring-emerald-400 dark:bg-emerald-950/60 dark:ring-emerald-500"
                        : "bg-white ring-zinc-100 hover:bg-zinc-50 dark:bg-transparent dark:ring-zinc-800 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`pesquisa-${cargo.cargo}`}
                      value={BRANCO}
                      checked={selecoes[cargo.cargo] === BRANCO}
                      onChange={() => escolher(cargo.cargo, BRANCO)}
                      className="sr-only"
                    />
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Voto em branco
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Nenhum dos finalistas
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${
                        selecoes[cargo.cargo] === BRANCO
                          ? "bg-emerald-600 text-white ring-emerald-600"
                          : "bg-white text-transparent ring-zinc-200 dark:bg-transparent dark:ring-zinc-700"
                      }`}
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </label>
                </div>
              </fieldset>
            ))}
          </div>

          {erroEnvio && (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900"
            >
              {erroEnvio}
            </p>
          )}

          {/* Isca contra robôs: invisível para pessoas; preenchimento por
              máquinas descarta a cédula. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Não preencha este campo
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={isca}
                onChange={(e) => setIsca(e.target.value)}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!cedulaCompleta || enviando}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900 sm:w-auto sm:px-8"
          >
            {enviando ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                Registrando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Registrar meu voto
              </>
            )}
          </button>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Ao registrar, você responde a todos os cargos da cédula uma única
            vez. Não há como editar depois — como na urna.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {jaVotou && (
            <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900">
              <p className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {resultados ? (
                  <>
                    <span>
                      <strong className="font-semibold">Seu voto está registrado.</strong>{" "}
                      Esta é a soma dos votos de todos os participantes, sem
                      nenhum dado individual. Obrigado por participar!
                    </span>
                  </>
                ) : (
                  <span>Seu voto está registrado. Carregando resultados...</span>
                )}
              </p>
            </div>
          )}

          {erroResultados && (
            <p
              role="alert"
              className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900"
            >
              Não foi possível carregar os resultados agora. Tente atualizar em
              instantes.
            </p>
          )}

          {resultados && (
            <>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {resultados.participantes}
                  </strong>{" "}
                  {resultados.participantes === 1
                    ? "participante até agora"
                    : "participantes até agora"}
                </p>
                <button
                  type="button"
                  onClick={() => void carregarResultados()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:hover:bg-emerald-950/40"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Atualizar
                </button>
              </div>

              <div className="mt-3 grid gap-4">
                {resultados.resultados.map((r) => (
                  <div
                    key={r.cargo}
                    className="rounded-3xl bg-white dark:bg-card p-4 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 sm:p-5"
                  >
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {rotuloCurto(r.titulo)}
                    </p>
                    {r.total === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ainda sem votos registrados neste cargo.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-3">
                        {r.candidatos.map((item) => {
                          const pct = item.votos / r.total;
                          const branco = item.slug === BRANCO;
                          return (
                            <div key={item.slug}>
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="min-w-0 truncate text-[0.8125rem] font-medium text-zinc-800 dark:text-zinc-200">
                                  {nomeDe(r.cargo, item.slug)}
                                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    {subtituloDe(r.cargo, item.slug)}
                                  </span>
                                </p>
                                <p className="shrink-0 text-[0.8125rem] font-bold text-zinc-900 dark:text-zinc-50">
                                  {formatPct(pct)}
                                  <span className="ml-1.5 font-normal text-muted-foreground">
                                    ({item.votos}
                                    {item.votos === 1 ? " voto" : " votos"})
                                  </span>
                                </p>
                              </div>
                              <div
                                className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                                role="meter"
                                aria-valuenow={Math.round(pct * 100)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${nomeDe(r.cargo, item.slug)}: ${formatPct(pct)}`}
                              >
                                <div
                                  className={`h-full rounded-full ${
                                    branco
                                      ? "bg-zinc-400 dark:bg-zinc-600"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.max(pct * 100, item.votos > 0 ? 2 : 0)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Atualizado automaticamente a cada 45 segundos.
              </p>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
        Pesquisa de intenção de voto sem valor oficial e não probabilística:
        participam visitantes deste guia que decidiram responder, então os
        resultados não representam a opinião do eleitorado. A apuração oficial
        é do TSE (resultados.tse.jus.br).
      </p>
    </section>
  );
}
