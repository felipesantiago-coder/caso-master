"use client";

// Cena 3D do hero, feita com three.js: folhas de expediente flutuando sobre
// a mesa escura do dossiê, com carimbos e manchas de tinta desenhados em
// canvas. Parallax com o mouse, respiração lenta e pausa total quando a
// cena sai da tela. Com reduced-motion ou sem WebGL, o hero fica estático.

import { useEffect, useRef } from "react";

/* PRNG determinístico para as texturas (folhas iguais entre carregamentos) */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CARIMBOS = ["APURAÇÃO", "REGISTRO 047", "EXPEDIENTE", "VIA PÚBLICA", "CASO 7912"];

/** Desenha uma folha de expediente em canvas e devolve a textura */
function criarTexturaFolha(THREE: any, seed: number, comCarimbo: boolean): any {
  const L = 256;
  const A = 362;
  const cv = document.createElement("canvas");
  cv.width = L;
  cv.height = A;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const rnd = prng(seed);

  // papel
  const g = ctx.createLinearGradient(0, 0, L, A);
  g.addColorStop(0, "#efe5cd");
  g.addColorStop(0.55, "#e6d9bc");
  g.addColorStop(1, "#d9caa8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, A);

  // manchas de idade
  for (let i = 0; i < 5; i++) {
    const x = rnd() * L;
    const y = rnd() * A;
    const r = 26 + rnd() * 60;
    const m = ctx.createRadialGradient(x, y, 0, x, y, r);
    m.addColorStop(0, `rgba(120,94,52,${0.05 + rnd() * 0.06})`);
    m.addColorStop(1, "rgba(120,94,52,0)");
    ctx.fillStyle = m;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // bloco de cabeçalho
  ctx.fillStyle = "rgba(38,29,13,0.85)";
  ctx.fillRect(22, 24, 62 + rnd() * 40, 9);
  ctx.fillStyle = "rgba(38,29,13,0.4)";
  ctx.fillRect(22, 40, 40 + rnd() * 30, 5);

  // linhas de texto datilografado
  ctx.fillStyle = "rgba(45,35,17,0.62)";
  let y = 66;
  while (y < A - 40) {
    const largura = 90 + rnd() * (L - 120);
    ctx.fillRect(22, y, largura, 4.5);
    y += 14 + (rnd() > 0.86 ? 12 : 0);
  }

  // dobra horizontal
  ctx.fillStyle = "rgba(80,60,28,0.1)";
  ctx.fillRect(0, A * 0.52, L, 2);
  ctx.fillStyle = "rgba(255,250,236,0.28)";
  ctx.fillRect(0, A * 0.52 + 2, L, 2);

  // carimbo de tinta
  if (comCarimbo) {
    const texto = CARIMBOS[Math.floor(rnd() * CARIMBOS.length)];
    ctx.save();
    ctx.translate(L * 0.62, A * 0.3);
    ctx.rotate(-0.22 + rnd() * 0.1);
    const cor = rnd() > 0.45 ? "rgba(158,52,48,0.72)" : "rgba(122,86,24,0.72)";
    ctx.strokeStyle = cor;
    ctx.lineWidth = 4;
    const w = 118;
    const h = 44;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
    ctx.fillStyle = cor;
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 0, 1);
    ctx.restore();
  }

  // vinheta de borda
  const v = ctx.createRadialGradient(L / 2, A / 2, A * 0.34, L / 2, A / 2, A * 0.72);
  v.addColorStop(0, "rgba(60,42,16,0)");
  v.addColorStop(1, "rgba(60,42,16,0.22)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, L, A);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function HeroCena() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let desmontado = false;
    let limpar: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (desmontado) return;

      const L = container.clientWidth;
      const A = container.clientHeight;
      if (!L || !A) return;

      const cena = new THREE.Scene();
      cena.fog = new THREE.FogExp2(0x050608, 0.075);

      const camera = new THREE.PerspectiveCamera(40, L / A, 0.1, 40);
      camera.position.set(0, 0, 9.5);

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        return; // sem WebGL: hero fica estático
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(L, A);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // luz de palco: âmbar principal, contraluz fria discreta
      cena.add(new THREE.AmbientLight(0xfff2d8, 0.95));
      const luzPrinc = new THREE.DirectionalLight(0xffdf9e, 1.35);
      luzPrinc.position.set(4, 6, 8);
      cena.add(luzPrinc);
      const luzFria = new THREE.DirectionalLight(0x8fb4ff, 0.3);
      luzFria.position.set(-6, -3, 4);
      cena.add(luzFria);

      // texturas compartilhadas das folhas
      const texturas: any[] = [];
      for (let i = 0; i < 5; i++) {
        const t = criarTexturaFolha(THREE, 11 + i * 977, i < 3);
        if (t) texturas.push(t);
      }
      if (!texturas.length) return;

      const grupo = new THREE.Group();
      cena.add(grupo);

      const geo = new THREE.PlaneGeometry(1.3, 1.84);
      const materiais: any[] = [];
      const folhas: any[] = [];

      for (let i = 0; i < 16; i++) {
        const tex = texturas[i % texturas.length];
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          side: THREE.DoubleSide,
          roughness: 0.88,
          metalness: 0,
          transparent: true,
          opacity: 0.92,
        });
        materiais.push(mat);
        const folha = new THREE.Mesh(geo, mat);
        const faixaZ = i < 6 ? -4.6 : i < 11 ? -2 : 0.6;
        folha.position.set(
          (prng(seedDe(i))() - 0.5) * 13,
          (prng(seedDe(i + 40))() - 0.5) * 8.4,
          faixaZ + prng(seedDe(i + 80))() * 1.4,
        );
        folha.rotation.set(
          (prng(seedDe(i + 120))() - 0.5) * 1.1,
          (prng(seedDe(i + 160))() - 0.5) * 1.6,
          (prng(seedDe(i + 200))() - 0.5) * 0.8,
        );
        folha.scale.setScalar(0.75 + prng(seedDe(i + 240))() * 0.5);
        folha.userData = {
          yBase: folha.position.y,
          rotX: folha.rotation.x,
          rotY: folha.rotation.y,
          fase: prng(seedDe(i + 280))() * Math.PI * 2,
          vel: 0.24 + prng(seedDe(i + 320))() * 0.3,
          amp: 0.22 + prng(seedDe(i + 360))() * 0.2,
        };
        grupo.add(folha);
        folhas.push(folha);
      }

      function seedDe(n: number) {
        return (n * 2654435761) % 4294967296;
      }

      // parallax do ponteiro
      const ponteiro = { x: 0, y: 0 };
      const suave = { x: 0, y: 0 };
      const aoMover = (e: PointerEvent) => {
        ponteiro.x = (e.clientX / window.innerWidth) * 2 - 1;
        ponteiro.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", aoMover, { passive: true });

      // pausa quando fora da viewport ou aba oculta
      let visivel = true;
      const io = new IntersectionObserver((es) => {
        visivel = es.some((e) => e.isIntersecting);
      });
      io.observe(container);
      const aoVisibilidade = () => {
        if (document.hidden) visivel = false;
        else visivel = true;
      };
      document.addEventListener("visibilitychange", aoVisibilidade);

      const aoRedim = () => {
        const nl = container.clientWidth;
        const na = container.clientHeight;
        if (!nl || !na) return;
        camera.aspect = nl / na;
        camera.updateProjectionMatrix();
        renderer.setSize(nl, na);
      };
      window.addEventListener("resize", aoRedim);

      let raf = 0;
      let t0 = performance.now();
      const loop = (agora: number) => {
        raf = requestAnimationFrame(loop);
        if (!visivel) {
          t0 = agora - 400; // congela o tempo sem acumular salto
          return;
        }
        const t = (agora - t0) / 1000;
        for (const f of folhas) {
          const u = f.userData;
          f.position.y = u.yBase + Math.sin(t * u.vel * 0.9 + u.fase) * u.amp;
          f.rotation.x = u.rotX + Math.sin(t * u.vel * 0.7 + u.fase) * 0.18;
          f.rotation.y = u.rotY + Math.cos(t * u.vel * 0.55 + u.fase * 1.3) * 0.22;
        }
        grupo.rotation.y += 0.00045;
        suave.x += (ponteiro.x - suave.x) * 0.045;
        suave.y += (ponteiro.y - suave.y) * 0.045;
        camera.position.x = suave.x * 0.85;
        camera.position.y = -suave.y * 0.55;
        camera.lookAt(0, 0, 0);
        renderer.render(cena, camera);
      };
      raf = requestAnimationFrame(loop);

      limpar = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", aoMover);
        window.removeEventListener("resize", aoRedim);
        document.removeEventListener("visibilitychange", aoVisibilidade);
        io.disconnect();
        geo.dispose();
        for (const m of materiais) m.dispose();
        for (const t of texturas) t.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      };
    })().catch(() => {});

    return () => {
      desmontado = true;
      limpar?.();
      limpar = null;
    };
  }, []);

  return <div ref={containerRef} className="cena-hero" aria-hidden />;
}
