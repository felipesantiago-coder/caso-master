import raw from "@/data/analise.json";

export type Nivel = "A" | "B" | "C";

export interface Fonte {
  titulo: string;
  url: string;
}

export interface Criterio {
  nota: number;
  nivel: Nivel;
  texto: string;
  /** O critério depende de experiência prévia (no cargo ou em outros) que a
   *  candidatura não tem; a nota considera propostas, compromissos públicos e
   *  medidas concretas em outros cargos e NÃO é reduzida pela ausência de
   *  histórico. */
  sem_historico?: boolean;
  /** Ausência total de proposta no plano de governo, de compromisso público
   *  e de medida concreta proposta em outro cargo público no tema; a nota É
   *  reduzida por essa ausência (penalização prevista na política de notas,
   *  sempre marcada para total transparência). */
  sem_proposta?: boolean;
  /** Medida concreta proposta (ou executada) pelo candidato em outro cargo
   *  público, voltada ao tema do critério e corroborada por dados públicos
   *  verificáveis; entra na nota conforme a política de notas. */
  proposta_outro_cargo?: string;
}

export type ChaveCriterio =
  | "transparencia"
  | "desenvolvimento"
  | "honestidade"
  | "ambiental"
  | "soberania"
  | "tecnologia"
  | "democracia"
  | "gestao"
  | "fiscal"
  | "social"
  | "mobilidade"
  | "saude"
  | "educacao"
  | "seguranca"
  | "emprego"
  | "moradia";

export interface Candidato {
  nome_urna: string;
  partido: string;
  numero: string;
  vice: string;
  coligacao: string;
  foto: string;
  slug: string;
  foto_url: string;
  resumo: string;
  criterios: Record<ChaveCriterio, Criterio>;
  score_total: number;
  ranking: number;
  fontes: Fonte[];
}

export interface Excluido {
  nome: string;
  motivo: string;
  fontes: Fonte[];
}

export interface PosicaoRanking {
  pos: number;
  nome_urna: string;
  partido: string;
  numero: string;
  score_total: number;
  base: "perfil" | "mandato" | "triagem";
}

/** Candidatura apta com notas por critério quando disponíveis (texto nulo
 *  cai para o texto padrão de triagem no cliente). */
export interface Apto {
  numero: string;
  nome_urna: string;
  partido: string;
  base: "perfil" | "triagem";
  score_padrao: number;
  vice?: string;
  coligacao?: string;
  resumo?: string;
  fontes?: Fonte[];
  foto?: string;
  slug?: string;
  foto_url?: string;
  criterios?:
    | Record<
        string,
        {
          nota: number;
          nivel: Nivel;
          texto: string | null;
          sem_historico?: boolean;
          sem_proposta?: boolean;
          proposta_outro_cargo?: string;
        }
      >
    | null;
}

export interface Cargo {
  cargo: string;
  titulo: string;
  vagas: number;
  escopo: string;
  intro: string;
  total_registros: number;
  total_aptos: number;
  pesos?: Partial<Record<ChaveCriterio, number>>;
  excluidos: Excluido[];
  inaptos: Excluido[];
  candidatos: Candidato[];
  restante: PosicaoRanking[];
  aptos?: Apto[];
}

export interface DadosAnalise {
  pesos: Partial<Record<ChaveCriterio, number>>;
  cargos: Cargo[];
  textos_padrao?: { triagem: Record<string, string> };
}

export const dados = raw as unknown as DadosAnalise;

