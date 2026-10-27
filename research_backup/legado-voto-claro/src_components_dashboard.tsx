"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  FileText,
  Scale,
  Landmark,
  Users,
  Vote,
  Trees,
  ShieldCheck,
  Cpu,
  Eye,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ArrowUp,
  MapPin,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Award,
  ListOrdered,
  BadgeCheck,
  Gavel,
  Briefcase,
  Wallet,
  HeartHandshake,
  Bus,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Shield,
  Info,
} from "lucide-react";
import {
  APLICAVEIS_DF,
  APLICAVEIS_PRESIDENTE,
  CRITERIOS,
  NIVEL_INFO,
  chavesAplicaveis,
  corNota,
  criteriosDoCargo,
  dados,
  fichaDeApto,
  formatPct,
  grauDe,
  iniciais,
  NOMES_GRAU,
  notaTriagemCargo,
  POLITICA_HISTORICO,
  pontuaCargo,
  pesosPersonalizados,
  pesosGraus,
  type Apto,
  type Candidato,
  type Cargo,
  type ChaveCriterio,
  type EscolhaCriterios,
  type Nivel,
  type PosicaoApto,
} from "@/lib/analise";
import { ThemeToggle } from "@/components/theme-toggle";
import SecaoChecagem from "@/components/checagem";
import SecaoPropostas from "@/components/propostas";

