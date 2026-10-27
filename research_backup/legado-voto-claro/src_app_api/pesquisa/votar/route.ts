import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  chavesEleitor,
  ipDoCliente,
  limiteExcedido,
  obterSal,
  validarEscolhas,
} from "@/lib/pesquisa-servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Tempo mínimo de preenchimento (ms): preenchimentos abaixo disso são
 * tratados como bot e recebem um erro genérico, sem registrar voto. */
const TEMPO_MINIMO_MS = 1500;

const EsquemaVoto = z.object({
  escolhas: z
    .array(
      z.object({
        cargo: z.string().min(1).max(40),
        candidato: z.string().min(1).max(60),
      }),
    )
    .min(1)
    .max(8),
  impressao: z.string().regex(/^[0-9a-f]{16,256}$/i),
  decorridoMs: z.number().int().min(0).max(3_600_000),
  // campo-isca (honeypot): humanos não o veem nem o preenchem
  isca: z.string().max(0).optional(),
});

const falha = (erro: string, status: number) =>
  NextResponse.json({ erro }, { status });

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return falha("invalido", 400);
  }

  const ip = ipDoCliente(req);
  const veredito = limiteExcedido(ip);
  if (veredito !== "ok") return falha("muitas_tentativas", 429);

  const parsed = EsquemaVoto.safeParse(corpo);
  if (!parsed.success) return falha("invalido", 400);
  const { escolhas, impressao, decorridoMs, isca } = parsed.data;

  // Isca preenchida ou preenchimento inhumanamente rápido: resposta
  // genérica, sem revelar o motivo e sem registrar nada.
  if (isca || decorridoMs < TEMPO_MINIMO_MS) return falha("invalido", 400);

  const erroEscolhas = validarEscolhas(escolhas);
  if (erroEscolhas) return falha("invalido", 400);

  try {
    const sal = await obterSal();
    const agente = req.headers.get("user-agent") ?? "";

    await db.$transaction(async (tx) => {
      // As chaves das duas camadas entram na mesma transação, que garante
      // tudo-ou-nada: se qualquer chave já existir, nada é gravado.
      for (const e of escolhas) {
        for (const chave of chavesEleitor(sal, ip, agente, impressao, e.cargo)) {
          await tx.chaveEleitor.create({ data: { chave } });
        }
      }
      await tx.votoPesquisa.createMany({
        data: escolhas.map((e) => ({
          cargo: e.cargo,
          candidatoSlug: e.candidato,
        })),
      });
    });
  } catch (err) {
    // Violação de unicidade: este eleitor já tinha registrado voto.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return falha("ja_votou", 409);
    }
    return falha("indisponivel", 500);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
