import raw from "@/data/checagem.json";

/** Veredito consolidado de uma afirmação checada. */
export type Veredito =
  | "falsa"
  | "distorcida"
  | "exagerada"
  | "imprecisa"
  | "parcialmente_verdadeira"
  | "verdadeira"
  | "sem_checagem_formal";

export interface FonteChecagem {
  titulo: string;
  url: string;
}

export interface Afirmacao {
  texto: string;
  /** Chave do tipo de evento (debate_band, globo_2t, df1...). */
  evento: string;
  /** Local e data em linguagem natural. */
  contexto: string;
  /** Data do evento em ISO (YYYY-MM-DD). */
  data: string;
  veredito: Veredito;
  /** O que os fatos verificados dizem. */
  fatos: string;
  fontes: FonteChecagem[];
}

export interface CandidatoChecagem {
  slug: string;
  nome_urna: string;
  cargo: "presidente" | "governador";
  partido: string;
  foto: string;
  nota_extra?: string;
  afirmacoes: Afirmacao[];
}

export interface DadosChecagem {
  atualizado_em: string;
  periodo: string;
  metodologia: string[];
  agencias: { nome: string; url: string }[];
  debate_band: { data: string; desc: string };
  debate_globo: { data: string; desc: string };
  evento_rotulos: Record<string, string>;
  candidatos: CandidatoChecagem[];
}

export const checagem = raw as unknown as DadosChecagem;

/** Rótulo, cores e definição de cada veredito. */
export const VEREDITO_INFO: Record<
  Veredito,
  { label: string; chip: string; desc: string }
> = {
  falsa: {
    label: "Falsa",
    chip: "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-900",
    desc: "Contradiz dados oficiais, documentos ou registros verificados pelas agências de checagem.",
  },
  distorcida: {
    label: "Distorcida",
    chip: "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:ring-orange-900",
    desc: "Parte de um fato real, mas omite ou altera o contexto a ponto de induzir a conclusão errada.",
  },
  exagerada: {
    label: "Exagerada",
    chip: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900",
    desc: "Direção correta, mas magnitude ou intensidade aumentadas além do que os dados sustentam.",
  },
  imprecisa: {
    label: "Imprecisa",
    chip: "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:ring-yellow-900",
    desc: "Números ou detalhes errados, sem alterar totalmente o sentido da afirmação.",
  },
  parcialmente_verdadeira: {
    label: "Parcialmente verdadeira",
    chip: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-900",
    desc: "Tem parte confirmada pelos dados e parte incorreta, ausente ou sem sustentação.",
  },
  verdadeira: {
    label: "Verdadeira",
    chip: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900",
    desc: "Confirmada pelos dados oficiais e pelos registros verificados pelas agências.",
  },
  sem_checagem_formal: {
    label: "Sem checagem formal",
    chip: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:ring-zinc-700",
    desc: "Declaração registrada pela imprensa, ainda sem verificação publicada por agência; não entra na contagem de afirmações falsas.",
  },
};

/** Ordem de exibição: as mais graves primeiro, as confirmadas por último. */
export const ORDEM_VEREDITOS: Veredito[] = [
  "falsa",
  "distorcida",
  "exagerada",
  "imprecisa",
  "parcialmente_verdadeira",
  "sem_checagem_formal",
  "verdadeira",
];

/** Contagem de afirmações por veredito. */
export const contaVereditos = (af: Afirmacao[]): Record<Veredito, number> => {
  const base = {} as Record<Veredito, number>;
  for (const v of ORDEM_VEREDITOS) base[v] = 0;
  for (const a of af) base[a.veredito] += 1;
  return base;
};

/** Total de afirmações falsas checadas de um conjunto. */
export const totalFalsas = (af: Afirmacao[]): number =>
  af.filter((a) => a.veredito === "falsa").length;

/** Recortes de exibição: toda a campanha ou um dos debates do 2º turno. */
export type RecorteChecagem = "todas" | "debate_band" | "debate_globo";

/** Lista filtrada pelo recorte escolhido. */
export const afirmacoesRecorte = (
  c: CandidatoChecagem,
  recorte: RecorteChecagem,
): Afirmacao[] =>
  recorte === "todas"
    ? c.afirmacoes
    : c.afirmacoes.filter((a) => a.evento === recorte);

/** Ordena por gravidade do veredito e depois pela data (mais recente primeiro). */
export const ordenaAfirmacoes = (af: Afirmacao[]): Afirmacao[] =>
  [...af].sort((a, b) => {
    const d = ORDEM_VEREDITOS.indexOf(a.veredito) - ORDEM_VEREDITOS.indexOf(b.veredito);
    if (d !== 0) return d;
    return b.data.localeCompare(a.data);
  });
