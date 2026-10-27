// Construtor das redes de conexão do Caso Master
// Gera, a partir dos dados do dossiê, os nós e arestas de cada esquema
// e da teia geral, para visualização em 3D interativo.

import { esquemas, esquemaPorId, pessoas, pessoaPorId, timeline, grupos } from "@/lib/master";
import type { Esquema, Fato, Fonte, GrauId } from "@/lib/master";

export const COR_HUB = "#e3b341";

// Cores de grupo com alta luminância: legíveis sobre fundo escuro
export const CORES_GRUPO: Record<string, string> = {
  "nucleo-master": "#ffd166",
  familia: "#ffa06b",
  operadores: "#cde85f",
  "brb-df": "#6bd8ff",
  "bc-governo": "#b39bff",
  "stf-justica": "#5fe8b0",
  politica: "#ff7a93",
  midia: "#e39dff",
};

export function corDeGrupo(grupo: string): string {
  return CORES_GRUPO[grupo] ?? "#c0c8d8";
}

export interface NoRede {
  id: string; // "s:captacao" | "p:vorcaro"
  refId: string;
  tipo: "esquema" | "pessoa";
  rotulo: string;
  subtitulo: string;
  cor: string;
  raio: number;
  foto: string | null;
  grupo?: string;
  statusTipo?: Pessoa["statusTipo"];
  grau?: GrauId;
}

export interface ArestaRede {
  a: string;
  b: string;
  peso: number;
  fatosIds: string[];
}

export interface Rede {
  id: string; // "geral" | id do esquema
  titulo: string;
  subtitulo: string;
  nos: NoRede[];
  arestas: ArestaRede[];
  gruposPresentes: { id: string; rotulo: string; cor: string; total: number }[];
  fatos: Fato[];
  resumo: string;
  statusApuracao: string;
  periodo: string;
  grau: GrauId;
  valores: { rotulo: string; valor: string }[];
  fontes: Fonte[];
}

type Pessoa = (typeof pessoas)[number];

const fatoPorId = new Map(timeline.map((f) => [f.id, f]));

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter((s) => s.length > 2)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

function noDePessoa(p: Pessoa, raio: number): NoRede {
  return {
    id: `p:${p.id}`,
    refId: p.id,
    tipo: "pessoa",
    rotulo: p.nome,
    subtitulo: p.papel,
    cor: corDeGrupo(p.grupo),
    raio,
    foto: p.foto,
    grupo: p.grupo,
    statusTipo: p.statusTipo,
    grau: p.grau,
  };
}

function noDeEsquema(e: Esquema, raio: number): NoRede {
  return {
    id: `s:${e.id}`,
    refId: e.id,
    tipo: "esquema",
    rotulo: e.nome,
    subtitulo: e.subtitulo,
    cor: COR_HUB,
    raio,
    foto: null,
    grau: e.grau,
  };
}

function gruposDe(nos: NoRede[]): Rede["gruposPresentes"] {
  const contagem = new Map<string, number>();
  for (const n of nos) if (n.grupo) contagem.set(n.grupo, (contagem.get(n.grupo) ?? 0) + 1);
  return [...contagem.entries()]
    .map(([id, total]) => ({ id, rotulo: grupos[id] ?? id, cor: corDeGrupo(id), total }))
    .sort((a, b) => b.total - a.total);
}

function paresDeFatos(fatos: Fato[], permitidos: Set<string>): Map<string, ArestaRede> {
  const pares = new Map<string, ArestaRede>();
  for (const f of fatos) {
    const pp = (f.pessoas ?? []).filter((id) => permitidos.has(id));
    for (let i = 0; i < pp.length; i++) {
      for (let j = i + 1; j < pp.length; j++) {
        const chave = [pp[i], pp[j]].sort().join("|");
        const existente = pares.get(chave);
        if (existente) {
          existente.peso += 1;
          existente.fatosIds.push(f.id);
        } else {
          pares.set(chave, { a: `p:${pp[i]}`, b: `p:${pp[j]}`, peso: 1, fatosIds: [f.id] });
        }
      }
    }
  }
  return pares;
}

// Rede focada em um único esquema: nó central + TODOS os envolvidos (listados no esquema
// ou citados em fatos apurados do esquema) + conexões por fatos compartilhados
function redeDeEsquema(e: Esquema): Rede {
  const fatos = timeline.filter((f) => f.esquema === e.id);
  const ids = new Set(e.pessoas);
  for (const f of fatos) for (const pid of f.pessoas ?? []) ids.add(pid);
  const nos: NoRede[] = [noDeEsquema(e, 27)];
  const participacao = new Map<string, number>();
  for (const f of fatos) for (const id of f.pessoas ?? []) if (ids.has(id)) participacao.set(id, (participacao.get(id) ?? 0) + 1);
  for (const pid of ids) {
    const p = pessoaPorId.get(pid);
    if (!p) continue;
    const fatosNoEsquema = participacao.get(pid) ?? 0;
    nos.push(noDePessoa(p, 15 + Math.min(9, fatosNoEsquema * 2)));
  }
  const presentes = ids;
  const arestas: ArestaRede[] = [];
  for (const pid of ids) {
    arestas.push({ a: `s:${e.id}`, b: `p:${pid}`, peso: 2, fatosIds: [] });
  }
  for (const par of paresDeFatos(fatos, presentes).values()) {
    if (nos.some((n) => n.id === par.a) && nos.some((n) => n.id === par.b)) arestas.push(par);
  }
  return {
    id: e.id,
    titulo: e.nome,
    subtitulo: e.subtitulo,
    nos,
    arestas,
    gruposPresentes: gruposDe(nos),
    fatos,
    resumo: e.resumo,
    statusApuracao: e.statusApuracao,
    periodo: e.periodo,
    grau: e.grau,
    valores: e.valores,
    fontes: e.fontes,
  };
}

