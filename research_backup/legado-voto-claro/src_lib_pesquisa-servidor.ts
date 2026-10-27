import { createHmac, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { dados } from "@/lib/analise";

/* ------------------------------------------------------------------ */
/* Pesquisa eleitoral: camada de servidor                              */
/*                                                                     */
/* Objetivo: um voto por pessoa em cada cargo, sem identificar ninguém. */
/* A chave de deduplicação é um HMAC-SHA256(sal secreto, ip|ua|impressão| */
/* cargo): unidirecional e salgada — o banco nunca guarda IP, user-agent */
/* ou a impressão em claro, e os votos ficam em tabela separada, sem    */
/* qualquer vínculo com a chave.                                        */
/* ------------------------------------------------------------------ */

const CHAVE_SAL = "sal_pesquisa";

/** Mapa cargo → slugs válidos (inclui voto em branco), derivado do JSON. */
const slugsPorCargo: Map<string, Set<string>> = (() => {
  const mapa = new Map<string, Set<string>>();
  for (const cargo of dados.cargos) {
    mapa.set(
      cargo.cargo,
      new Set(["__branco", ...cargo.candidatos.map((c) => c.slug)]),
    );
  }
  return mapa;
})();

export const cargosDisponiveis = () => dados.cargos.map((c) => c.cargo);

/** Sal secreto do servidor, criado uma única vez e persistido no banco. */
export const obterSal = async (): Promise<string> => {
  const existente = await db.configuracao.findUnique({
    where: { chave: CHAVE_SAL },
  });
  if (existente) return existente.valor;
  const valor = randomBytes(32).toString("hex");
  // upsert resolve corrida entre duas requisições simultâneas na criação
  const criado = await db.configuracao.upsert({
    where: { chave: CHAVE_SAL },
    update: {},
    create: { chave: CHAVE_SAL, valor },
  });
  return criado.valor;
};

/** Códigos unidirecionais de deduplicação de um eleitor em um cargo.
 *  Duas camadas independentes, cada uma capaz de recusar o segundo voto:
 *  - perfil: impressão do navegador + cargo (pega quem limpa cookies e
 *    troca de rede/VPN, mas usa o mesmo navegador e dispositivo);
 *  - rede: IP + user-agent + cargo (pega quem refaz a impressão — perfil
 *    novo ou armazenamento limpo — mas volta pela mesma rede e app).
 *  Nenhuma das duas permite reconstruir o IP ou identificar a pessoa. */
export const chavesEleitor = (
  sal: string,
  ip: string,
  agente: string,
  impressao: string,
  cargo: string,
): string[] => [
  createHmac("sha256", sal).update(`${impressao}|${cargo}`).digest("hex"),
  createHmac("sha256", sal).update(`${ip}|${agente}|${cargo}`).digest("hex"),
];

/** IP do cliente conforme os cabeçalhos do proxy reverso. */
export const ipDoCliente = (req: Request): string => {
  const repassado = req.headers.get("x-forwarded-for");
  if (repassado) {
    const primeiro = repassado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  return req.headers.get("x-real-ip")?.trim() || "desconhecido";
};

/* ------------------------------------------------------------------ */
/* Limitação de taxa em memória do processo: freia tentativas em massa */
/* (8 tentativas por IP a cada 10 min, com 20 s entre tentativas).     */
/* ------------------------------------------------------------------ */

const MAX_TENTATIVAS = 8;
const JANELA_MS = 10 * 60_000;
const INTERVALO_MS = 20_000;

const tentativas = new Map<string, { n: number; janelaAte: number; ultimo: number }>();

export type VereditoLimite = "ok" | "cooldown" | "excedido";

export const limiteExcedido = (ip: string): VereditoLimite => {
  const agora = Date.now();
  const registro = tentativas.get(ip);
  if (!registro || registro.janelaAte <= agora) {
    tentativas.set(ip, { n: 1, janelaAte: agora + JANELA_MS, ultimo: agora });
    return "ok";
  }
  if (agora - registro.ultimo < INTERVALO_MS) return "cooldown";
  registro.ultimo = agora;
  registro.n += 1;
  return registro.n > MAX_TENTATIVAS ? "excedido" : "ok";
};

/** Valida as escolhas contra o JSON: cargos existentes, sem repetição e
 *  candidato (ou branco) pertencente ao cargo. Devolve o erro ou nulo. */
export const validarEscolhas = (
  escolhas: { cargo: string; candidato: string }[],
): string | null => {
  const cargos = cargosDisponiveis();
  if (escolhas.length !== cargos.length) return "cargos_incompletos";
  const vistos = new Set<string>();
  for (const e of escolhas) {
    if (vistos.has(e.cargo)) return "cargo_repetido";
    vistos.add(e.cargo);
    const slugs = slugsPorCargo.get(e.cargo);
    if (!slugs || !slugs.has(e.candidato)) return "candidato_invalido";
  }
  return null;
};