export const CRITERIOS: {
  chave: ChaveCriterio;
  nome: string;
  curto: string;
  peso: number;
  complementar?: boolean;
  /** O que o critério mede, em linguagem concreta, com exemplos do que
   *  entra e do que não entra na avaliação. */
  descricao: string;
  /** Como a redação pontua: quais evidências sustentam a nota. */
  medicao: string;
}[] = [
  {
    chave: "transparencia", nome: "Transparência e prestação de contas", curto: "Transparência", peso: 0.09,
    descricao:
      "Se o que é público aparece: verbas, contratos, emendas e decisões publicados de forma aberta, com resposta rápida a auditorias. Avalia práticas concretas de abertura, como portais de dados e o fim de recursos sigilosos, e não discursos a favor da transparência.",
    medicao: "Portais oficiais de dados abertos, auditorias de tribunais de contas e casos documentados de opacidade.",
  },
  {
    chave: "desenvolvimento", nome: "Propostas concretas de desenvolvimento", curto: "Desenvolvimento", peso: 0.04,
    descricao:
      "Se o plano de governo explica como fazer, quanto custa e em quanto tempo, em vez de prometer sem detalhar. Um bom programa tem prioridades claras, fonte de custeio indicada e meta com prazo.",
    medicao: "Planos de governo registrados no TSE, projetos de lei apresentados e relatórios de execução.",
  },
  {
    chave: "honestidade", nome: "Honestidade comprovada por evidências", curto: "Honestidade", peso: 0.09,
    descricao:
      "Se a trajetória da pessoa tem processos, inquéritos ou condenações documentados, e como esses casos terminaram. Não é fama nem acusação solta: só entra o que está registrado na Justiça, em tribunais de contas ou em apurações oficiais.",
    medicao: "Andamento e desfecho de processos criminais e de improbidade, com documentos oficiais.",
  },
  {
    chave: "ambiental", nome: "Visão ambiental responsável", curto: "Ambiental", peso: 0.03,
    descricao:
      "Se a pessoa protege florestas, água e clima sem travar a economia: combate ao desmatamento ilegal, energia limpa, saneamento e preparo para secas e enchentes.",
    medicao: "Dados de desmatamento do Inpe, execução de políticas ambientais e posicionamentos com efeito comprovado.",
  },
  {
    chave: "soberania", nome: "Defesa dos interesses nacionais", curto: "Soberania", peso: 0.09,
    descricao:
      "Se o Brasil negocia de igual para igual no exterior: posição em guerras e blocos econômicos, defesa da Amazônia como patrimônio estratégico, indústria de defesa e autonomia tecnológica.",
    medicao: "Atos de política externa, contratos estratégicos e política nacional de defesa.",
  },
  {
    chave: "tecnologia", nome: "Fronteira tecnológica", curto: "Tecnologia", peso: 0.09,
    descricao:
      "Se o país avança nas tecnologias que definirão a economia das próximas décadas: semicondutores, inteligência artificial, conectividade, setor aeroespacial e ciência básica financiada.",
    medicao: "Investimento em ciência e tecnologia, contratos industriais e resultados de programas públicos de inovação.",
  },
  {
    chave: "democracia", nome: "Compromisso com a democracia e o Estado de Direito", curto: "Democracia", peso: 0.04, complementar: true,
    descricao:
      "Se a pessoa respeita as regras do jogo: aceita o resultado da eleição, não ataca Poderes nem eleições, cumpre decisões da Justiça e reprova a violência política.",
    medicao: "Atos e discursos públicos verificáveis, inquéritos oficiais e postura em crises institucionais.",
  },
  {
    chave: "gestao", nome: "Capacidade de gestão e histórico de resultados", curto: "Gestão", peso: 0.09, complementar: true,
    descricao:
      "O que a pessoa entregou quando administrou de verdade: cidade, estado, ministério ou cargo executivo. Quem nunca governou é avaliado pela consistência do time e do plano que apresenta.",
    medicao: "Programas concluídos, execução orçamentária e desempenho de órgãos sob sua liderança.",
  },
  {
    chave: "fiscal", nome: "Responsabilidade fiscal e uso dos recursos públicos", curto: "Fiscal", peso: 0.07, complementar: true,
    descricao:
      "Se as contas fecham: dívida sob controle, sem atraso de salários ou parcelamento de emergência, e benefícios anunciados com fonte de custeio. Proposta sem custo é panfleto.",
    medicao: "Resultado fiscal, cumprimento das regras legais e pareceres de tribunais de contas.",
  },
  {
    chave: "social", nome: "Compromisso social e redução das desigualdades", curto: "Social", peso: 0.03, complementar: true,
    descricao:
      "Se as ações da pessoa reduzem a distância entre os mais pobres e o resto da sociedade: renda, fome, acesso a benefícios e direitos de grupos vulneráveis.",
    medicao: "Indicadores de pobreza e desigualdade do IBGE, cobertura de programas sociais e leis aprovadas.",
  },
  {
    chave: "mobilidade", nome: "Melhorias da mobilidade, com prioridade ao transporte público", curto: "Mobilidade", peso: 0.09, complementar: true,
    descricao:
      "Se o deslocamento melhora de verdade no DF: frequência e integração de ônibus e metrô, obras concluídas no prazo e menos tempo perdido no trânsito.",
    medicao: "Passageiros transportados, obras entregues e planejamento do Metrô-DF e do DFTrans.",
  },
  {
    chave: "saude", nome: "Saúde pública efetiva", curto: "Saúde", peso: 0.08, complementar: true,
    descricao:
      "Se a rede de saúde funciona na prática: menos gente na fila de cirurgia e exame, postos abertos e equipados, hospitais sem superlotação e sem escândalos de infecção ou negligência.",
    medicao: "Dados do SUS (DATASUS), filas ativas, auditorias do TCU e do TCE-DF e gestão hospitalar documentada.",
  },
  {
    chave: "educacao", nome: "Educação com resultados de aprendizagem", curto: "Educação", peso: 0.06, complementar: true,
    descricao:
      "Se as crianças aprendem de verdade e a rede cresce: alfabetização na idade certa, boas notas no IDEB, creches onde falta vaga, escolas conservadas e professores valorizados.",
    medicao: "IDEB e Saeb (Inep), vagas em creches, execução de planos de educação e dados da rede local.",
  },
  {
    chave: "seguranca", nome: "Segurança pública e redução da violência", curto: "Segurança", peso: 0.08, complementar: true,
    descricao:
      "Se o lugar fica mais seguro em números: queda de homicídios, roubos e furtos, polícia presente e bem equipada, combate organizado a facções e milícias.",
    medicao: "Anuário Brasileiro de Segurança Pública, dados do Sinesp e das secretarias de segurança e resultados operacionais das polícias.",
  },
  {
    chave: "emprego", nome: "Emprego e renda na economia real", curto: "Emprego", peso: 0.07, complementar: true,
    descricao:
      "Se estão sendo criados empregos formais e a renda sobe: saldo de vagas do CAGED, desemprego em queda, salário médio em alta e investimentos que geram trabalho.",
    medicao: "Novo CAGED (Ministério do Trabalho), PNAD Contínua (IBGE) e investimentos com vagas confirmadas.",
  },
  {
    chave: "moradia", nome: "Moradia e regularização fundiária", curto: "Moradia", peso: 0.05, complementar: true,
    descricao:
      "Se mais famílias conseguem casa própria e quem já mora no lugar ganha documento: unidades habitacionais entregues, regularização de bairros e condomínios e déficit habitacional em queda.",
    medicao: "Contratações e entregas de programas habitacionais, regularização fundiária executada e déficit medido pela Fundação João Pinheiro.",
  },
];

