"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

type Modo = "light" | "dark" | "system";

const ORDEM: Modo[] = ["light", "dark", "system"];

const ROTULO: Record<Modo, string> = {
  light: "Tema claro",
  dark: "Tema escuro",
  system: "Tema do sistema",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Estado sincronizado apenas no cliente evita divergência de hidratação
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const atual = (montado && (theme as Modo)) || "system";
  const proximo = ORDEM[(ORDEM.indexOf(atual) + 1) % ORDEM.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(proximo)}
      aria-label="Alternar entre tema claro, escuro e do sistema"
      title="Tema: claro, escuro ou do sistema"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-700 shadow-soft ring-1 ring-zinc-100 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-reduce:transition-none dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:text-emerald-400"
    >
      {/* Dois ícones alternados por CSS: sem risco de mismatch de hidratação */}
      <Sun className="h-4 w-4 dark:hidden" aria-hidden />
      <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
      <span className="sr-only">Escolher tema: claro, escuro ou do sistema</span>
    </button>
  );
}
