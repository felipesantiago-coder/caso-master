"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  esquemasDePessoa,
  fatosDePessoa,
  grupos,
  pessoaPorId,
  type Pessoa,
} from "@/lib/master";
import { Avatar, FontesList, GrauBadge, corStatus } from "./atoms";

export function PerfilPessoa({ pessoa, aoAbrirFato }: { pessoa: Pessoa; aoAbrirFato: (id: string) => void }) {
  const fatos = fatosDePessoa(pessoa.id);
  const esquemasRel = esquemasDePessoa(pessoa.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar
          pessoa={pessoa}
          className="size-24 shrink-0 rounded-2xl border border-border object-cover sm:size-28"
          inicialClassName="text-2xl"
        />
        <div className="min-w-0">
          <h3 className="text-2xl font-bold tracking-tight">{pessoa.nome}</h3>
          {pessoa.nomeCompleto && pessoa.nomeCompleto !== pessoa.nome && (
            <p className="mt-0.5 text-sm text-muted-foreground">{pessoa.nomeCompleto}</p>
          )}
          <p className="mt-1.5 text-sm font-medium text-foreground/85">{pessoa.papel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${corStatus[pessoa.statusTipo]}`}
            >
              {pessoa.status}
            </span>
            <GrauBadge grau={pessoa.grau} />
            <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {grupos[pessoa.grupo] ?? pessoa.grupo}
            </span>
          </div>
        </div>
      </div>

      <p className="leading-relaxed text-foreground/85">{pessoa.resumo}</p>

      {fatos.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Aparece em {fatos.length} {fatos.length === 1 ? "fato da linha do tempo" : "fatos da linha do tempo"}
          </p>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {fatos.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => aoAbrirFato(f.id)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground">{f.dataLabel}</span>
                  <p className="mt-0.5 text-sm font-medium leading-snug">{f.titulo}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {esquemasRel.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {esquemasRel.map((e) => (
            <span
              key={e.id}
              className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              {e.nome}
            </span>
          ))}
        </div>
      )}

      <FontesList fontes={pessoa.fontes} />
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
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {pessoa && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Ficha de {pessoa.nome}</DialogTitle>
            </DialogHeader>
            <PerfilPessoa pessoa={pessoa} aoAbrirFato={aoAbrirFato} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