/** Conjunto de critérios de um cargo. Os pesos exibidos em `peso` e nos
 *  `pesos` do JSON são apenas a régua padrão da redação (base do documento
 *  estático); no aplicativo a régua efetiva é a do usuário, derivada em
 *  `pesosPersonalizados`. O conjunto de critérios é estrutural: cargos do DF
 *  não recebem soberania e tecnologia (abrangência nacional). Os cinco
 *  critérios de pauta concreta (saúde, educação, segurança, emprego e
 *  moradia) valem para os dois cargos. */
export const criteriosDoCargo = (cargo: Cargo | undefined): typeof CRITERIOS => {
  if (cargo?.pesos) {
    return CRITERIOS.filter((c) => typeof cargo.pesos?.[c.chave] === "number");
  }
  return CRITERIOS;
};

/** Peso padrão da redação para um critério no cargo (régua do documento
 *  estático; no aplicativo use `pesosPersonalizados`). */
export const pesoDoCargo = (cargo: Cargo | undefined, chave: ChaveCriterio): number => {
  const p = cargo?.pesos?.[chave];
  if (typeof p === "number") return p;
  return CRITERIOS.find((c) => c.chave === chave)?.peso ?? 0;
};

/* ------------------------------------------------------------------ */
/* Régua personalizada: graus de importância definidos pelo usuário    */
/* ------------------------------------------------------------------ */

/** Grau de importância atribuído pelo usuário a um critério:
 *  2 = essencial, 1 = importante, 0 = irrelevante (fora do cálculo).
 *  A ausência na escolha significa importante; irrelevante é sempre uma
 *  escolha explícita do usuário. */
export type GrauImportancia = 0 | 1 | 2;

/** Escolha do usuário: grau de importância de cada critério. */
export type EscolhaCriterios = Partial<Record<ChaveCriterio, GrauImportancia>>;

export const CHAVES_CRITERIOS = CRITERIOS.map((c) => c.chave);

