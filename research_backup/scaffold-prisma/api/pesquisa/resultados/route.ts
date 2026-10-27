import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dados } from "@/lib/analise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Resultados agregados da pesquisa: apenas totais por cargo e candidato.
 * Nenhum dado individual existe no banco — os votos ficam em tabela sem
 * vínculo com o identificador de deduplicação. */

export interface ResultadoCandidato {
  slug: string;
  votos: number;
}

export async function GET() {
  try {
    const agrupado = await db.votoPesquisa.groupBy({
      by: ["cargo", "candidatoSlug"],
      _count: { _all: true },
    });

    const porCargo = new Map<string, Map<string, number>>();
    for (const linha of agrupado) {
      let mapa = porCargo.get(linha.cargo);
      if (!mapa) {
        mapa = new Map<string, number>();
        porCargo.set(linha.cargo, mapa);
      }
      mapa.set(linha.candidatoSlug, linha._count._all);
    }

    const resultados = dados.cargos.map((cargo) => {
      const contagens = porCargo.get(cargo.cargo) ?? new Map<string, number>();
      const itens: ResultadoCandidato[] = [
        ...cargo.candidatos.map((c) => ({
          slug: c.slug,
          votos: contagens.get(c.slug) ?? 0,
        })),
        { slug: "__branco", votos: contagens.get("__branco") ?? 0 },
      ];
      itens.sort((a, b) => b.votos - a.votos);
      const total = itens.reduce((s, i) => s + i.votos, 0);
      return {
        cargo: cargo.cargo,
        titulo: cargo.titulo,
        total,
        candidatos: itens,
      };
    });

    // Cada cédula contém todos os cargos; o total de participantes é o
    // total de qualquer cargo (usamos o maior, por robustez).
    const participantes = resultados.reduce(
      (m, r) => Math.max(m, r.total),
      0,
    );

    return NextResponse.json(
      { participantes, resultados, geradoEm: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json({ erro: "indisponivel" }, { status: 500 });
  }
}
