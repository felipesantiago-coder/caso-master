"use client";

// Secao da linha do tempo reformulada: uma maquina de microfilme 3D projeta
// a cronologia completa do caso, quadro a quadro, com navegacao por botoes
// da propria maquina, barra de controles acessivel, folha de contato e
// transcricao do quadro atual.

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, MoveVertical, MousePointerClick } from "lucide-react";
import { contagens, timeline } from "@/lib/master";
import { EtiquetaParte, Kicker, useReveal } from "./atoms";
import Microfilme from "./microfilme";

export default function Timeline({
  onPessoa,
  focoEventoId,
  aoLimparFoco,
}: {
  onPessoa: (id: string) => void;
  focoEventoId: string | null;
  aoLimparFoco: () => void;
}) {
  const ref = useReveal<HTMLElement>();
  const [indice, setIndice] = useState(0);
  const [secaoVisivel, setSecaoVisivel] = useState(false);

  // ajuste de estado na renderizacao: aplica o foco vindo da busca/perfil
  const [focoAnterior, setFocoAnterior] = useState<string | null>(null);
  if (focoEventoId && focoEventoId !== focoAnterior) {
    setFocoAnterior(focoEventoId);
    const i = timeline.findIndex((f) => f.id === focoEventoId);
    if (i >= 0) setIndice(i);
  }

  // rola ate a maquina para o quadro focado (repete para vencer lock de scroll)
  useEffect(() => {
    if (!focoEventoId) return;
    const rolar = () =>
      document
        .getElementById("microfilme-visao")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    const tentativas = [250, 700, 1200].map((atraso, n) =>
      setTimeout(() => {
        rolar();
        if (n === tentativas.length - 1) aoLimparFoco();
      }, atraso),
    );
    return () => tentativas.forEach(clearTimeout);
  }, [focoEventoId, aoLimparFoco]);

  const saltar = useCallback(
    (passos: number) => {
      const total = timeline.length;
      setIndice((i) => (i + passos + total) % total);
    },
    [],
  );

  // visibilidade da secao: habilita os atalhos de teclado
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setSecaoVisivel(entries[0]?.isIntersecting ?? false),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  // teclado: setas avancam e recuam o filme; J e K mantidos do eixo antigo
  useEffect(() => {
    if (!secaoVisivel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        saltar(1);
      } else if (e.key === "ArrowLeft" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        saltar(-1);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [secaoVisivel, saltar]);

  return (
    <section
      id="linha-do-tempo"
      ref={ref}
      className="scroll-mt-24 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal max-w-2xl">
          <EtiquetaParte n="03" folhas={`${contagens.fatos} quadros no rolo`} />
          <Kicker>Arquivo · Microfilme da cronologia</Kicker>
          <h2 className="display-sm mt-4">
            A cronologia inteira, quadro a quadro, no microfilme do arquivo
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Todos os {contagens.fatos} fatos datados do caso foram microfilmados
            e estão carregados no leitor: decisões do Banco Central, operações
            da Polícia Federal, inquéritos do STF, reembolsos do FGC e o que a
            imprensa apurou. Avance o filme como um arquivista de gabinete e
            confira as fontes de cada quadro.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <MousePointerClick className="size-3.5 text-primary" aria-hidden />
              Os botões da própria máquina avançam e rebobinam o filme
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MoveVertical className="size-3.5 text-primary" aria-hidden />
              A folha de contato pula direto para qualquer quadro
            </li>
            <li className="hidden items-center gap-1.5 sm:inline-flex">
              <Keyboard className="size-3.5 text-primary" aria-hidden />
              Setas, J e K no teclado também navegam
            </li>
          </ul>
        </div>

        <div className="reveal mt-10">
          <Microfilme
            fatos={timeline}
            indice={indice}
            aoIndice={setIndice}
            onPessoa={onPessoa}
          />
        </div>
      </div>
    </section>
  );
}