/** Critérios aplicáveis a cada conjunto de cargos (abrangência). */
export const APLICAVEIS_PRESIDENTE: ChaveCriterio[] = [
  "transparencia", "desenvolvimento", "honestidade", "ambiental",
  "soberania", "tecnologia", "democracia", "gestao", "fiscal", "social",
  "saude", "educacao", "seguranca", "emprego", "moradia",
];
export const APLICAVEIS_DF: ChaveCriterio[] = [
  "transparencia", "desenvolvimento", "honestidade", "ambiental",
  "democracia", "gestao", "fiscal", "social", "mobilidade",
  "saude", "educacao", "seguranca", "emprego", "moradia",
];

/** Sugestão da redação (critérios essenciais predefinidos; os demais ficam
 *  no grau importante). */
export const CHAVES_SUGESTAO: ChaveCriterio[] = ["honestidade", "transparencia", "gestao", "fiscal"];

/** Peso relativo de cada grau de importância: essencial pesa 3, importante
 *  pesa 1 e irrelevante pesa 0 (fica de fora do cálculo da nota). Dentro de
 *  um mesmo grau todos os critérios têm o mesmo peso. */
export const PESO_GRAU: Record<GrauImportancia, number> = { 2: 3, 1: 1, 0: 0 };

/** Rótulos dos graus em português, no singular e no plural. */
export const NOMES_GRAU: Record<GrauImportancia, { um: string; muitos: string }> = {
  2: { um: "essencial", muitos: "essenciais" },
  1: { um: "importante", muitos: "importantes" },
  0: { um: "irrelevante", muitos: "irrelevantes" },
};

/** Grau efetivo de um critério na escolha do usuário (ausente = importante;
 *  irrelevante é sempre escolha explícita). */
export const grauDe = (escolha: EscolhaCriterios, chave: ChaveCriterio): GrauImportancia =>
  escolha[chave] ?? 1;

/** Pesos dos três graus para e critérios essenciais, m importantes e r
 *  irrelevantes: iguais dentro do grau, essencial pesa 3 vezes importante e
 *  irrelevante fica de fora do cálculo (peso 0); os critérios com peso somam
 *  100%. Com um único grau com peso presente, todos os critérios com peso
 *  ficam iguais entre si. Se todos os critérios forem irrelevantes (soma
 *  zero), a régua pesa todos igualmente para o ranking seguir possível. */
export const pesosGraus = (
  e: number,
  m: number,
  r: number,
): { essencial: number; importante: number; irrelevante: number } => {
  const soma = 3 * e + m;
  if (soma === 0) {
    const n = e + m + r;
    const igual = n > 0 ? 1 / n : 0;
    return { essencial: igual, importante: igual, irrelevante: igual };
  }
  return { essencial: 3 / soma, importante: 1 / soma, irrelevante: 0 };
};

/** Chaves de critérios aplicáveis a um cargo (conjunto estrutural do cargo). */
export const chavesAplicaveis = (cargo: Cargo | undefined): ChaveCriterio[] => {
  if (cargo?.pesos) return Object.keys(cargo.pesos) as ChaveCriterio[];
  return CHAVES_CRITERIOS;
};

/** Pesos personalizados de um cargo conforme o grau de importância que o
 *  usuário deu a cada critério (irrelevante recebe peso 0 e não altera a
 *  nota final). */
export const pesosPersonalizados = (
  cargo: Cargo | undefined,
  escolha: EscolhaCriterios,
): Record<ChaveCriterio, number> => {
  const chaves = chavesAplicaveis(cargo);
  const e = chaves.filter((c) => grauDe(escolha, c) === 2).length;
  const m = chaves.filter((c) => grauDe(escolha, c) === 1).length;
  const r = chaves.length - e - m;
  const w = pesosGraus(e, m, r);
  const out = {} as Record<ChaveCriterio, number>;
  for (const c of chaves) {
    const g = grauDe(escolha, c);
    out[c] = g === 2 ? w.essencial : g === 1 ? w.importante : w.irrelevante;
  }
  return out;
};

export interface PosicaoApto {
  apto: Apto;
  score: number;
  pos: number;
}

/** Recalcula a classificação de um cargo com a régua do usuário. Candidatos
 *  sem notas por critério completas ficam em "semFicha" e não recebem
 *  posição personalizada. Empates ordenam alfabeticamente. */
