import raw from "@/data/propostas.json";

/** Grau de viabilidade técnica de uma proposta. */
export type Classificacao = "facil" | "razoavel" | "improvavel";

/** Dimensão técnica avaliada em cada ficha. */
export type Dimensao = "aprovacao" | "fiscal" | "juridico" | "execucao";

/** Tipo de origem documentada da proposta. */
export type OrigemTipo =
  | "plano_de_governo"
  | "declaracao_oficial"
  | "projeto_de_lei"
  | "programa_em_curso";

export interface FonteProposta {
  titulo: string;
  url: string;
}

export interface Fatores {
  aprovacao: string;
  fiscal: string;
  juridico: string;
  execucao: string;
}

export interface Proposta {
  id: string;
  titulo: string;
  area: string;
  resumo: string;
  origem: { tipo: OrigemTipo; data: string; contexto: string };
  classificacao: Classificacao;
  caminho: string;
  analise: string;
  fatores: Fatores;
  fontes: FonteProposta[];
}

export interface CandidatoPropostas {
  slug: string;
  nome_urna: string;
  cargo: "presidente" | "governador";
  partido: string;
  foto: string;
  propostas: Proposta[];
}

export interface DadosPropostas {
  atualizado_em: string;
  corte: string;
  periodo: string;
  metodologia: string[];
  categorias: Record<
    Classificacao,
    { label: string; plural: string; chip: string; desc: string }
  >;
  dimensoes: Record<Dimensao, { nome: string; desc: string }>;
  origem_rotulos: Record<OrigemTipo, string>;
  candidatos: CandidatoPropostas[];
}

export const propostasDados = raw as unknown as DadosPropostas;

/** Ordem de exibição: as mais arriscadas primeiro, as fáceis por último. */
export const ORDEM_CLASSIFICACAO: Classificacao[] = [
  "improvavel",
  "razoavel",
  "facil",
];

export const DIMENSOES: Dimensao[] = [
  "aprovacao",
  "fiscal",
  "juridico",
  "execucao",
];

/** Contagem de propostas por grau de viabilidade. */
export const contaClassificacoes = (
  ps: Proposta[],
): Record<Classificacao, number> => {
  const base: Record<Classificacao, number> = {
    improvavel: 0,
    razoavel: 0,
    facil: 0,
  };
  for (const p of ps) base[p.classificacao] += 1;
  return base;
};

/** Ordena pela gravidade da viabilidade e, dentro dela, pela área. */
export const ordenaPropostas = (ps: Proposta[]): Proposta[] =>
  [...ps].sort(
    (a, b) =>
      ORDEM_CLASSIFICACAO.indexOf(a.classificacao) -
        ORDEM_CLASSIFICACAO.indexOf(b.classificacao) ||
      a.area.localeCompare(b.area, "pt-BR"),
  );

/** Lista filtrada por cargo: todas, só Presidente ou só Governador do DF. */
export const recorteCargo = (
  candidatos: CandidatoPropostas[],
  cargo: "todos" | "presidente" | "governador",
): CandidatoPropostas[] =>
  cargo === "todos"
    ? candidatos
    : candidatos.filter((c) => c.cargo === cargo);

/** Data ISO convertida para dd/mm/aaaa. */
export const dataBr = (iso: string): string =>
  iso.split("-").reverse().join("/");
