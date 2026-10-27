"use client";

// Ficha de pessoa: uma folha de expediente físico tirada da mesa escura.
// Papel claro, máquina de escrever, carimbos de tinta, marca d'água, furos
// de arquivo, fotografias grampeadas e rodapé de formulário oficial.

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Share2, X } from "lucide-react";
import { meta } from "@/lib/master";
import {
  esquemasDePessoa,
  fatosDePessoa,
  grupos,
  numeroFichaPorId,
  pessoaPorId,
  type Pessoa,
} from "@/lib/master";
import { Avatar, CarimboDoc, FontesList, MarcaAgua, SeloCircular } from "./atoms";

const rotuloStatus: Record<string, string> = {
  preso: "DETIDO",
  investigado: "SOB INVESTIGAÇÃO",
  colaborador: "COLABORADOR",
  institucional: "CARGO INSTITUCIONAL",
  falecido: "FALECIDO",
};

/* Tintas de status sobre papel claro */
const corStatusPapel: Record<string, string> = {
  preso: "#a03434",
  investigado: "#8a5410",
  colaborador: "#1c6b48",
  institucional: "#5d5138",
  falecido: "#5d5138",
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="campo-rotulo">{rotulo}</dt>
      <dd className="campo-valor mt-0.5 text-[0.92rem] font-bold leading-snug">{children}</dd>
    </div>
  );
}

