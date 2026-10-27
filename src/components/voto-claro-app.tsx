"use client";

import { useState, useSyncExternalStore } from "react";
import {
  CRITERIOS,
  type ChaveCriterio,
  type EscolhaCriterios,
  type GrauImportancia,
} from "@/lib/analise";
import SelecaoCriterios from "@/components/selecao-criterios";
import Dashboard from "@/components/dashboard";

// v3: régua com os graus essencial, importante e irrelevante (irrelevante
// fica de fora do cálculo). A v2 guardava os graus essencial, muito
// importante e importante com proporção 3:2:1; nela, o valor 0 significava
// "importante", e reaproveitar a régua antiga transformaria critérios
// importantes em irrelevantes. Por isso a v2 é ignorada e o usuário refaz
// a escolha. A v1 guardava booleanos (principal/comum) e também é ignorada.
const CHAVE_STORAGE = "voto-claro:regua-v3";

const chavesValidas = new Set<string>(CRITERIOS.map((c) => c.chave));

/** Cache da leitura do armazenamento: mantém a referência do snapshot
 *  estável entre chamadas (exigência do useSyncExternalStore). */
const cache = { bruto: null as string | null, valor: null as EscolhaCriterios | null };

const interpretar = (bruto: string | null): EscolhaCriterios | null => {
  if (!bruto) return null;
  try {
    const obj = JSON.parse(bruto);
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const escolha: EscolhaCriterios = {};
    for (const [k, v] of Object.entries(obj)) {
      if (
        typeof k === "string" &&
        chavesValidas.has(k) &&
        (v === 0 || v === 1 || v === 2)
      ) {
        escolha[k as ChaveCriterio] = v as GrauImportancia;
      }
    }
    return escolha;
  } catch {
    return null;
  }
};

const lerRegua = (): EscolhaCriterios | null => {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (bruto !== cache.bruto) {
    cache.bruto = bruto;
    cache.valor = interpretar(bruto);
  }
  return cache.valor;
};

const lerReguaServidor = (): EscolhaCriterios | null => null;

const inscrever = (aoMudar: () => void) => {
  window.addEventListener("storage", aoMudar);
  return () => window.removeEventListener("storage", aoMudar);
};

const salvarEscolha = (escolha: EscolhaCriterios) => {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(escolha));
    cache.bruto = null; // força releitura da régua no próximo snapshot
  } catch {
    /* armazenamento indisponível: a régua vale apenas nesta sessão */
  }
};

export default function VotoClaroApp() {
  // Régua persistida: undefined = ainda desconhecida (render do servidor);
  // null = sem régua salva; objeto = régua de um acesso anterior.
  const reguaSalva = useSyncExternalStore(inscrever, lerRegua, lerReguaServidor);
  const [escolha, setEscolha] = useState<EscolhaCriterios | null>(null);
  const [editando, setEditando] = useState(false);

  const confirmar = (nova: EscolhaCriterios) => {
    salvarEscolha(nova);
    setEscolha(nova);
    setEditando(false);
  };

  if (reguaSalva === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-muted-foreground" role="status">
          Carregando o Voto Claro...
        </p>
      </div>
    );
  }

  const efetiva = escolha ?? reguaSalva ?? {};
  const temRegua = escolha !== null || reguaSalva !== null;

  // Sem régua salva (ou editando), o app abre na interface de escolha;
  // confirmada a régua, o ranking personalizado é exibido.
  if (!temRegua || editando) {
    return (
      <SelecaoCriterios
        valor={efetiva}
        aoConfirmar={confirmar}
        aoCancelar={editando ? () => setEditando(false) : undefined}
      />
    );
  }

  return <Dashboard escolha={efetiva} aoAbrirEscolha={() => setEditando(true)} />;
}
