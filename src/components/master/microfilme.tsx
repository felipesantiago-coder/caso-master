"use client";

// Maquina de microfilme 3D que exibe a cronologia do caso: visor grande com
// o fato atual, carreteis que giram a cada passagem, botoes fisicos na
// propria maquina (raycast) e barra de controles acessivel em HTML. Inclui
// folha de contato (indice clicavel) e transcricao do quadro atual.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import type { Fato } from "@/lib/master";
import { nomePessoa } from "@/lib/master";
import {
  EtiquetaArquivo,
  FontesList,
  GrauBadge,
  TipoBadges,
  bgGrau,
} from "./atoms";
import { desenharQuadro, type FontesTela } from "./microfilme/tela";
import type { CenaMicrofilme } from "./microfilme/cena";

function resolverFamilia(varCss: string): string {
  const sonda = document.createElement("span");
  sonda.style.fontFamily = `var(${varCss})`;
  sonda.style.display = "none";
  document.body.appendChild(sonda);
  const familia = getComputedStyle(sonda).fontFamily;
  sonda.remove();
  return familia || "monospace";
}

export default function Microfilme({
  fatos,
  indice,
  aoIndice,
  onPessoa,
}: {
  fatos: Fato[];
  indice: number;
  aoIndice: (i: number) => void;
  onPessoa: (id: string) => void;
}) {
  const visorRef = useRef<HTMLDivElement | null>(null);
  const motorRef = useRef<CenaMicrofilme | null>(null);
  const indiceRef = useRef(indice);
  const direcaoRef = useRef(1);
  const animarRef = useRef(false);
  const [fonteTela, setFonteTela] = useState<FontesTela | null>(null);
  const fonteRef = useRef<FontesTela | null>(null);
  const [motorVersao, setMotorVersao] = useState(0);
  const [semWebGL, setSemWebGL] = useState(false);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [anuncio, setAnuncio] = useState("");

  const total = fatos.length;

  useEffect(() => {
    indiceRef.current = indice;
  }, [indice]);

  const avancar = useCallback(
    (passos: number) => {
      direcaoRef.current = passos >= 0 ? 1 : -1;
      animarRef.current = true;
      aoIndice((indiceRef.current + passos + total) % total);
    },
    [aoIndice, total],
  );

  // instalacao do motor 3D
  useEffect(() => {
    let observador: IntersectionObserver | null = null;
    let morto = false;
    (async () => {
      const { criarCena } = await import("./microfilme/cena");
      if (morto || !visorRef.current) return;
      const motor = criarCena(visorRef.current);
      if (!motor) {
        setSemWebGL(true);
        return;
      }
      motorRef.current = motor;
      if (fonteRef.current) motor.definirFontes(fonteRef.current);
      setMotorVersao((v) => v + 1);
      motor.aoAcao((acao) => {
        if (acao === "anterior") avancar(-1);
        else if (acao === "proximo") avancar(1);
        else setReproduzindo((r) => !r);
      });
      observador = new IntersectionObserver(
        (entradas) => motor.definirAtiva(entradas[0]?.isIntersecting ?? true),
        { threshold: 0 },
      );
      observador.observe(visorRef.current);
    })();
    return () => {
      morto = true;
      observador?.disconnect();
      motorRef.current?.dispose();
      motorRef.current = null;
    };
  }, [avancar]);

  // resolucao das fontes do site para o canvas e redesenho do quadro
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* segue com as fontes padrao */
      }
      if (!vivo) return;
      const f: FontesTela = {
        head: resolverFamilia("--font-oswald"),
        mono: resolverFamilia("--font-courier-prime"),
      };
      fonteRef.current = f;
      setFonteTela(f);
      motorRef.current?.definirFontes(f);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // quadro atual na tela da maquina
  useEffect(() => {
    motorRef.current?.definirQuadro(
      fatos[indice],
      indice + 1,
      total,
      animarRef.current,
      direcaoRef.current,
    );
    animarRef.current = false;
    setAnuncio(`Quadro ${indice + 1} de ${total}: ${fatos[indice].titulo}`);
  }, [indice, fatos, total, fonteTela, motorVersao]);

  // projecao automatica
  useEffect(() => {
    if (!reproduzindo) return;
    const t = window.setInterval(() => avancar(1), 6500);
    return () => window.clearInterval(t);
  }, [reproduzindo, avancar]);

  const fato = fatos[indice];
  const anos = useRef(
    [...new Set(fatos.map((f) => f.data.slice(0, 4)))]
  ).current;

  const irPara = (i: number) => {
    direcaoRef.current = i >= indiceRef.current ? 1 : -1;
    animarRef.current = true;
    aoIndice(i);
  };

  return (
    <div className="space-y-6">
      {/* sala de projecao */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(120%_100%_at_50%_0%,#1c1a16_0%,#0c0b09_70%)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        <div
          id="microfilme-visao"
          ref={visorRef}
          role="img"
          aria-label={`Visor da máquina de microfilme exibindo o quadro ${indice + 1}: ${fato.titulo}`}
          className="h-[400px] w-full sm:h-[520px] lg:h-[700px]"
        />

        {semWebGL && (
          <FallbackEstatico fatos={fatos} indice={indice} fonteTela={fonteTela} />
        )}

        {/* placa de instrucoes de sala */}
        <p className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cdbf9c]/70">
          Sala de projeção · Microfilme SC-740
        </p>
      </div>

      {/* controles claros e acessiveis */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-card/80 p-4">
        <button
          type="button"
          onClick={() => avancar(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors hover:border-primary/60 hover:text-primary"
          aria-label="Quadro anterior"
        >
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </button>

        <div className="min-w-[110px] text-center">
          <p className="font-mono text-lg font-bold tabular-nums text-primary">
            {String(indice + 1).padStart(3, "0")}
            <span className="text-muted-foreground">/{total}</span>
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-primary transition-transform duration-500"
              style={{ transform: `scaleX(${(indice + 1) / total})`, transformOrigin: "left" }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => avancar(1)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors hover:border-primary/60 hover:text-primary"
          aria-label="Próximo quadro"
        >
          Próxima <ChevronRight className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setReproduzindo((r) => !r)}
          aria-pressed={reproduzindo}
          className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
            reproduzindo
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-secondary hover:border-primary/60 hover:text-primary"
          }`}
        >
          {reproduzindo ? (
            <>
              <Pause className="size-4" aria-hidden /> Pausar projeção
            </>
          ) : (
            <>
              <Play className="size-4" aria-hidden /> Projeção automática
            </>
          )}
        </button>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
            Ir para o ano:
          </span>
          <select
            value={fato.data.slice(0, 4)}
            onChange={(e) => {
              const alvo = fatos.findIndex((f) => f.data.startsWith(e.target.value));
              if (alvo >= 0) irPara(alvo);
            }}
            className="rounded-lg border border-border bg-secondary px-2.5 py-2 text-xs text-foreground focus-visible:outline-primary"
          >
            {anos.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* anuncio para leitores de tela */}
      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>

      {/* folha de contato: indice completo do rolo */}
      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Folha de contato · {total} quadros no rolo
        </p>
        <div className="flex snap-x gap-2 overflow-x-auto pb-2">
          {fatos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => irPara(i)}
              aria-current={i === indice}
              className={`w-44 shrink-0 snap-start rounded-xl border p-2.5 text-left transition-colors ${
                i === indice
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/60 hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${bgGrau[f.grau]}`} aria-hidden />
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                  {f.dataLabel}
                </span>
              </span>
              <span className="mt-1.5 line-clamp-2 block text-[11px] font-semibold leading-tight">
                {f.titulo}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* transcricao do quadro projetado */}
      <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EtiquetaArquivo>
            TRANSCRIÇÃO · REG-{String(indice + 1).padStart(3, "0")}
          </EtiquetaArquivo>
          <div className="flex flex-wrap items-center gap-2">
            <GrauBadge grau={fato.grau} />
            <TipoBadges tipos={fato.tipos} max={4} />
          </div>
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          {fato.dataLabel}
        </p>
        <h3 className="mt-1.5 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
          {fato.titulo}
        </h3>
        <p className="mt-3 leading-relaxed text-foreground/85">{fato.texto}</p>
        {fato.pessoas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {fato.pessoas.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onPessoa(id)}
                className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary"
              >
                {nomePessoa(id)}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-border pt-4">
          <FontesList fontes={fato.fontes} compacto />
        </div>
      </article>
    </div>
  );
}

// projecao estatica (sem WebGL): desenha o mesmo quadro em canvas 2D
function FallbackEstatico({
  fatos,
  indice,
  fonteTela,
}: {
  fatos: Fato[];
  indice: number;
  fonteTela: FontesTela | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 1536;
    cv.height = 896;
    desenharQuadro(
      cv,
      fatos[indice],
      indice + 1,
      fatos.length,
      fonteTela ?? { head: "Georgia, serif", mono: '"Courier New", monospace' },
    );
  }, [fatos, indice, fonteTela]);
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 size-full object-cover"
      aria-hidden
    />
  );
}