export function PerfilPessoa({
  pessoa,
  aoAbrirFato,
  aoFechar,
}: {
  pessoa: Pessoa;
  aoAbrirFato: (id: string) => void;
  aoFechar: () => void;
}) {
  const fatos = fatosDePessoa(pessoa.id);
  const esquemasRel = esquemasDePessoa(pessoa.id);
  const ficha = String(numeroFichaPorId.get(pessoa.id) ?? 0).padStart(3, "0");
  return (
    <div className="folha relative overflow-hidden rounded-md">
      <MarcaAgua texto="CASO MASTER · MATERIAL PÚBLICO" />

      {/* furos de arquivo */}
      <div
        className="absolute top-0 left-3.5 hidden h-full flex-col items-center justify-center gap-28 sm:flex"
        aria-hidden
      >
        <span className="furo" />
        <span className="furo" />
        <span className="furo" />
      </div>

      {/* botão de fechar, em tinta sobre o papel */}
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar ficha"
        className="absolute top-3 right-3 z-20 grid size-8 place-items-center rounded-sm border border-[rgba(70,50,20,0.4)] text-[#241b0d] transition-colors hover:bg-[rgb(60,42,16,0.1)]"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="relative z-10 px-5 py-6 sm:px-10 sm:py-8 sm:pl-14">
        <DialogHeader>
          <div className="form-topo flex items-start justify-between gap-4 pb-3.5">
            <div className="min-w-0">
              <p className="campo-rotulo !text-[0.6rem]">
                Dossiê de indivíduo · Formulário único · Via pública
              </p>
              <DialogTitle className="manchete mt-1.5 text-left text-3xl leading-[1.02] font-bold text-[#241b0d] sm:text-4xl">
                {pessoa.nome}
              </DialogTitle>
              {pessoa.nomeCompleto && pessoa.nomeCompleto !== pessoa.nome && (
                <p className="maquina mt-1 text-[0.82rem] text-[#5d5138]">{pessoa.nomeCompleto}</p>
              )}
            </div>
            <CarimboDoc grau={pessoa.grau} className="mt-1 shrink-0 !text-[0.78rem] sm:!text-[0.9rem]" />
          </div>
        </DialogHeader>

        {/* fotografia grampeada + campos do formulário */}
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
          <figure className="mx-auto w-36 shrink-0 sm:mx-0">
            <div className="relative rotate-[0.6deg] border-[7px] border-[#f8f4e8] bg-[#f8f4e8] shadow-[0_4px_14px_rgb(60,42,16,0.3)]">
              <Avatar
                pessoa={pessoa}
                className="h-40 w-full object-cover grayscale-[0.2] sepia-[0.08]"
                inicialClassName="!h-40 text-3xl !text-[#5d5138]"
              />
              {/* clip de metal */}
              <span
                className="absolute -top-2.5 left-1/2 h-6 w-6 -translate-x-1/2 rounded-[3px] border border-[#8f8570] bg-gradient-to-b from-[#e6e0ce] via-[#bfb795] to-[#98907a] shadow-sm"
                aria-hidden
              />
            </div>
            <figcaption className="maquina mt-1.5 text-center text-[9px] tracking-[0.18em] text-[#5d5138] uppercase">
              Fotografia oficial · FICHA-{ficha}
            </figcaption>
          </figure>

          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
            <Campo rotulo="Função no caso">{pessoa.papel}</Campo>
            <Campo rotulo="Situação atual">
              <span
                className="inline-block rounded-[3px] border px-1.5 py-0.5 text-[0.72rem] font-bold tracking-[0.1em]"
                style={{
                  color: corStatusPapel[pessoa.statusTipo] ?? "#241b0d",
                  borderColor: `${corStatusPapel[pessoa.statusTipo] ?? "#241b0d"}66`,
                }}
              >
                {rotuloStatus[pessoa.statusTipo] ?? pessoa.status}
              </span>
            </Campo>
            <Campo rotulo="Grupo de atuação">{grupos[pessoa.grupo] ?? pessoa.grupo}</Campo>
            <Campo rotulo="Número de registro">{`FICHA-${ficha} · VIA ÚNICA`}</Campo>
            <Campo rotulo="Ocorrências no expediente">{String(fatos.length).padStart(2, "0")}</Campo>
            <Campo rotulo="Operações vinculadas">{String(esquemasRel.length).padStart(2, "0")}</Campo>
          </dl>
        </div>

        {/* sumário */}
        <section className="mt-6">
          <h4 className="campo-rotulo flex items-center gap-2">
            <FileText className="size-3.5" aria-hidden />
            Sumário da apuração
          </h4>
          <p className="maquina mt-2 border-l-2 border-[rgba(70,50,20,0.35)] pl-3.5 text-[0.92rem] leading-[1.75] text-[#241b0d]">
            {pessoa.resumo}
          </p>
        </section>

        {/* ocorrências da linha do tempo */}
        {fatos.length > 0 && (
          <section className="mt-6">
            <h4 className="campo-rotulo">Ocorrências registradas ({fatos.length})</h4>
            <ul className="mt-2 max-h-64 space-y-0 overflow-y-auto rounded-sm border border-[rgba(70,50,20,0.25)] bg-[rgb(255,252,242,0.45)] pr-1">
              {fatos.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => aoAbrirFato(f.id)}
                    className="flex w-full flex-col gap-0.5 border-b border-[rgba(70,50,20,0.16)] px-3 py-2 text-left transition-colors last:border-0 hover:bg-[rgb(60,42,16,0.07)]"
                  >
                    <span className="maquina text-[10px] font-bold tracking-[0.14em] text-[#8a5410]">
                      {f.dataLabel}
                    </span>
                    <span className="maquina text-[0.86rem] leading-snug font-bold text-[#241b0d]">{f.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* operações vinculadas */}
        {esquemasRel.length > 0 && (
          <section className="mt-6">
            <h4 className="campo-rotulo">Operações vinculadas a este indivíduo</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {esquemasRel.map((e) => (
                <a
                  key={e.id}
                  href={`/rede/${e.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Abrir a rede 3D de conexões da operação ${e.nome} em nova aba, em tela cheia`}
                  className="maquina inline-flex items-center gap-1.5 rounded-[3px] border border-[rgba(70,50,20,0.45)] bg-[rgb(60,42,16,0.06)] px-2.5 py-1.5 text-[0.72rem] font-bold tracking-[0.08em] text-[#241b0d] uppercase transition-colors hover:bg-[rgb(60,42,16,0.13)]"
                >
                  <Share2 className="size-3" aria-hidden />
                  {e.nome}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* referências */}
        <section className="mt-6">
          <FontesList fontes={pessoa.fontes} papel />
        </section>

        {/* rodapé de formulário */}
        <div className="form-rodape mt-7 flex items-end justify-between gap-4 pt-3">
          <div className="min-w-0 flex-1">
            <div className="codigo-barras w-36 opacity-75" aria-hidden />
            <p className="maquina mt-1 text-[9px] tracking-[0.32em] text-[#5d5138] uppercase">
              7912-CASO-MASTER-{ficha}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="maquina text-[9.5px] leading-relaxed text-[#5d5138] uppercase">
              Folha 1 de 1 · Compilado em {meta.atualizacao}
            </p>
            <p className="maquina text-[9.5px] leading-relaxed text-[#5d5138] uppercase">
              Sem valor de acusação · Presunção de inocência
            </p>
          </div>
          <SeloCircular
            texto="DOSSIÊ PÚBLICO · FONTE VERIFICÁVEL ·"
            centro="PÚBLICO"
            className="size-[4.5rem] shrink-0 text-[#8a6a1c]"
          />
        </div>
      </div>
    </div>
  );
}

export default function PerfilDialog({
  pessoaId,
  aoFechar,
  aoAbrirFato,
}: {
  pessoaId: string | null;
  aoFechar: () => void;
  aoAbrirFato: (id: string) => void;
}) {
  const pessoa = pessoaId ? pessoaPorId.get(pessoaId) : undefined;
  return (
    <Dialog open={Boolean(pessoa)} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-md border-0 bg-transparent p-0 shadow-none sm:max-w-3xl"
      >
        {pessoa && <PerfilPessoa pessoa={pessoa} aoAbrirFato={aoAbrirFato} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  );
}