export const pontuaCargo = (
  cargo: Cargo,
  escolha: EscolhaCriterios,
): { ranqueados: PosicaoApto[]; semFicha: Apto[] } => {
  const pesos = pesosPersonalizados(cargo, escolha);
  const aplicaveis = chavesAplicaveis(cargo);
  const comFicha: PosicaoApto[] = [];
  const semFicha: Apto[] = [];
  for (const apto of cargo.aptos ?? []) {
    const crit = apto.criterios;
    if (!crit || !aplicaveis.every((c) => crit[c])) {
      semFicha.push(apto);
      continue;
    }
    const bruto = aplicaveis.reduce((s, c) => s + crit[c].nota * pesos[c], 0);
    comFicha.push({ apto, score: Math.round(bruto * 100) / 100, pos: 0 });
  }
  comFicha.sort(
    (a, b) => b.score - a.score || a.apto.nome_urna.localeCompare(b.apto.nome_urna, "pt-BR"),
  );
  comFicha.forEach((p, i) => (p.pos = i + 1));
  return { ranqueados: comFicha, semFicha };
};

/** Fontes renderizáveis: descarta entradas corrompidas (título/url de
 *  placeholder da migração ou URL sem http) para que nenhum link morto
 *  chegue à interface. */
export const fontesValidas = (fontes: Fonte[] | undefined): Fonte[] =>
  (fontes ?? []).filter(
    (f) =>
      typeof f?.titulo === "string" &&
      f.titulo.trim().toLowerCase() !== "titulo" &&
      typeof f?.url === "string" &&
      /^https?:\/\//.test(f.url.trim()) &&
      f.url.trim().toLowerCase() !== "url",
  );

/** Ficha completa (tipo Candidato) a partir de um apto ranqueado; textos
 *  nulos e resumo caem para o padrão de triagem. */
export const fichaDeApto = (p: PosicaoApto, cargo: Cargo): Candidato => {
  const { apto, score, pos } = p;
  const padroes = dados.textos_padrao?.triagem ?? {};
  const criterios = {} as Record<ChaveCriterio, Criterio>;
  for (const c of CRITERIOS) {
    const cr = apto.criterios?.[c.chave];
    if (!cr) continue;
    criterios[c.chave] = {
      nota: cr.nota,
      nivel: cr.nivel,
      texto: cr.texto ?? padroes[c.chave] ?? "Sem evidências específicas localizadas.",
      sem_historico: cr.sem_historico || undefined,
      sem_proposta: cr.sem_proposta || undefined,
      proposta_outro_cargo: cr.proposta_outro_cargo || undefined,
    };
  }
  return {
    nome_urna: apto.nome_urna,
    partido: apto.partido,
    numero: apto.numero,
    vice: apto.vice ?? "",
    coligacao: apto.coligacao ?? "",
    foto: apto.foto ?? "",
    slug: apto.slug ?? "",
    foto_url: apto.foto_url ?? "",
    resumo: apto.resumo || (apto.base === "triagem" ? padroes.resumo ?? "" : ""),
    criterios,
    score_total: score,
    ranking: pos,
    fontes: fontesValidas(apto.fontes),
  };
};

/** Política de notas para candidaturas sem histórico (transparência ao
 *  eleitor): critérios que avaliam resultados de governar presumem
 *  experiência prévia; quem nunca a teve não é penalizado por isso: a nota
 *  considera o plano de governo, compromissos públicos e medidas concretas
 *  propostas em outros cargos públicos no tema, quando existirem e
 *  estiverem corroboradas por dados públicos verificáveis. Nota abaixo de 5
 *  nesses casos ocorre apenas com evidências contrárias documentadas ou com
 *  ausência total de proposta, de compromisso público e de medida concreta
 *  em outro cargo (selo rosa na ficha). */
