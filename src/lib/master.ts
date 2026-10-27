// Núcleo de dados do Caso Master: tipos, carregamento e utilidades
import metaJson from "@/data/master/meta.json";
import pessoasA from "@/data/master/pessoas-a.json";
import pessoasB from "@/data/master/pessoas-b.json";
import pessoasC from "@/data/master/pessoas-c.json";
import timelineA from "@/data/master/timeline-a.json";
import timelineB from "@/data/master/timeline-b.json";
import timelineC from "@/data/master/timeline-c.json";
import timelineD from "@/data/master/timeline-d.json";
import esquemasJson from "@/data/master/esquemas.json";

export type GrauId = "oficial" | "multifonte" | "fonteunica" | "alegacao";

export interface Fonte {
  titulo: string;
  veiculo: string;
  data: string;
  url: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  nomeCompleto?: string;
  papel: string;
  grupo: string;
  nascimento?: string;
  resumo: string;
  status: string;
  statusTipo: "preso" | "investigado" | "colaborador" | "institucional" | "falecido";
  grau: GrauId;
  foto: string | null;
  fontes: Fonte[];
}

export interface Fato {
  id: string;
  data: string;
  dataLabel: string;
  titulo: string;
  texto: string;
  grau: GrauId;
  tipos: string[];
  pessoas: string[];
  esquema: string;
  destaque: boolean;
  fontes: Fonte[];
}

export interface Passo {
  n: number;
  titulo: string;
  texto: string;
}

export interface Esquema {
  id: string;
  nome: string;
  subtitulo: string;
  periodo: string;
  statusApuracao: string;
  resumo: string;
  passos: Passo[];
  descoberta: string;
  valores: { rotulo: string; valor: string }[];
  pessoas: string[];
  grau: GrauId;
  fontes: Fonte[];
}

export const meta = metaJson as {
  nome: string;
  subtitulo: string;
  atualizacao: string;
  recorte: string;
  disclaimer: string;
  metodologia: string[];
  escala: { id: GrauId; rotulo: string; cor: string; descricao: string }[];
  tiposApuracao: { id: string; rotulo: string }[];
  numerosChave: { rotulo: string; valor: string; nota: string; grau: GrauId }[];
};

export const pessoas: Pessoa[] = [...(pessoasA as Pessoa[]), ...(pessoasB as Pessoa[]), ...(pessoasC as Pessoa[])];

export const timeline: Fato[] = [
  ...(timelineA as Fato[]),
  ...(timelineB as Fato[]),
  ...(timelineC as Fato[]),
  ...(timelineD as Fato[]),
].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

export const esquemas: Esquema[] = esquemasJson as Esquema[];

export const pessoaPorId = new Map(pessoas.map((p) => [p.id, p]));
export const esquemaPorId = new Map(esquemas.map((e) => [e.id, e]));

export const escalaPorId = new Map(meta.escala.map((e) => [e.id, e]));
export const tipoPorId = new Map(meta.tiposApuracao.map((t) => [t.id, t]));

export const grupos: Record<string, string> = {
  "nucleo-master": "Núcleo do Banco Master",
  familia: "Família Vorcaro",
  "brb-df": "BRB e governo do DF",
  "bc-governo": "Banco Central e governo federal",
  "stf-justica": "STF e Justiça",
  politica: "Política",
  midia: "Mídia e imagem",
  operadores: "Operadores e interlocutores",
};

export function labelGrau(id: GrauId): string {
  return escalaPorId.get(id)?.rotulo ?? id;
}

export function labelTipo(id: string): string {
  return tipoPorId.get(id)?.rotulo ?? id;
}

export function nomePessoa(id: string): string {
  return pessoaPorId.get(id)?.nome ?? id;
}

/** Número de menções: eventos da linha do tempo + esquemas que citam a pessoa */
export function mencoesPessoa(id: string): number {
  let n = 0;
  for (const f of timeline) if (f.pessoas.includes(id)) n++;
  for (const e of esquemas) if (e.pessoas.includes(id)) n++;
  return n;
}

export interface PessoaRanking {
  pessoa: Pessoa;
  mencoes: number;
}

export const rankingPessoas: PessoaRanking[] = pessoas
  .map((pessoa) => ({ pessoa, mencoes: mencoesPessoa(pessoa.id) }))
  .sort((a, b) => b.mencoes - a.mencoes || a.pessoa.nome.localeCompare(b.pessoa.nome));

/** Número da ficha (FICHA-001, FICHA-002...), pela ordem do ranking de menções */
export const numeroFichaPorId = new Map(rankingPessoas.map((r, i) => [r.pessoa.id, i + 1] as const));

/** Remove acentos e normaliza para busca insensível */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ResultadoBusca {
  pessoas: Pessoa[];
  fatos: Fato[];
  esquemas: Esquema[];
}

export function buscar(termo: string): ResultadoBusca {
  const q = normalizar(termo.trim());
  if (q.length < 2) return { pessoas: [], fatos: [], esquemas: [] };
  return {
    pessoas: pessoas.filter((p) =>
      [p.nome, p.nomeCompleto ?? "", p.papel, p.resumo, p.status].some((t) => normalizar(t).includes(q))
    ),
    fatos: timeline.filter((f) => [f.titulo, f.texto, f.dataLabel].some((t) => normalizar(t).includes(q))),
    esquemas: esquemas.filter((e) =>
      [e.nome, e.subtitulo, e.resumo, e.descoberta, ...e.passos.map((p) => p.titulo + " " + p.texto)].some((t) =>
        normalizar(t).includes(q)
      )
    ),
  };
}

/** Fatos relacionados a uma pessoa, em ordem cronológica */
export function fatosDePessoa(id: string): Fato[] {
  return timeline.filter((f) => f.pessoas.includes(id));
}

/** Esquemas relacionados a uma pessoa */
export function esquemasDePessoa(id: string): Esquema[] {
  return esquemas.filter((e) => e.pessoas.includes(id));
}

export const contagens = {
  fatos: timeline.length,
  pessoas: pessoas.length,
  esquemas: esquemas.length,
  fontes: (() => {
    const urls = new Set<string>();
    for (const f of timeline) for (const s of f.fontes) urls.add(s.url);
    for (const p of pessoas) for (const s of p.fontes) urls.add(s.url);
    for (const e of esquemas) for (const s of e.fontes) urls.add(s.url);
    return urls.size;
  })(),
  presos: pessoas.filter((p) => p.statusTipo === "preso").length,
};
