"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { buscar, normalizar, type Pessoa } from "@/lib/master";
import { Avatar, Kicker, useReveal, EtiquetaParte } from "./atoms";

function Resultados({
  termo,
  onPessoa,
  aoAbrirFato,
  aoAbrirEsquema,
}: {
  termo: string;
  onPessoa: (id: string) => void;
  aoAbrirFato: (id: string) => void;
  aoAbrirEsquema: (id: string) => void;
}) {
  const r = buscar(termo);
  const total = r.pessoas.length + r.fatos.length + r.esquemas.length;

  if (termo.trim().length < 2) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Digite pelo menos duas letras: um nome, um banco, uma operação, um valor.
      </p>
    );
  }
  if (total === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nada encontrado para <span className="font-semibold text-foreground">{termo}</span>. Tente outra grafia, como
        Vorcaro, Tirreno, FGC, Compliance Zero ou Rioprevidência.
      </p>
    );
  }

  const grupo = (titulo: string, itens: React.ReactNode, qtd: number) => (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {titulo} ({qtd})
      </p>
      <div className="mt-3 space-y-2">{itens}</div>
    </div>
  );

  return (
    <div className="space-y-7">
      <p className="font-mono text-[11px] text-muted-foreground">
        {total} {total === 1 ? "resultado" : "resultados"} para <span className="text-foreground">{termo}</span>
      </p>
      {r.pessoas.length > 0 &&
        grupo(
          "Pessoas",
          r.pessoas.map((p: Pessoa) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPessoa(p.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <Avatar pessoa={p} className="size-9 shrink-0 rounded-lg border border-border" inicialClassName="text-[10px]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{p.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.papel}</span>
              </span>
            </button>
          )),
          r.pessoas.length
        )}
      {r.esquemas.length > 0 &&
        grupo(
          "Esquemas",
          r.esquemas.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => aoAbrirEsquema(e.id)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <span className="block text-sm font-bold">{e.nome}</span>
              <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{e.subtitulo}</span>
            </button>
          )),
          r.esquemas.length
        )}
      {r.fatos.length > 0 &&
        grupo(
          "Linha do tempo",
          r.fatos.slice(0, 12).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => aoAbrirFato(f.id)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">{f.dataLabel}</span>
              <span className="mt-0.5 block text-sm font-medium leading-snug">{f.titulo}</span>
            </button>
          )),
          r.fatos.length
        )}
    </div>
  );
}

export function BuscaSection({
  termo,
  setTermo,
  onPessoa,
  aoAbrirFato,
  aoAbrirEsquema,
}: {
  termo: string;
  setTermo: (t: string) => void;
  onPessoa: (id: string) => void;
  aoAbrirFato: (id: string) => void;
  aoAbrirEsquema: (id: string) => void;
}) {
  const ref = useReveal<HTMLElement>();
  const semAcento = normalizar(termo);
  return (
    <section id="busca" ref={ref} className="glow-soft scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <EtiquetaParte n="06" folhas="consulta em todas as folhas" />
          <Kicker>Ferramenta de apuração · Busca livre</Kicker>
          <h2 className="display-sm mt-4">Faça a sua apuração: busque qualquer nome</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            A busca cobre todas as fichas de pessoas, os {`fatos`} da linha do tempo e os esquemas explicados, sem
            diferenciar acentos ou maiúsculas. Também funciona pelo botão Buscar do topo, em qualquer ponto da página,
            com a tecla <kbd className="rounded border border-border bg-secondary px-1.5 font-mono text-[11px]">/</kbd>.
          </p>
        </div>

        <div className="reveal mt-8">
          <label className="relative block max-w-2xl">
            <span className="sr-only">Buscar pessoas, fatos e esquemas</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Ex.: Vorcaro, Moraes, Tirreno, Rioprevidência, FGC..."
              className="h-13 w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-11 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
            />
            {termo && (
              <button
                type="button"
                onClick={() => setTermo("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </label>
          <div className="mt-6">{semAcento && <Resultados termo={termo} onPessoa={onPessoa} aoAbrirFato={aoAbrirFato} aoAbrirEsquema={aoAbrirEsquema} />}</div>
        </div>
      </div>
    </section>
  );
}

export function BuscaOverlay({
  aberto,
  fechar,
  termo,
  setTermo,
  onPessoa,
  aoAbrirFato,
  aoAbrirEsquema,
}: {
  aberto: boolean;
  fechar: () => void;
  termo: string;
  setTermo: (t: string) => void;
  onPessoa: (id: string) => void;
  aoAbrirFato: (id: string) => void;
  aoAbrirEsquema: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (aberto) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-background/92 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
    >
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <div className="flex items-center justify-between">
          <p className="kicker">Busca no dossiê</p>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar busca"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <label className="relative mt-6 block">
          <span className="sr-only">Buscar pessoas, fatos e esquemas</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome de uma pessoa, operação, valor..."
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none"
          />
        </label>
        <div className="mt-8">
          <Resultados
            termo={termo}
            onPessoa={(id) => {
              fechar();
              onPessoa(id);
            }}
            aoAbrirFato={(id) => {
              fechar();
              aoAbrirFato(id);
            }}
            aoAbrirEsquema={(id) => {
              fechar();
              aoAbrirEsquema(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