const ICONES_CRITERIO: Record<ChaveCriterio, React.ElementType> = {
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

const ICONE_CARGO: Record<string, React.ElementType> = {
  presidente: Landmark,
  governador: Vote,
  senador: Scale,
  dep_federal: Users,
  dep_distrital: BookOpen,
};

// Tiles pastel por cargo, no estilo das categorias do DocSpot
const PASTEL_CARGO: Record<string, string> = {
  presidente: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  governador: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  senador: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  dep_federal: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  dep_distrital: "bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300",
};

// Escala de notas com rótulo textual (não depende apenas de cor: acessível
// para daltônicos, seguindo a prática de guias eleitorais como o Wahl-O-Mat).
const FAIXAS_NOTA = [
  {
    min: 8,
    label: "Alta",
    faixa: "8 a 10",
    barra: "bg-emerald-500",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    min: 6,
    label: "Boa",
    faixa: "6 a 8",
    barra: "bg-lime-500",
    dot: "bg-lime-500",
    chip: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  },
  {
    min: 4,
    label: "Média",
    faixa: "4 a 6",
    barra: "bg-amber-500",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    min: 0,
    label: "Baixa",
    faixa: "0 a 4",
    barra: "bg-rose-500",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
];

const barraNota = (n: number) => FAIXAS_NOTA.find((f) => n >= f.min)!.barra;
const faixaDe = (n: number) => FAIXAS_NOTA.find((f) => n >= f.min)!;

// Formato decimal brasileiro (vírgula) para todas as notas exibidas
const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

// Nível de evidência predominante entre os critérios do cargo. Em caso de empate
// prevalece o nível mais fraco, por transparência com o eleitor.
const nivelPredominante = (cand: Candidato): Nivel => {
  const contagem: Record<Nivel, number> = { A: 0, B: 0, C: 0 };
  for (const c of CRITERIOS) {
    const cr = cand.criterios[c.chave];
    if (cr) contagem[cr.nivel] += 1;
  }
  let nivel: Nivel = "A";
  let max = 0;
  (["A", "B", "C"] as Nivel[]).forEach((n) => {
    if (contagem[n] >= max) {
      max = contagem[n];
      nivel = n;
    }
  });
  return nivel;
};

const rotuloCurto = (titulo: string) =>
  titulo
    .replace(" da República", "")
    .replace(" do Distrito Federal", "")
    .replace(/\s*\(\d+ vagas?\)/, "");

function Foto({ cand, size }: { cand: Candidato; size: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-24 w-24 text-2xl" : "h-14 w-14 text-sm";
  if (cand.foto_url) {
    return (
      <Image
        src={cand.foto_url}
        alt={`Foto de ${cand.nome_urna}`}
        width={size === "lg" ? 96 : 56}
        height={size === "lg" ? 96 : 56}
        className={`${cls} shrink-0 rounded-full object-cover ${
          size === "lg" ? "ring-4 ring-emerald-100 dark:ring-emerald-900" : "ring-2 ring-zinc-100 dark:ring-zinc-800"
        }`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ${
        size === "lg" ? "ring-4 ring-emerald-100 dark:ring-emerald-900" : "ring-2 ring-zinc-100 dark:ring-zinc-800"
      }`}
      aria-label={`Iniciais de ${cand.nome_urna}`}
    >
      {iniciais(cand.nome_urna)}
    </div>
  );
}

function BarraCriterio({
  chave,
  nota,
  semProposta,
}: {
  chave: ChaveCriterio;
  nota: number;
  semProposta?: boolean;
}) {
  const info = CRITERIOS.find((c) => c.chave === chave)!;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[0.8125rem] text-muted-foreground sm:w-36">
        {semProposta && (
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500 align-middle"
            aria-hidden
          />
        )}
        {info.curto}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${barraNota(nota)}`}
          style={{ width: `${nota * 10}%` }}
        />
      </div>
      <span className={`w-9 shrink-0 text-right text-xs font-semibold ${corNota(nota)}`}>
        {fmt(nota)}
      </span>
    </div>
  );
}

function LegendaNotas() {
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2"
      aria-label="Escala de notas"
    >
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Escala da nota:</span>
      {FAIXAS_NOTA.map((f) => (
        <span
          key={f.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-card px-2.5 py-1 text-[0.75rem] font-medium text-zinc-600 dark:text-zinc-400 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${f.dot}`} aria-hidden />
          {f.label} ({f.faixa})
        </span>
      ))}
      <a
        href="#metodologia"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-emerald-700 shadow-soft ring-1 ring-zinc-100 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:bg-card dark:text-emerald-400 dark:ring-zinc-800 dark:hover:bg-emerald-950/40"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        Como calculamos a nota
      </a>
    </div>
  );
}

function CardCandidato({ cand, cargo, onAbrir }: { cand: Candidato; cargo?: Cargo; onAbrir: () => void }) {
  const faixa = faixaDe(cand.score_total);
  return (
    <button
      onClick={onAbrir}
      className="group w-full rounded-3xl bg-white dark:bg-card p-4 text-left shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.995] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 sm:p-5"
      aria-label={`Ver análise de ${cand.nome_urna}, ${cand.ranking}º colocado`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold ${
            cand.ranking === 1
              ? "bg-emerald-600 text-white shadow-sm"
              : cand.ranking === 2
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
          aria-label={`${cand.ranking}º colocado`}
        >
          {cand.ranking}º
        </div>
        <Foto cand={cand} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-tight text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {cand.nome_urna}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="truncate">{cand.partido}</span>
            <span className="rounded-md border border-zinc-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-zinc-600 dark:text-zinc-400">
              Nº {cand.numero}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-2xl font-bold leading-none tracking-tight ${corNota(cand.score_total)}`}>
            {fmt(cand.score_total, 2)}
          </p>
          <p className="mt-1 text-[0.75rem] uppercase tracking-wide text-muted-foreground">de 10</p>
        </div>
      </div>
      <div className="mt-3.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${faixa.chip}`}
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Compatibilidade {faixa.label.toLowerCase()}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5">
        {criteriosDoCargo(cargo).map((c) => (
          <BarraCriterio
            key={c.chave}
            chave={c.chave}
            nota={cand.criterios[c.chave].nota}
            semProposta={cand.criterios[c.chave]?.sem_proposta}
          />
        ))}
        {criteriosDoCargo(cargo).some((c) => cand.criterios[c.chave]?.sem_proposta) && (
          <p className="mt-1 flex items-start gap-1.5 text-[0.75rem] leading-snug text-rose-700 dark:text-rose-300">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
            <span>
              Nota reduzida por ausência de proposta no plano de governo e de compromisso
              público. Veja o detalhe na ficha.
            </span>
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.75rem] font-medium text-zinc-500 dark:text-zinc-400">
          <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {cand.fontes.length > 0
            ? `${cand.fontes.length} fonte${cand.fontes.length === 1 ? "" : "s"} verificada${cand.fontes.length === 1 ? "" : "s"}`
            : "Ficha padrão, sem fontes específicas"}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Ver análise
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
        </span>
      </div>
    </button>
  );
}

function DetalheCandidato({
  cand,
  cargo,
  cargoTitulo,
  pesos,
}: {
  cand: Candidato;
  cargo?: Cargo;
  cargoTitulo: string;
  pesos: Record<ChaveCriterio, number>;
}) {
  const faixa = faixaDe(cand.score_total);
  return (
    <div>
      {/* Perfil centralizado, como a ficha do médico no DocSpot */}
      <div className="flex flex-col items-center text-center">
        <Foto cand={cand} size="lg" />
        <p className="mt-3 text-xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">{cand.nome_urna}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {cargoTitulo} · {cand.partido}
        </p>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 font-mono text-[0.75rem] font-semibold text-white">
            <Vote className="h-3 w-3" aria-hidden />
            Urna: {cand.numero}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${faixa.chip}`}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Compatibilidade {faixa.label.toLowerCase()}
          </span>
          {cand.vice && cand.vice !== "—" && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[0.75rem] font-medium text-zinc-700 dark:text-zinc-300">
              Vice: {cand.vice}
            </span>
          )}
        </div>
      </div>

      {/* Linha de estatísticas (nota, posição, evidência) */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 px-2 py-3 text-center">
          <p aria-hidden className={`text-lg font-bold leading-none ${corNota(cand.score_total)}`}>
            {fmt(cand.score_total, 2)}
          </p>
          <p className="mt-1 text-[0.75rem] leading-tight text-muted-foreground">
            Nota geral de 10<span className="sr-only">: {fmt(cand.score_total, 2)}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 px-2 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-lg font-bold leading-none text-zinc-900 dark:text-zinc-50">
            <ListOrdered className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            {cand.ranking}º
          </p>
          <p className="mt-1 text-[0.75rem] leading-tight text-muted-foreground">
            Posição no cargo
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 px-2 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-bold leading-none text-zinc-900 dark:text-zinc-50">
            <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Nível {nivelPredominante(cand)}
          </p>
          <p className="mt-1 text-[0.75rem] leading-tight text-muted-foreground">
            Evidência predominante
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-4 text-[0.9375rem] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {cand.resumo}
      </div>

      {/* Política de notas sem histórico: transparência sobre por que uma nota
          pode ser baixa (ausência de proposta/compromisso) e por que a falta
          de histórico NÃO rebaixa nota. */}
      <div className="mt-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100 dark:bg-sky-950/50 dark:ring-sky-900">
        <p className="flex items-start gap-2 text-[0.875rem] leading-relaxed text-sky-900 dark:text-sky-200 text-pretty">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">{POLITICA_HISTORICO.titulo}:</strong>{" "}
            {POLITICA_HISTORICO.ficha}
          </span>
        </p>
      </div>

      {/* Notas por critério */}
      <h3 className="mt-6 flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        Notas por critério
      </h3>
      <div className="mt-3 grid gap-2.5">
        {criteriosDoCargo(cargo).map((c) => {
          const cr = cand.criterios[c.chave];
          const Icone = ICONES_CRITERIO[c.chave];
          const niv = NIVEL_INFO[cr.nivel];
          return (
            <div key={c.chave} className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-card shadow-sm">
                    <Icone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </span>
                  <span className="leading-tight">{c.nome}</span>
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[0.75rem] text-muted-foreground">
                    {formatPct(pesos[c.chave])}
                  </span>
                  <span className={`text-sm font-bold ${corNota(cr.nota)}`}>{fmt(cr.nota)}</span>
                </div>
              </div>
              <div className="mt-2.5 ml-0 sm:ml-[46px]">
                <div className="h-1.5 overflow-hidden rounded-full bg-white dark:bg-card">
                  <div
                    className={`h-full rounded-full ${barraNota(cr.nota)}`}
                    style={{ width: `${cr.nota * 10}%` }}
                  />
                </div>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-zinc-600 dark:text-zinc-400">{cr.texto}</p>
                <div className="mt-2 flex flex-col items-start gap-1.5">
                  <span
                    className={`inline-flex whitespace-normal rounded-2xl px-2.5 py-1 text-[0.75rem] leading-relaxed ${niv.cor}`}
                  >
                    {niv.label}: {niv.desc}
                  </span>
                  {cr.proposta_outro_cargo && (
                    <span className="block rounded-2xl bg-emerald-50 px-2.5 py-1 text-[0.75rem] leading-relaxed text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900">
                      <strong className="font-semibold">
                        {POLITICA_HISTORICO.seloPropostaOutroCargo}:{" "}
                      </strong>
                      {cr.proposta_outro_cargo}
                    </span>
                  )}
                  {cr.sem_proposta && (
                    <span className="inline-flex whitespace-normal rounded-2xl bg-rose-100 px-2.5 py-1 text-[0.75rem] font-semibold leading-relaxed text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:ring-rose-900">
                      {POLITICA_HISTORICO.seloSemProposta}
                    </span>
                  )}
                  {cr.sem_historico && (
                    <span className="inline-flex whitespace-normal rounded-2xl bg-sky-50 px-2.5 py-1 text-[0.75rem] leading-relaxed text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-900">
                      {POLITICA_HISTORICO.seloSemHistorico}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fontes */}
      {cand.fontes.length > 0 && (
        <>
          <h3 className="mt-6 flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            Fontes consultadas ({cand.fontes.length})
          </h3>
          <ul className="mt-3 grid gap-2">
            {cand.fontes.map((f, i) => (
              <li key={i}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-3 text-[0.9375rem] font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                >
                  <span className="leading-snug">{f.titulo}</span>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-[0.9375rem] leading-relaxed text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        Notas refletem aderência aos critérios aplicáveis ao cargo, definidos no documento de
        origem, não qualidade geral. Investigações sem condenação não equivalem a culpabilidade.
        Confirme a situação da candidatura no TSE antes de votar.
      </p>
    </div>
  );
}

export default function Dashboard({
  escolha,
  aoAbrirEscolha,
}: {
  escolha: EscolhaCriterios;
  aoAbrirEscolha: () => void;
}) {
  const [cargoAtivo, setCargoAtivo] = useState(dados.cargos[0].cargo);
  const [selecionado, setSelecionado] = useState<Candidato | null>(null);
  const [busca, setBusca] = useState("");
  const [noTopo, setNoTopo] = useState(true);
  const painelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setNoTopo(window.scrollY <= 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cargo = dados.cargos.find((c) => c.cargo === cargoAtivo)!;

  // Classificação recalculada para todos os cargos conforme a régua do usuário
  const avaliacoes = useMemo(() => {
    const mapa = new Map<string, { ranqueados: PosicaoApto[]; semFicha: Apto[]; fichas: Candidato[] }>();
    for (const c of dados.cargos) {
      const { ranqueados, semFicha } = pontuaCargo(c, escolha);
      mapa.set(c.cargo, {
        ranqueados,
        semFicha,
        fichas: ranqueados.slice(0, 5).map((p) => fichaDeApto(p, c)),
      });
    }
    return mapa;
  }, [escolha]);

  const aval = avaliacoes.get(cargo.cargo)!;
  const semFicha = aval.semFicha;
  const pesos = useMemo(() => pesosPersonalizados(cargo, escolha), [cargo, escolha]);
  const triagemNota = notaTriagemCargo(cargo, escolha);
  const chavesCargo = chavesAplicaveis(cargo);
  const eCargo = chavesCargo.filter((c) => grauDe(escolha, c) === 2).length;
  const mCargo = chavesCargo.filter((c) => grauDe(escolha, c) === 1).length;
  const todasChaves = CRITERIOS.map((c) => c.chave);
  const eTotal = todasChaves.filter((c) => grauDe(escolha, c) === 2).length;
  const mTotal = todasChaves.filter((c) => grauDe(escolha, c) === 1).length;
  const rTotal = todasChaves.length - eTotal - mTotal;
  const ePres = APLICAVEIS_PRESIDENTE.filter((c) => grauDe(escolha, c) === 2).length;
  const mPres = APLICAVEIS_PRESIDENTE.filter((c) => grauDe(escolha, c) === 1).length;
  const eDf = APLICAVEIS_DF.filter((c) => grauDe(escolha, c) === 2).length;
  const mDf = APLICAVEIS_DF.filter((c) => grauDe(escolha, c) === 1).length;
  const gPres = pesosGraus(ePres, mPres, APLICAVEIS_PRESIDENTE.length - ePres - mPres);
  const gDf = pesosGraus(eDf, mDf, APLICAVEIS_DF.length - eDf - mDf);
  // Frase com a contagem e os nomes dos critérios de cada grau mais alto
  const fraseGraus = (chaves: ChaveCriterio[]): string => {
    const curtoDe = (c: ChaveCriterio) => CRITERIOS.find((x) => x.chave === c)!.curto;
    const e = chaves.filter((c) => grauDe(escolha, c) === 2);
    const m = chaves.filter((c) => grauDe(escolha, c) === 1);
    if (e.length === chaves.length) return "todos os critérios como essenciais";
    const partes: string[] = [];
    if (e.length > 0) {
      partes.push(
        `${e.length} ${e.length === 1 ? "essencial" : "essenciais"}: ${e.map(curtoDe).join(", ").toLowerCase()}`,
      );
    }
    if (m.length > 0) {
      partes.push(
        `${m.length} ${m.length === 1 ? "importante" : "importantes"}: ${m.map(curtoDe).join(", ").toLowerCase()}`,
      );
    }
    return partes.length > 0 ? partes.join(" · ") : "nenhum critério essencial ou importante";
  };
  const papelPres = fraseGraus(APLICAVEIS_PRESIDENTE);
  const papelDf = fraseGraus(APLICAVEIS_DF);
  const frasePesosGraus = (
    g: { essencial: number; importante: number; irrelevante: number },
    qtd: { e: number; m: number; r: number },
  ): string => {
    if (qtd.e === 0 && qtd.m === 0) {
      return "com todos os critérios irrelevantes, a régua pesa todos igualmente";
    }
    const notaIrrelev = qtd.r > 0 ? "; irrelevantes ficam de fora do cálculo" : "";
    if (qtd.e === 0 || qtd.m === 0) {
      const peso = qtd.e > 0 ? g.essencial : g.importante;
      return `todos os critérios com peso pesam ${formatPct(peso)}${notaIrrelev}`;
    }
    return `pesam ${formatPct(g.essencial)} os essenciais e ${formatPct(g.importante)} os importantes${notaIrrelev}`;
  };
  const frasePesosPres = frasePesosGraus(gPres, {
    e: ePres,
    m: mPres,
    r: APLICAVEIS_PRESIDENTE.length - ePres - mPres,
  });
  const frasePesosDf = frasePesosGraus(gDf, {
    e: eDf,
    m: mDf,
    r: APLICAVEIS_DF.length - eDf - mDf,
  });
  const pesosPres = useMemo(
    () => pesosPersonalizados(dados.cargos.find((c) => c.cargo === "presidente"), escolha),
    [escolha],
  );
  const pesosDf = useMemo(
    () => pesosPersonalizados(dados.cargos.find((c) => c.cargo === "governador"), escolha),
    [escolha],
  );
  const rotuloPesoChip = (chave: ChaveCriterio): string => {
    const pres = APLICAVEIS_PRESIDENTE.includes(chave);
    const df = APLICAVEIS_DF.includes(chave);
    if (pres && df) return `Pres. ${formatPct(pesosPres[chave])} · DF ${formatPct(pesosDf[chave])}`;
    if (pres) return `Presidente: ${formatPct(pesosPres[chave])}`;
    return `Gov. DF: ${formatPct(pesosDf[chave])}`;
  };

  const classificacaoCompleta = aval.ranqueados.map((r) => ({
    pos: r.pos,
    nome_urna: r.apto.nome_urna,
    partido: r.apto.partido,
    numero: r.apto.numero,
    score_total: r.score,
    top: r.pos <= 5,
  }));

  const semFichaOrdenada = [...semFicha].sort((a, b) =>
    a.nome_urna.localeCompare(b.nome_urna, "pt-BR"),
  );

  const consulta = busca.trim().toLowerCase();
  const corresponde = (cand: Candidato) =>
    !consulta ||
    cand.nome_urna.toLowerCase().includes(consulta) ||
    cand.partido.toLowerCase().includes(consulta) ||
    cand.numero.includes(consulta);
  const candFiltrados = aval.fichas.filter(corresponde);
  const outrosComMatch = consulta
    ? dados.cargos
        .filter((cc) => cc.cargo !== cargoAtivo)
        .map((cc) => ({
          cargo: cc,
          total: (avaliacoes.get(cc.cargo)?.fichas ?? []).filter(corresponde).length,
        }))
        .filter((x) => x.total > 0)
    : [];

  const selecionarCargo = (novo: string) => {
    if (novo === cargoAtivo) return;
    setCargoAtivo(novo);
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      // Centraliza a categoria ativa na faixa rolável do mobile
      document
        .getElementById(`tab-${novo}`)
        ?.scrollIntoView({ block: "nearest", inline: "center", behavior: suave ? "smooth" : "auto" });
      // Se o usuário já rolou para baixo, traz o painel de volta para o topo visível.
      const el = painelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offsetCabecalho = 148;
      if (rect.top < offsetCabecalho || rect.top > window.innerHeight * 0.6) {
        window.scrollTo({
          top: rect.top + window.scrollY - offsetCabecalho,
          behavior: suave ? "smooth" : "auto",
        });
      }
    });
  };

  const navegarTabs = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const total = dados.cargos.length;
    const next = e.key === "ArrowRight" ? (idx + 1) % total : (idx - 1 + total) % total;
    const novo = dados.cargos[next].cargo;
    setCargoAtivo(novo);
    requestAnimationFrame(() => {
      document.getElementById(`tab-${novo}`)?.focus();
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho */}
      <header
        className={`sticky top-0 z-40 border-b bg-white dark:bg-card/85 backdrop-blur-md transition-all dark:bg-zinc-900/85 motion-reduce:transition-none ${
          noTopo ? "border-transparent" : "border-zinc-100 shadow-sm dark:border-zinc-800"
        }`}
      >
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
                Guia eleitoral do DF 2026
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1.5 text-[0.625rem] font-bold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900 sm:gap-1.5 sm:px-3 sm:text-[0.75rem]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              <span className="hidden sm:inline">25 OUT 2026</span>
              <span className="sm:hidden">25 OUT</span>
            </span>
            <ThemeToggle />
            <a
              href="/analise-eleitoral-df-2026.md"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir documento completo da análise"
              title="Documento completo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-card text-zinc-700 dark:text-zinc-300 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 transition-colors hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none"
            >
              <FileText className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10">
        {/* Saudação e hero */}
        <section className="pt-6 sm:pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Olá, eleitor</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-card px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800">
              <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Brasília, DF
            </span>
          </div>
          <h1 className="mt-2.5 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 text-balance sm:text-3xl">
            Ranking de compatibilidade <span className="text-emerald-600 dark:text-emerald-400">com os seus valores</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            Após o 1º turno de 04/10/2026, o segundo turno de 25/10/2026 decide dois cargos em Brasília:
            Presidente e Governador do DF. Aqui estão os 2 finalistas de cada disputa, os dois mais votados no
            1º turno (apuração do TSE), com notas de 0 a 10, níveis de evidência (A, B e C) e links das fontes
            consultadas de cada ficha; a régua que você escolher recalcula a ordem.
          </p>

          {/* Cartões de destaque: data da eleição e números do pleito */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Resumo da eleição">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lift">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white dark:bg-card/10" aria-hidden />
              <div className="absolute -bottom-10 -right-2 h-20 w-20 rounded-full bg-white dark:bg-card/10" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">
                Eleição 2026 · 2º turno
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight">25 OUT</p>
              <p className="mt-1 text-sm text-emerald-50">Domingo, das 8h às 17h</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["2", "cargos em disputa"],
                ["4", "finalistas (2 por cargo)"],
                ["643", "candidaturas avaliadas no 1º turno"],
                ["11", "critérios definidos"],
              ].map(([n, t]) => (
                <div
                  key={t}
                  className="rounded-3xl bg-white dark:bg-card p-3.5 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800"
                >
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{n}</p>
                  <p className="mt-0.5 text-[0.75rem] leading-tight text-muted-foreground">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Régua do usuário e atalho de edição */}
        <section
          aria-labelledby="titulo-regua"
          className="mt-5 rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="titulo-regua"
                className="flex items-center gap-1.5 text-sm font-bold text-emerald-900 dark:text-emerald-200"
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                Sua régua:{" "}
                {eTotal === 0 && mTotal === 0
                  ? `todos os ${CRITERIOS.length} critérios no grau irrelevante`
                  : `${eTotal} ${eTotal === 1 ? "essencial" : "essenciais"} e ${mTotal} ${
                      mTotal === 1 ? "importante" : "importantes"
                    } de ${CRITERIOS.length} critérios`}
              </h2>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                No Presidente, {papelPres}; {frasePesosPres}.
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
                No Governador do DF, {papelDf}; {frasePesosDf}.
              </p>
            </div>
            <button
              type="button"
              onClick={aoAbrirEscolha}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-[0.8125rem] font-bold text-white shadow-soft transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Editar minha régua
            </button>
          </div>
        </section>

        {/* Busca */}
        <section className="mt-5" aria-label="Buscar candidato">
          <label htmlFor="busca-candidato" className="sr-only">
            Buscar candidato por nome, partido ou número
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
            <input
              id="busca-candidato"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busque por nome, partido ou número"
              className="h-12 w-full rounded-full bg-white dark:bg-card pl-11 pr-12 text-[0.9375rem] text-zinc-900 dark:text-zinc-50 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </section>

        {/* Escolha do cargo: pílulas compactas no mobile, cartões no desktop */}
        <section className="mt-6" aria-labelledby="titulo-cargos">
          <h2 id="titulo-cargos" className="text-[1.0625rem] font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            Escolha o cargo
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Escolha um cargo para ver os 2 finalistas do 2º turno, ordenados pela sua régua.
          </p>
        </section>
          <nav
            aria-label="Cargos em disputa"
            className="sticky top-16 z-30 -mx-4 mt-3 border-b border-zinc-100/80 bg-background/95 px-4 pb-2 pt-2 backdrop-blur-md dark:border-zinc-800/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none"
          >
            <div className="relative">
              <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div
                  role="tablist"
                  aria-label="Selecionar cargo"
                  className="flex w-max items-center gap-2 sm:grid sm:w-full sm:grid-cols-2 sm:gap-2.5"
                >
                  {dados.cargos.map((c, i) => {
                    const Icone = ICONE_CARGO[c.cargo] ?? Vote;
                    const ativo = c.cargo === cargoAtivo;
                    const rotulo = rotuloCurto(c.titulo);
                    return (
                      <button
                        key={c.cargo}
                        id={`tab-${c.cargo}`}
                        role="tab"
                        aria-selected={ativo}
                        aria-controls={`painel-${c.cargo}`}
                        tabIndex={ativo ? 0 : -1}
                        onClick={() => selecionarCargo(c.cargo)}
                        onKeyDown={(e) => navegarTabs(e, i)}
                        className={`relative flex min-h-11 items-center gap-2 rounded-full py-2 pl-2.5 pr-3.5 text-left shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none sm:min-h-[5.5rem] sm:flex-col sm:items-start sm:gap-1 sm:rounded-3xl sm:p-3.5 ${
                          ativo
                            ? "bg-emerald-600 text-white ring-2 ring-emerald-600"
                            : "bg-white text-zinc-900 ring-1 ring-zinc-100 hover:ring-emerald-300 dark:bg-card dark:text-zinc-50 dark:ring-zinc-800 dark:hover:ring-emerald-700"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl ${
                            ativo
                              ? "bg-white/25 text-white"
                              : PASTEL_CARGO[c.cargo] ?? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                          aria-hidden
                        >
                          <Icone className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                        <span className="whitespace-nowrap text-[0.9375rem] font-bold leading-tight sm:whitespace-normal">
                          {rotulo}
                        </span>
                        {ativo && (
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-white sm:absolute sm:right-3 sm:top-3"
                            aria-hidden
                          />
                        )}
                        <span
                          className={`hidden text-[0.75rem] leading-tight sm:block ${
                            ativo ? "text-emerald-50" : "text-muted-foreground"
                          }`}
                        >
                          2 finalistas · {c.vagas} vaga{c.vagas > 1 ? "s" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Degradê lateral indica que há mais cargos fora da tela no mobile */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background via-background/70 to-transparent sm:hidden"
                aria-hidden
              />
            </div>
          </nav>

        {/* Aviso resumido */}
        <section
          aria-label="Aviso importante"
          className="mt-5 rounded-3xl bg-amber-50 p-4 text-[0.9375rem] leading-relaxed text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 sm:p-5"
        >
          <p className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" aria-hidden />
            </span>
            <span className="text-pretty">
              <strong className="font-semibold">Ferramenta de apoio, não recomendação de voto.</strong>{" "}
              Notas são juízos editoriais informados com fontes abertas; investigações sem condenação
              não provam culpa (presunção de inocência). Candidaturas podem mudar de situação até o
              dia da votação. Confirme no{" "}
              <a
                href="https://divulgacandcontas.tse.jus.br/divulga/#/candidatos"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-amber-400 underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
              >
                DivulgaCandContas
              </a>{" "}
              antes de votar.
            </span>
          </p>
        </section>

        {/* Conteúdo do cargo */}
        <section
          ref={painelRef}
          role="tabpanel"
          id={`painel-${cargo.cargo}`}
          aria-labelledby={`tab-${cargo.cargo}`}
          className="mt-6 scroll-mt-40"
        >
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty sm:text-sm">
            {cargo.intro}
          </p>

          <div className="mt-4">
            <LegendaNotas />
          </div>

          {consulta && candFiltrados.length > 0 && (
            <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400" role="status">
              Exibindo {candFiltrados.length} de {aval.fichas.length} candidatos para "
              {busca.trim()}"
            </p>
          )}

          {candFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {candFiltrados.map((cand) => (
                <CardCandidato
                  key={cand.numero + cand.nome_urna}
                  cand={cand}
                  cargo={cargo}
                  onAbrir={() => setSelecionado(cand)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white dark:bg-card p-6 text-center shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800">
              <SearchX className="mx-auto h-8 w-8 text-zinc-300" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Nenhum candidato em {rotuloCurto(cargo.titulo)} para "{busca.trim()}"
              </p>
              {outrosComMatch.length > 0 ? (
                <>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    A busca encontrou correspondências em outros cargos:
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {outrosComMatch.map(({ cargo: cc, total }) => (
                      <button
                        key={cc.cargo}
                        onClick={() => selecionarCargo(cc.cargo)}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-900/40"
                      >
                        {rotuloCurto(cc.titulo)} ({total})
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Tente outro termo, como o nome, a sigla do partido ou o número da urna.
                </p>
              )}
            </div>
          )}

          {/* Classificação completa (régua do usuário + candidatos sem ficha) */}
          {classificacaoCompleta.length > 0 && (
            <details className="group mt-4 rounded-3xl bg-white dark:bg-card shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-3xl p-4 text-[0.9375rem] font-semibold text-zinc-900 dark:text-zinc-50 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-emerald-400">
                <span className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Classificação completa do cargo: {classificacaoCompleta.length} com nota na sua régua{" "}
                  {semFicha.length > 0 ? `· ${semFicha.length} sem ficha por critério` : ""}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  Posição de todos os candidatos deste cargo que têm ficha por critério, calculada com a
                  sua régua ({chavesAplicaveis(cargo).length} critérios
                  {cargo.pesos?.mobilidade != null
                    ? ", com mobilidade e sem os dois critérios de abrangência nacional"
                    : ", sem mobilidade"}
                  , dos quais {eCargo} {eCargo === 1 ? "é essencial" : "são essenciais"} e {mCargo}{" "}
                  {mCargo === 1 ? "é importante" : "são importantes"} na sua régua). Base da avaliação:{" "}
                  <strong className="font-semibold">perfil</strong> (evidências detalhadas),{" "}
                  <strong className="font-semibold">mandato</strong> (titulares sem atuação compilada) ou{" "}
                  <strong className="font-semibold">triagem</strong> (sem registros públicos localizados; nota
                  padrão de {fmt(triagemNota, 2)} com a sua régua). Os 2 primeiros são os cartões desta página.
                  {semFicha.length > 0
                    ? ` As ${semFicha.length} candidaturas sem ficha por critério aparecem ao final, sem posição, por não terem notas individuais para a sua régua.`
                    : ""}
                </p>
                <ol className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
                  {classificacaoCompleta.map((r) => (
                    <li
                      key={r.numero + r.nome_urna}
                      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-[0.875rem] ${
                        r.top ? "bg-emerald-50/70 dark:bg-emerald-950/30" : ""
                      }`}
                    >
                      <span className="w-10 shrink-0 text-right font-mono text-[0.75rem] text-muted-foreground">
                        {r.pos}º
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {r.nome_urna}
                      </span>
                      <span className="hidden shrink-0 text-[0.75rem] text-muted-foreground sm:inline">
                        {r.partido}
                      </span>
                      <span className="shrink-0 rounded-md border border-zinc-200 px-1.5 font-mono text-[0.6875rem] text-zinc-500 dark:text-zinc-400">
                        {r.numero}
                      </span>
                      <span className="w-10 shrink-0 text-right font-semibold text-zinc-700 dark:text-zinc-300">
                        {fmt(r.score_total, 2)}
                      </span>
                    </li>
                  ))}
                  {semFichaOrdenada.map((a) => (
                    <li
                      key={`sem-ficha-${a.numero}-${a.nome_urna}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-[0.875rem]"
                    >
                      <span className="w-10 shrink-0 text-right font-mono text-[0.75rem] text-muted-foreground">
                        N/D
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-500 dark:text-zinc-400">
                        {a.nome_urna}
                      </span>
                      <span className="hidden shrink-0 text-[0.75rem] text-muted-foreground sm:inline">
                        {a.partido}
                      </span>
                      <span className="shrink-0 rounded-md border border-zinc-200 px-1.5 font-mono text-[0.6875rem] text-zinc-500 dark:text-zinc-400">
                        {a.numero}
                      </span>
                      <span className="shrink-0 text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        sem ficha
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          )}

          {cargo.inaptos.length > 0 && (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {cargo.inaptos.length} candidaturas deste cargo foram consideradas inaptas pela Justiça Eleitoral
              (situação de 03/10/2026) e não recebem nota; a lista nominal está no documento completo.
            </p>
          )}
        </section>

        {/* Checagem de afirmações */}
        <SecaoChecagem />

        {/* Viabilidade das propostas */}
        <SecaoPropostas />

        {/* Metodologia */}
        <section id="metodologia" aria-label="Metodologia" className="mt-10 scroll-mt-40">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 text-balance">
            Como o ranking foi calculado
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            Nota final = soma de (nota do critério × peso), em escala de 0 a 10. Os pesos seguem a
            régua que você escolheu em três graus: cada critério essencial pesa 3 vezes um
            critério importante, e critérios irrelevantes ficam de fora do cálculo;
            dentro de cada grau, todos têm o mesmo peso, e os critérios com peso somam 100% em cada cargo. Na
            sua régua atual, {eTotal} de {CRITERIOS.length}{" "}
            {eTotal === 1 ? "critério é essencial" : "critérios são essenciais"}, {mTotal}{" "}
            {mTotal === 1 ? "é importante" : "são importantes"} e {rTotal}{" "}
            {rTotal === 1 ? "é irrelevante" : "são irrelevantes"}. No Presidente, {papelPres}; {frasePesosPres}. No
            Governador do DF, {papelDf}; {frasePesosDf}.
            Cada nota considera evidências em três níveis. O documento completo, acessível no topo,
            mantém a régua padrão da redação, com pesos fixos do time editorial.
          </p>
          <div className="mt-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-4 ring-1 ring-emerald-100 dark:ring-emerald-900">
            <p className="text-[0.8125rem] leading-relaxed text-emerald-900 dark:text-emerald-200 text-pretty">
              <strong className="font-semibold">Critérios por cargo:</strong> defesa dos interesses nacionais e
              fronteira tecnológica avaliam atuação de abrangência nacional e se aplicam somente ao cargo de
              Presidente; mobilidade avalia somente o cargo de Governador do DF. Na sua régua atual: no
              Presidente, {papelPres}; no Governador do DF, {papelDf}.
              A sua régua é aplicada por igual a todos os candidatos aptos de cada cargo.
            </p>
          </div>
          <div className="mt-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100 dark:bg-sky-950/50 dark:ring-sky-900">
            <p className="text-[0.8125rem] leading-relaxed text-sky-900 dark:text-sky-200 text-pretty">
              <strong className="font-semibold">Notas sem histórico:</strong>{" "}
              {POLITICA_HISTORICO.metodologia}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CRITERIOS.map((c) => {
              const Icone = ICONES_CRITERIO[c.chave];
              const papel = NOMES_GRAU[grauDe(escolha, c.chave)].um;
              const abr =
                c.chave === "mobilidade"
                  ? "aplicável somente aos cargos do DF"
                  : c.chave === "soberania" || c.chave === "tecnologia"
                    ? "aplicável somente ao cargo de Presidente"
                    : "aplicável a todos os cargos";
              return (
                <div
                  key={c.chave}
                  className="rounded-3xl bg-white dark:bg-card p-4 shadow-soft ring-1 ring-zinc-100 dark:ring-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                        <Icone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </span>
                      {c.curto}
                    </p>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-right font-mono text-[0.6875rem] font-semibold leading-snug text-zinc-600 dark:text-zinc-400">
                      {rotuloPesoChip(c.chave)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {c.descricao}
                  </p>
                  <details className="mt-1.5">
                    <summary className="cursor-pointer list-none text-[0.6875rem] font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
                      Como avaliamos ▾
                    </summary>
                    <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                      {c.medicao}
                    </p>
                  </details>
                  <p className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">
                    Critério {papel} na sua régua, {abr}.
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {(Object.keys(NIVEL_INFO) as (keyof typeof NIVEL_INFO)[]).map((n) => {
              const info = NIVEL_INFO[n];
              return (
                <div key={n} className={`rounded-3xl p-4 ${info.cor}`}>
                  <p className="text-sm font-bold">Nível {n}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{info.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="mt-auto border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-card">
        <div className="mx-auto max-w-5xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:pb-6">
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground text-pretty">
            Voto Claro é um guia eleitoral independente, sem vínculo partidário e sem propaganda
            eleitoral. Dados: TSE (dados abertos de 03/10/2026 e resultado do 1º turno de 04/10/2026),
            Senado Federal, Câmara dos Deputados e reportagens de imprensa citadas em cada ficha.
            O documento completo está disponível no botão de documento, no topo, e no rodapé de cada
            ficha de candidato.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem]">
            <a
              href="https://dadosabertos.tse.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Dados abertos do TSE
            </a>
            <a
              href="https://divulgacandcontas.tse.jus.br/divulga/#/candidatos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              DivulgaCandContas
            </a>
            <a
              href="https://resultados.tse.jus.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Resultados oficiais do TSE
            </a>
          </div>
        </div>
      </footer>

      {/* Voltar ao topo (aparece após rolar) */}
      {!noTopo && (
        <button
          onClick={() => {
            const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
          }}
          aria-label="Voltar ao topo"
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-card text-zinc-700 dark:text-zinc-300 shadow-lift ring-1 ring-zinc-100 dark:ring-zinc-800 transition-colors hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none sm:bottom-6"
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* Diálogo de detalhe, no estilo da ficha do profissional do DocSpot */}
      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] grid-cols-1 gap-0 overflow-hidden rounded-3xl border-0 bg-white dark:bg-card p-0 shadow-lift ring-1 ring-zinc-200/70 dark:ring-zinc-700 sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{selecionado?.nome_urna}</DialogTitle>
            <DialogDescription>
              Análise detalhada por critério com fontes
            </DialogDescription>
          </DialogHeader>
          {selecionado && (
            <div className="max-h-[calc(92dvh-1px)] overflow-y-auto overscroll-contain">
              <div className="px-4 pb-3 pt-6 sm:px-6">
                <DetalheCandidato cand={selecionado} cargo={cargo} cargoTitulo={rotuloCurto(cargo.titulo)} pesos={pesos} />
              </div>
              {/* CTA fixa no rodapé do diálogo, como o botão de agendar do DocSpot */}
              <div className="sticky bottom-0 border-t border-zinc-100 bg-white dark:bg-card/95 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6">
                <a
                  href="/analise-eleitoral-df-2026.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-reduce:transition-none dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-400"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Abrir documento completo
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