export const POLITICA_HISTORICO = {
  titulo: "Regra de justiça nas notas",
  ficha:
    "Critérios que avaliam resultados de governar presumem experiência prévia no cargo ou em outros cargos. Quem nunca exerceu esses cargos não recebe nota baixa por essa ausência: a nota considera o plano de governo, os compromissos públicos e as medidas concretas propostas em outros cargos públicos no tema, quando existirem e estiverem corroboradas por dados públicos verificáveis. A nota só fica abaixo de 5 quando há evidências contrárias documentadas ou quando a candidatura não apresenta proposta no plano de governo, compromisso público nem medida concreta em outro cargo no tema, caso sempre marcado com o selo “Sem proposta nem compromisso”.",
  metodologia:
    "Critérios que avaliam resultados de governar (gestão, fiscal, social, mobilidade, saúde, educação, segurança, emprego, moradia e outros) presumem experiência prévia no cargo ou em outros cargos. Quem nunca exerceu esses cargos não recebe nota baixa por essa ausência: a nota considera o plano de governo, os compromissos públicos e as medidas concretas propostas em outros cargos públicos no tema, quando existirem e estiverem corroboradas por dados públicos verificáveis. Ela pode ficar abaixo de 5 apenas quando há evidências contrárias documentadas ou quando a candidatura não apresenta proposta no plano de governo, compromisso público nem medida concreta em outro cargo no tema, casos sempre marcados nas fichas com o selo “Sem proposta nem compromisso”, para total transparência e embasamento das notas.",
  seloSemProposta:
    "Sem proposta nem compromisso: nenhuma proposta no plano de governo, nenhum compromisso público e nenhuma medida concreta em outro cargo público localizados neste tema; a nota reflete essa ausência, e não a falta de histórico.",
  seloSemHistorico:
    "Sem histórico prévio: o critério depende de experiência que a candidatura ainda não teve; a nota considera propostas, compromissos públicos e medidas concretas em outros cargos e não é reduzida pela ausência de histórico.",
  seloPropostaOutroCargo: "Medida concreta em outro cargo público",
};

/** Notas fixas do perfil de triagem (candidatura sem registros públicos
 *  localizados), definidas no pipeline de análise (scripts/build_final.py) e
 *  idênticas para todas as candidaturas de triagem; servem para recalcular a
 *  nota padrão de qualquer cargo com a régua do usuário. Os critérios novos
 *  (saúde, educação, segurança, emprego e moradia) recebem nota neutra 3:
 *  candidatura de triagem é exatamente o caso de penalização por ausência
 *  de proposta e de compromisso localizáveis.
 *  Com a régua padrão da redação atual, reproduz 3,44 no Presidente e no DF. */
export const NOTAS_TRIAGEM: Record<ChaveCriterio, number> = {
  transparencia: 4,
  desenvolvimento: 3,
  honestidade: 5,
  ambiental: 3,
  soberania: 3,
  tecnologia: 3,
  democracia: 5,
  gestao: 3,
  fiscal: 4,
  social: 3,
  mobilidade: 3,
  saude: 3,
  educacao: 3,
  seguranca: 3,
  emprego: 3,
  moradia: 3,
};

/** Nota padrão de triagem do cargo recalculada com a régua do usuário. Com
 *  a régua padrão da redação atual reproduz 3,42 no Presidente e 3,44 no DF;
 *  com a sugestão da redação em três graus (4 essenciais), 3,61 e 3,64. */
export const notaTriagemCargo = (
  cargo: Cargo,
  escolha: EscolhaCriterios,
): number => {
  const pesos = pesosPersonalizados(cargo, escolha);
  const aplicaveis = chavesAplicaveis(cargo);
  const bruto = aplicaveis.reduce((s, c) => s + NOTAS_TRIAGEM[c] * pesos[c], 0);
  return Math.round(bruto * 100) / 100;
};

/** Percentual em formato brasileiro (uma casa quando necessário). */
export const formatPct = (p: number): string => {
  const v = Math.round(p * 1000) / 10;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",")) + "%";
};

export const NIVEL_INFO: Record<Nivel, { label: string; cor: string; desc: string }> = {
  A: {
    label: "Evidência A",
    cor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-900",
    desc: "Transitada em julgado, tribunal de contas ou registro oficial",
  },
  B: {
    label: "Evidência B",
    cor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-900",
    desc: "Investigação formal em curso, decisão de 1º grau ou dado oficial revisável",
  },
  C: {
    label: "Evidência C",
    cor: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
    desc: "Reportagem, posicionamento público ou declaração sem comprovação documental",
  },
};

export const corNota = (n: number): string => {
  if (n >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 6) return "text-lime-600 dark:text-lime-400";
  if (n >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

export const iniciais = (nome: string): string => {
  const limpo = nome.replace(/^(ESCRITOR|ESCRITORA|PROFESSOR|PROFESSORA|DEPUTAD[OA]|DR\.?|SENADOR[A]?)\s+/i, "");
  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};
