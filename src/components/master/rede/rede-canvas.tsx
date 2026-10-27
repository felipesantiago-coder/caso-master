"use client";

// Motor da rede 3D interativa: canvas 2D com projeção em perspectiva,
// simulação de forças em 3D, fotos nos nós, névoa de profundidade e
// rótulos em HTML sobre o canvas para legibilidade máxima em qualquer tela.
// Sem dependências externas: rotação por arraste, zoom por roda/pinça,
// seleção por toque e rotação automática suave quando ocioso.

import { useEffect, useRef } from "react";
import type { Rede } from "@/lib/network";

interface Fisica {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fixado: boolean;
}

interface Trabalho {
  rede: Rede;
  nos: Rede["nos"];
  porId: Map<string, { no: Rede["nos"][number]; f: Fisica }>;
  adj: Map<string, Set<string>>;
  fotos: Map<string, HTMLImageElement>;
  falhas: Set<string>;
  labels: Map<string, HTMLDivElement>;
  camada: HTMLDivElement;
}

const FOCO = 1400; // distância da câmera em unidades do mundo
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

function esferaFibonacci(n: number, raio: number): { x: number; y: number; z: number }[] {
  const pts: { x: number; y: number; z: number }[] = [];
  const ouro = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = ouro * i;
    pts.push({ x: Math.cos(t) * r * raio, y: y * raio, z: Math.sin(t) * r * raio });
  }
  return pts;
}