// Teia geral: os 11 esquemas como hubs + TODAS as pessoas com envolvimento documentado
// em algum esquema (listadas no esquema ou citadas em fatos apurados dele) + conexões fortes
function redeGeral(): Rede {
  // envolvimento por esquema: pessoas listadas no esquema OU citadas em fatos do esquema
  const envolvidosPorEsquema = new Map<string, Set<string>>();
  for (const e of esquemas) {
    const set = new Set(e.pessoas);
    for (const f of timeline) {
      if (f.esquema !== e.id) continue;
      for (const pid of f.pessoas ?? []) set.add(pid);
    }
    envolvidosPorEsquema.set(e.id, set);
  }
  const nos: NoRede[] = esquemas.map((e) => noDeEsquema(e, 25));
  const nosPorId = new Map(nos.map((n) => [n.id, n]));
  const arestas: ArestaRede[] = [];
  for (const e of esquemas) {
    for (const pid of envolvidosPorEsquema.get(e.id)!) {
      const p = pessoaPorId.get(pid);
      if (!p) continue;
      const nid = `p:${pid}`;
      if (!nosPorId.has(nid)) {
        const totalFatos = timeline.filter((f) => (f.pessoas ?? []).includes(pid)).length;
        const no = noDePessoa(p, 13 + Math.min(8, totalFatos * 1.3));
        nos.push(no);
        nosPorId.set(nid, no);
      }
      arestas.push({ a: `s:${e.id}`, b: nid, peso: 2, fatosIds: [] });
    }
  }
  const todasAsPessoas = new Set(pessoas.map((p) => p.id));
  for (const par of paresDeFatos(timeline, todasAsPessoas).values()) {
    if (par.peso >= 2 && nosPorId.has(par.a) && nosPorId.has(par.b)) arestas.push(par);
  }
  return {
    id: "geral",
    titulo: "A teia completa",
    subtitulo: "Como os 11 esquemas se conectam por todas as pessoas envolvidas",
    nos,
    arestas,
    gruposPresentes: gruposDe(nos),
    fatos: [],
    resumo:
      "Visão geral do caso: cada nó dourado é um esquema do dossiê e cada nó colorido é uma pessoa com envolvimento documentado, colorida pelo grupo de atuação. Estão na teia todas as pessoas listadas nos esquemas ou citadas nos fatos apurados deles. Linhas ligam pessoas aos esquemas de que participam e, quando duas pessoas aparecem juntas nos mesmos fatos apurados, uma linha direta as conecta. Toque em qualquer nó para ver quem é, com quem se conecta e em quais fatos.",
    statusApuracao: "",
    periodo: "2017 a 2026",
    grau: "oficial",
    valores: [],
    fontes: esquemas.flatMap((e) => e.fontes).slice(0, 6),
  };
}

const cache = new Map<string, Rede>();

export function rede(id: string): Rede | undefined {
  if (cache.has(id)) return cache.get(id);
  let r: Rede | undefined;
  if (id === "geral") r = redeGeral();
  else {
    const e = esquemaPorId.get(id);
    if (e) r = redeDeEsquema(e);
  }
  if (r) cache.set(id, r);
  return r;
}

export function redeOuPadrao(id: string): Rede {
  return rede(id) ?? redeGeral();
}

export interface ItemSeletor {
  id: string;
  nome: string;
  subtitulo: string;
  totalNos: number;
}

export function listaRedes(): ItemSeletor[] {
  const geral = rede("geral")!;
  const itens: ItemSeletor[] = [
    { id: "geral", nome: geral.titulo, subtitulo: geral.subtitulo, totalNos: geral.nos.length },
  ];
  for (const e of esquemas) {
    const r = rede(e.id)!;
    itens.push({ id: e.id, nome: e.nome, subtitulo: e.subtitulo, totalNos: r.nos.length });
  }
  return itens;
}

export interface Conexao {
  no: NoRede;
  peso: number;
  fatosIds: string[];
}

export function conexoesDe(r: Rede, noId: string): Conexao[] {
  const nosPorId = new Map(r.nos.map((n) => [n.id, n]));
  const saida: Conexao[] = [];
  for (const ar of r.arestas) {
    if (ar.a === noId || ar.b === noId) {
      const outroId = ar.a === noId ? ar.b : ar.a;
      const no = nosPorId.get(outroId);
      if (no) saida.push({ no, peso: ar.peso, fatosIds: ar.fatosIds });
    }
  }
  return saida.sort((a, b) => b.peso - a.peso || a.no.rotulo.localeCompare(b.no.rotulo));
}

export function fatosDeNo(r: Rede, noId: string): Fato[] {
  if (noId.startsWith("s:")) return r.fatos;
  const pid = noId.slice(2);
  const escopo = r.id === "geral" ? null : r.id;
  return timeline.filter((f) => (escopo === null || f.esquema === escopo) && (f.pessoas ?? []).includes(pid));
}

export function rotuloFato(id: string): string {
  return fatoPorId.get(id)?.titulo ?? id;
}

export function iniciaisDe(nome: string): string {
  return iniciais(nome);
}
