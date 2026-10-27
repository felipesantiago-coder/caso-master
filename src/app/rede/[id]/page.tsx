// Rota do infográfico em tela cheia: /rede/geral/ e /rede/<esquema>/
// Exportação estática com generateStaticParams; abre em nova aba a partir do dossiê.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esquemas } from "@/lib/master";
import { rede } from "@/lib/network";
import RedePage from "@/components/master/rede/rede-page";

export function generateStaticParams(): { id: string }[] {
  return [{ id: "geral" }, ...esquemas.map((e) => ({ id: e.id }))];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = rede(id);
  if (!r) return { title: "Rede de conexões | Caso Master" };
  const nome = id === "geral" ? "A teia completa do Caso Master" : `${r.titulo}: rede de conexões do esquema`;
  return {
    title: `${nome} | Caso Master`,
    description: `${r.subtitulo}. Rede 3D interativa com ${r.nos.length} pessoas e conexões do Caso Banco Master e Daniel Vorcaro, com grau de comprovação e fontes.`,
  };
}

export default async function PaginaRede({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!rede(id)) notFound();
  return <RedePage id={id} />;
}