export default function RedeCanvas({
  rede,
  noSelecionado,
  aoSelecionar,
  mostrarNomes,
  className = "",
}: {
  rede: Rede;
  noSelecionado: string | null;
  aoSelecionar: (id: string | null) => void;
  mostrarNomes: boolean;
  className?: string;
}) {
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // estado mutável do motor (fora do React: atualizado a 60fps sem re-render)
  const motor = useRef({
    yaw: 0.4,
    pitch: -0.18,
    zoom: 1,
    zoomAuto: true,
    alpha: 1,
    arrastando: false,
    moveu: 0,
    ultimoToque: 0,
    inerciaYaw: 0,
    inerciaPitch: 0,
    hover: null as string | null,
    ponteiros: new Map<number, { x: number; y: number }>(),
    pincaInicial: 0,
    zoomNaPinca: 1,
  });

  const trabalho = useRef<Trabalho | null>(null);
  const selecao = useRef<string | null>(null);
  const nomes = useRef(mostrarNomes);
  const callback = useRef(aoSelecionar);

  useEffect(() => {
    nomes.current = mostrarNomes;
  }, [mostrarNomes]);
  useEffect(() => {
    callback.current = aoSelecionar;
  }, [aoSelecionar]);
  useEffect(() => {
    selecao.current = noSelecionado;
  }, [noSelecionado]);

  // monta a cena quando a rede muda
  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;

    // limpa camada de rótulos anterior
    const antiga = caixa.querySelector<HTMLDivElement>("[data-camada-rotulos]");
    if (antiga) antiga.remove();
    const camada = document.createElement("div");
    camada.setAttribute("data-camada-rotulos", "");
    camada.className = "pointer-events-none absolute inset-0 overflow-hidden";
    caixa.appendChild(camada);

    const n = rede.nos.length;
    const raioEsfera = n <= 12 ? 170 : n <= 20 ? 215 : n <= 40 ? 265 : 305;
    const pos = esferaFibonacci(n, raioEsfera);
    const porId = new Map<string, { no: Rede["nos"][number]; f: Fisica }>();
    const fotos = new Map<string, HTMLImageElement>();
    const falhas = new Set<string>();
    const labels = new Map<string, HTMLDivElement>();
    const hubCentro = rede.id !== "geral";

    rede.nos.forEach((no, i) => {
      const p = pos[i];
      porId.set(no.id, {
        no,
        f: {
          x: hubCentro && no.tipo === "esquema" ? 0 : p.x,
          y: hubCentro && no.tipo === "esquema" ? 0 : p.y,
          z: hubCentro && no.tipo === "esquema" ? 0 : p.z,
          vx: 0,
          vy: 0,
          vz: 0,
          fixado: hubCentro && no.tipo === "esquema",
        },
      });
      if (no.foto) {
        const img = new Image();
        img.decoding = "async";
        img.src = no.foto;
        img.onerror = () => falhas.add(no.id);
        fotos.set(no.id, img);
      }
      const el = document.createElement("div");
      el.className = "absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5";
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
      el.style.willChange = "transform";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "-1");
      el.innerHTML =
        `<span style="display:inline-block;width:7px;height:7px;border-radius:99px;background:${no.cor};box-shadow:0 0 6px ${no.cor}"></span>` +
        `<span style="font:600 13px/1.2 var(--font-geist-sans),system-ui,sans-serif;letter-spacing:.01em;color:#f6f4ef;text-shadow:0 1px 3px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.75);white-space:nowrap">${no.rotulo}</span>`;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        callback.current(no.id);
      });
      camada.appendChild(el);
      labels.set(no.id, el);
    });

    const adj = new Map<string, Set<string>>();
    for (const no of rede.nos) adj.set(no.id, new Set());
    for (const a of rede.arestas) {
      adj.get(a.a)?.add(a.b);
      adj.get(a.b)?.add(a.a);
    }

    trabalho.current = { rede, nos: rede.nos, porId, adj, fotos, falhas, labels, camada };

    const m = motor.current;
    m.yaw = 0.35;
    m.pitch = -0.16;
    m.zoom = n > 40 ? 0.66 : n > 20 ? 0.8 : 0.95;
    m.zoomAuto = true;
    m.alpha = 1;
    m.inerciaYaw = 0;
    m.inerciaPitch = 0;

    return () => {
      trabalho.current = null;
      camada.remove();
    };
  }, [rede]);

  // laço principal: física, câmera, desenho e rótulos
  useEffect(() => {
    const canvas = canvasRef.current;
    const caixa = caixaRef.current;
    if (!canvas || !caixa) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let largura = 0;
    let altura = 0;
    let dpr = 1;

    const redimensionar = () => {
      const r = caixa.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = Math.max(1, r.width);
      altura = Math.max(1, r.height);
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
    };
    redimensionar();
    const ro = new ResizeObserver(redimensionar);
    ro.observe(caixa);

    const projeto = (
      m: (typeof motor)["current"],
      w: number,
      h: number
    ): { mapa: Map<string, { x: number; y: number; r: number; z: number; no: Rede["nos"][number] }>; k: number } => {
      const t = trabalho.current;
      const mapa = new Map<string, { x: number; y: number; r: number; z: number; no: Rede["nos"][number] }>();
      if (!t) return { mapa, k: 1 };
      const k = (m.zoom * Math.min(w, h)) / 950;
      const cyaw = Math.cos(m.yaw);
      const syaw = Math.sin(m.yaw);
      const cpit = Math.cos(m.pitch);
      const spit = Math.sin(m.pitch);
      for (const [id, { no, f }] of t.porId) {
        const x1 = f.x * cyaw - f.z * syaw;
        const z1 = f.x * syaw + f.z * cyaw;
        const y2 = f.y * cpit - z1 * spit;
        const z2 = f.y * spit + z1 * cpit;
        const pf = FOCO / Math.max(240, FOCO - z2);
        mapa.set(id, {
          x: w / 2 + x1 * pf * k,
          y: h / 2 + y2 * pf * k,
          r: Math.max(7, no.raio * pf * k),
          z: z2,
          no,
        });
      }
      return { mapa, k };
    };

    let quadro = 0;

    const passo = () => {
      quadro += 1;
      const t = trabalho.current;
      const m = motor.current;
      if (!t) return;

      // física: repulsão + molas + gravidade central
      if (m.alpha > 0.012) {
        const lista = [...t.porId.values()];
        const alfa = m.alpha;
        for (let i = 0; i < lista.length; i++) {
          const A = lista[i];
          for (let j = i + 1; j < lista.length; j++) {
            const B = lista[j];
            let dx = B.f.x - A.f.x;
            let dy = B.f.y - A.f.y;
            let dz = B.f.z - A.f.z;
            let d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < 1) {
              dx = (Math.random() - 0.5) * 2;
              dy = (Math.random() - 0.5) * 2;
              dz = (Math.random() - 0.5) * 2;
              d2 = 4;
            }
            const soma = A.no.raio + B.no.raio;
            const forca = (5200 * soma * alfa) / Math.max(400, d2);
            const d = Math.sqrt(d2);
            const fx = (dx / d) * forca;
            const fy = (dy / d) * forca;
            const fz = (dz / d) * forca;
            if (!A.f.fixado) {
              A.f.vx -= fx;
              A.f.vy -= fy;
              A.f.vz -= fz;
            }
            if (!B.f.fixado) {
              B.f.vx += fx;
              B.f.vy += fy;
              B.f.vz += fz;
            }
          }
        }
        for (const a of t.rede.arestas) {
          const A = t.porId.get(a.a);
          const B = t.porId.get(a.b);
          if (!A || !B) continue;
          const dx = B.f.x - A.f.x;
          const dy = B.f.y - A.f.y;
          const dz = B.f.z - A.f.z;
          const d = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
          const soma = A.no.raio + B.no.raio;
          const repouso = (a.a.startsWith("s:") || a.b.startsWith("s:") ? 2.35 : 2.75) * soma + (a.peso > 1 ? -10 : 8);
          const forca = 0.024 * (d - repouso) * alfa;
          const fx = (dx / d) * forca;
          const fy = (dy / d) * forca;
          const fz = (dz / d) * forca;
          if (!A.f.fixado) {
            A.f.vx += fx;
            A.f.vy += fy;
            A.f.vz += fz;
          }
          if (!B.f.fixado) {
            B.f.vx -= fx;
            B.f.vy -= fy;
            B.f.vz -= fz;
          }
        }
        for (const { f } of lista) {
          if (!f.fixado) {
            f.vx -= f.x * 0.02 * alfa;
            f.vy -= f.y * 0.02 * alfa;
            f.vz -= f.z * 0.02 * alfa;
            f.vx *= 0.86;
            f.vy *= 0.86;
            f.vz *= 0.86;
            const v = Math.max(Math.abs(f.vx), Math.abs(f.vy), Math.abs(f.vz));
            if (v > 6) {
              f.vx *= 6 / v;
              f.vy *= 6 / v;
              f.vz *= 6 / v;
            }
            f.x += f.vx;
            f.y += f.vy;
            f.z += f.vz;
          }
        }
        m.alpha *= reduzMovimento ? 0.975 : 0.992;
      }

      // câmera: inércia e rotação automática ociosa
      if (!m.arrastando) {
        m.yaw += m.inerciaYaw;
        m.pitch += m.inerciaPitch;
        m.inerciaYaw *= 0.94;
        m.inerciaPitch *= 0.94;
        const ocioso = performance.now() - m.ultimoToque > 3500;
        if (!reduzMovimento && ocioso) m.yaw += 0.0014;
      }
      m.pitch = Math.max(-1.25, Math.min(1.25, m.pitch));

      // autoenquadramento: mantém toda a rede visível até o usuário assumir o zoom
      if (m.zoomAuto && largura > 0) {
        const cyaw = Math.cos(m.yaw);
        const syaw = Math.sin(m.yaw);
        const cpit = Math.cos(m.pitch);
        const spit = Math.sin(m.pitch);
        let alc = 0;
        for (const { f, no } of t.porId.values()) {
          const x1 = f.x * cyaw - f.z * syaw;
          const z1 = f.x * syaw + f.z * cyaw;
          const y2 = f.y * cpit - z1 * spit;
          alc = Math.max(alc, Math.sqrt(x1 * x1 + y2 * y2) + no.raio + 60);
        }
        const alvoK = Math.min(largura, altura) / 2 / Math.max(120, alc);
        const alvo = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (alvoK * 950) / Math.min(largura, altura)));
        const ritmo = m.alpha > 0.1 ? 0.05 : 0.012;
        m.zoom += (alvo - m.zoom) * ritmo;
      }

      const { mapa, k } = projeto(m, largura, altura);
      desenhar(ctx, t, m, mapa, k, largura, altura, dpr, quadro);
      rotulos(t, m, mapa, k, largura, altura);
      raf = requestAnimationFrame(passo);
    };

    const desenhar = (
      ctx: CanvasRenderingContext2D,
      t: Trabalho,
      m: (typeof motor)["current"],
      proj: Map<string, { x: number; y: number; r: number; z: number; no: Rede["nos"][number] }>,
      k: number,
      w: number,
      h: number,
      dpr: number,
      quadro: number
    ) => {
      void m;
      let zMax = -Infinity;
      let zMin = Infinity;
      for (const p of proj.values()) {
        if (p.z > zMax) zMax = p.z;
        if (p.z < zMin) zMin = p.z;
      }
      const faixa = Math.max(1, zMax - zMin);
      const fogDe = (z: number) => 1 - 0.6 * ((z - zMin) / faixa);

      const sel = selecao.current;
      const hov = m.hover;
      const viz = sel ? t.adj.get(sel) : null;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // arestas
      for (const a of t.rede.arestas) {
        const A = proj.get(a.a);
        const B = proj.get(a.b);
        if (!A || !B) continue;
        const hub = a.a.startsWith("s:") || a.b.startsWith("s:");
        const ativa = sel ? a.a === sel || a.b === sel : hov ? a.a === hov || a.b === hov : false;
        let opa: number;
        let cor: string;
        if (sel) {
          if (ativa) {
            cor = proj.get(a.a === sel ? a.b : a.a)!.no.cor;
            opa = 0.95;
          } else {
            opa = 0.05;
            cor = "#9aa0b4";
          }
        } else if (hov && ativa) {
          cor = proj.get(a.a === hov ? a.b : a.a)!.no.cor;
          opa = 0.8;
        } else {
          cor = hub ? "#e3b341" : "#9aa0b4";
          opa = (hub ? 0.4 : 0.3) * fogDe((A.z + B.z) / 2);
          if (hov) opa *= 0.35;
        }
        ctx.globalAlpha = Math.max(0.03, Math.min(1, opa));
        ctx.strokeStyle = cor;
        ctx.lineWidth = Math.max(0.7, Math.min(5, (0.9 + a.peso * 0.45) * k * Math.min(A.r, B.r) * 0.05));
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // nós, do fundo para a frente
      const ordem = [...proj.entries()].sort((a, b) => b[1].z - a[1].z);
      for (const [id, p] of ordem) {
        const no = p.no;
        const img = t.fotos.get(id);
        const temFoto = Boolean(img && img.complete && img.naturalWidth > 0 && !t.falhas.has(id));
        const destacado = sel === id || hov === id;
        const vizinho = sel ? sel === id || viz?.has(id) : true;
        const apag = sel && !vizinho ? 0.16 : 1;
        const g = fogDe(p.z) * apag;

        // halo luminoso
        const haloR = p.r * (destacado || no.tipo === "esquema" ? 2.7 : 1.9);
        const halo = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, haloR);
        halo.addColorStop(0, hexAlfa(no.cor, 0.36 * g));
        halo.addColorStop(1, hexAlfa(no.cor, 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // corpo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.clip();
        if (temFoto && img) {
          const cob = Math.max((p.r * 2) / img.naturalWidth, (p.r * 2) / img.naturalHeight);
          const iw = img.naturalWidth * cob;
          const ih = img.naturalHeight * cob;
          ctx.globalAlpha = g;
          ctx.drawImage(img, p.x - iw / 2, p.y - ih / 2, iw, ih);
        } else {
          const corpo = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.4, p.r * 0.15, p.x, p.y, p.r);
          corpo.addColorStop(0, clarear(no.cor, 0.5));
          corpo.addColorStop(1, no.cor);
          ctx.globalAlpha = g;
          ctx.fillStyle = corpo;
          ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
          if (no.tipo === "pessoa") {
            ctx.globalAlpha = 0.94 * g;
            ctx.fillStyle = "#141311";
            ctx.font = `700 ${Math.max(9, Math.round(p.r * 0.6))}px var(--font-geist-sans), system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const iniciais = no.rotulo
              .split(" ")
              .filter((s) => s.length > 2)
              .slice(0, 2)
              .map((s) => s[0])
              .join("");
            ctx.fillText(iniciais, p.x, p.y + p.r * 0.03);
          }
        }
        ctx.restore();

        // anel
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(1.4, p.r * 0.11);
        ctx.strokeStyle = hexAlfa(no.cor, Math.min(1, (no.tipo === "esquema" ? 1 : 0.85) * g));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();

        if (no.tipo === "esquema") {
          ctx.globalAlpha = 0.55 * g;
          ctx.lineWidth = 1;
          ctx.strokeStyle = hexAlfa(no.cor, 0.9 * g);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + Math.max(3, p.r * 0.18), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (sel === id) {
          const puls = reduzMovimento ? 0 : Math.sin(quadro * 0.09) * 3;
          ctx.globalAlpha = 0.95;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + Math.max(5, p.r * 0.3) + puls, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (hov === id) {
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + Math.max(4, p.r * 0.24), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // marcador de status: pessoa presa
        if (no.statusTipo === "preso" && no.tipo === "pessoa") {
          const mr = Math.max(3.5, p.r * 0.22);
          ctx.globalAlpha = g;
          ctx.fillStyle = "#f05252";
          ctx.beginPath();
          ctx.arc(p.x + p.r * 0.72, p.y - p.r * 0.72, mr, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.globalAlpha = 1;
    };

    const rotulos = (
      t: Trabalho,
      m: (typeof motor)["current"],
      proj: Map<string, { x: number; y: number; r: number; z: number; no: Rede["nos"][number] }>,
      k: number,
      w: number,
      h: number
    ) => {
      void k;
      const sel = selecao.current;
      const hov = m.hover;
      const viz = sel ? t.adj.get(sel) : null;
      const mobile = w < 640;
      const denso = t.nos.length > 40;
      for (const [id, p] of proj) {
        const el = t.labels.get(id);
        if (!el) continue;
        const destacado = sel === id || hov === id;
        const vizinho = sel ? sel === id || viz?.has(id) : true;
        const limite = mobile ? 19 : denso ? 16 : 13;
        const mostrar = p.no.tipo === "esquema" || destacado || nomes.current || (p.r >= limite && vizinho);
        const fora = p.x < -60 || p.x > w + 60 || p.y < -30 || p.y > h + 30;
        if (!mostrar || fora) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          continue;
        }
        const apag = sel && !vizinho ? 0.18 : 1;
        const opa = Math.min(1, Math.max(0.42, 1 - (p.z + 400) / 1400)) * apag;
        el.style.opacity = destacado ? "1" : String(opa);
        el.style.pointerEvents = "auto";
        // z-index contido: rótulos nunca cobrem os controles e painéis do React
        el.style.zIndex = String(Math.round(Math.max(2, Math.min(14, 10 - p.z / 300))));
        el.style.transform = `translate3d(${(p.x - p.r * 0.2).toFixed(1)}px, ${(p.y - p.r - 28).toFixed(1)}px, 0)`;
        const tam = Math.round(Math.max(12, Math.min(17, 12 + p.r * 0.22)));
        const nome = el.lastElementChild as HTMLElement | null;
        if (nome) nome.style.fontSize = `${tam}px`;
        el.dataset.destaque = destacado ? "1" : "0";
      }
    };

    raf = requestAnimationFrame(passo);

    const aoVisivel = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(passo);
    };
    document.addEventListener("visibilitychange", aoVisivel);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", aoVisivel);
    };
  }, [rede]);

  // interações de ponteiro: arrastar gira, roda/pinça dá zoom, toque seleciona
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const m = motor.current;

    const pegaNo = (px: number, py: number): string | null => {
      const t = trabalho.current;
      const caixa = caixaRef.current;
      if (!t || !caixa) return null;
      const r = caixa.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      const k = (m.zoom * Math.min(w, h)) / 950;
      const cyaw = Math.cos(m.yaw);
      const syaw = Math.sin(m.yaw);
      const cpit = Math.cos(m.pitch);
      const spit = Math.sin(m.pitch);
      let melhor: string | null = null;
      let melhorD = Infinity;
      let melhorZ = -Infinity;
      for (const [id, { no, f }] of t.porId) {
        const x1 = f.x * cyaw - f.z * syaw;
        const z1 = f.x * syaw + f.z * cyaw;
        const y2 = f.y * cpit - z1 * spit;
        const z2 = f.y * spit + z1 * cpit;
        if (z2 >= FOCO - 240) continue;
        const pf = FOCO / (FOCO - z2);
        const x = w / 2 + x1 * pf * k;
        const y = h / 2 + y2 * pf * k;
        const rr = Math.max(7, no.raio * pf * k);
        const d = Math.hypot(px - x, py - y);
        const alcance = Math.max(rr + 8, 24);
        if (d <= alcance && (d < melhorD - 4 || (Math.abs(d - melhorD) <= 4 && z2 < melhorZ))) {
          melhor = id;
          melhorD = d;
          melhorZ = z2;
        }
      }
      return melhor;
    };

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const desce = (e: PointerEvent) => {
      const p = local(e);
      m.ponteiros.set(e.pointerId, p);
      m.arrastando = true;
      m.moveu = 0;
      m.ultimoToque = performance.now();
      if (m.ponteiros.size === 2) {
        const [a, b] = [...m.ponteiros.values()];
        m.pincaInicial = Math.hypot(a.x - b.x, a.y - b.y);
        m.zoomNaPinca = m.zoom;
      }
      canvas.setPointerCapture(e.pointerId);
      m.inerciaYaw = 0;
      m.inerciaPitch = 0;
    };

    const move = (e: PointerEvent) => {
      const p = local(e);
      m.ultimoToque = performance.now();
      if (m.ponteiros.has(e.pointerId)) {
        const antes = m.ponteiros.get(e.pointerId)!;
        const dx = p.x - antes.x;
        const dy = p.y - antes.y;
        m.ponteiros.set(e.pointerId, p);
        if (m.ponteiros.size === 2) {
          const [a, b] = [...m.ponteiros.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (m.pincaInicial > 0) {
            m.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (m.zoomNaPinca * dist) / m.pincaInicial));
            m.zoomAuto = false;
          }
          return;
        }
        m.moveu += Math.abs(dx) + Math.abs(dy);
        m.yaw += dx * 0.0052;
        m.pitch += dy * 0.0052;
        m.inerciaYaw = dx * 0.0052 * 0.6;
        m.inerciaPitch = dy * 0.0052 * 0.6;
        m.zoomAuto = false;
      } else {
        const id = pegaNo(p.x, p.y);
        m.hover = id;
        canvas.style.cursor = id ? "pointer" : "grab";
      }
    };

    const sobe = (e: PointerEvent) => {
      const p = local(e);
      const existia = m.ponteiros.has(e.pointerId);
      m.ponteiros.delete(e.pointerId);
      if (m.ponteiros.size === 0) m.arrastando = false;
      if (!existia) return;
      m.ultimoToque = performance.now();
      if (m.moveu < 9 && m.ponteiros.size === 0) {
        const id = pegaNo(p.x, p.y);
        callback.current(id);
      }
    };

    const roda = (e: WheelEvent) => {
      e.preventDefault();
      m.ultimoToque = performance.now();
      m.zoomAuto = false;
      const fator = Math.exp(-e.deltaY * 0.0011);
      m.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, m.zoom * fator));
    };

    const sai = () => {
      m.hover = null;
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", desce);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", sobe);
    canvas.addEventListener("pointercancel", sobe);
    canvas.addEventListener("pointerleave", sai);
    canvas.addEventListener("wheel", roda, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", desce);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", sobe);
      canvas.removeEventListener("pointercancel", sobe);
      canvas.removeEventListener("pointerleave", sai);
      canvas.removeEventListener("wheel", roda);
    };
  }, []);

  return (
    <div ref={caixaRef} className={`relative h-full w-full overflow-hidden ${className}`} data-rede-canvas>
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
      {/* alternativa acessível para leitores de tela */}
      <ul className="sr-only">
        {rede.nos.map((no) => (
          <li key={no.id}>
            {no.tipo === "esquema" ? `Esquema: ${no.rotulo}` : `${no.rotulo}, ${no.subtitulo}`}
          </li>
        ))}
        {rede.arestas.map((a, i) => (
          <li key={i}>
            Conexão entre {rede.nos.find((n) => n.id === a.a)?.rotulo ?? a.a} e{" "}
            {rede.nos.find((n) => n.id === a.b)?.rotulo ?? a.b}
          </li>
        ))}
      </ul>
    </div>
  );
}

// utilidades de cor (fora do React)
function hexAlfa(hex: string, alfa: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alfa)).toFixed(3)})`;
}

function clarear(hex: string, quantia: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const m = (v: number) => Math.round(v + (255 - v) * quantia);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}
