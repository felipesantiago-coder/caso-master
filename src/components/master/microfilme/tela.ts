// Desenho dos quadros do microfilme: cada fato e renderizado em um canvas
// 2D de alta resolucao (papel envelhecido, tinta datilografada, poeira e
// vinheta), que vira a textura projetada na tela da maquina 3D.

import type { Fato } from "@/lib/master";
import { labelTipo, meta } from "@/lib/master";

// random deterministico por quadro: poeira estavel para cada documento
function semear(n: number) {
  let a = n * 2654435761 + 1013904223;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quebrarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  largura: number,
): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split(/\s*\n\s*/)) {
    let linha = "";
    for (const palavra of paragrafo.split(/\s+/)) {
      const teste = linha ? `${linha} ${palavra}` : palavra;
      if (ctx.measureText(teste).width <= largura || !linha) {
        linha = teste;
      } else {
        linhas.push(linha);
        linha = palavra;
      }
    }
    if (linha) linhas.push(linha);
  }
  return linhas;
}

function retanguloInk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}

// uma folha de papel microfilmado com o fato completo
export function desenharQuadro(
  cv: HTMLCanvasElement,
  fato: Fato,
  registro: number,
  total: number,
  fontes: FontesTela,
) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const W = LARG_TELA;
  const H = ALT_TELA;
  const rnd = semear(registro + 7);

  // papel envelhecido
  ctx.clearRect(0, 0, W, H);
  const papel = ctx.createLinearGradient(0, 0, W, H);
  papel.addColorStop(0, "#f3edde");
  papel.addColorStop(0.55, "#efe8d6");
  papel.addColorStop(1, "#e7dfc9");
  ctx.fillStyle = papel;
  ctx.fillRect(0, 0, W, H);

  // vinheta de projecao optica
  const vinheta = ctx.createRadialGradient(
    W * 0.5,
    H * 0.46,
    H * 0.32,
    W * 0.5,
    H * 0.5,
    W * 0.72,
  );
  vinheta.addColorStop(0, "rgba(255,252,240,0.06)");
  vinheta.addColorStop(0.75, "rgba(70,60,40,0.10)");
  vinheta.addColorStop(1, "rgba(45,38,26,0.38)");
  ctx.fillStyle = vinheta;
  ctx.fillRect(0, 0, W, H);

  // bordas de filme com furos de arraste
  ctx.fillStyle = "rgba(28,24,18,0.55)";
  ctx.fillRect(0, 0, 26, H);
  ctx.fillRect(W - 26, 0, 26, H);
  ctx.fillStyle = "rgba(233,224,203,0.85)";
  for (let y = 18; y < H; y += 44) {
    ctx.fillRect(8, y, 10, 18);
    ctx.fillRect(W - 18, y + 14, 10, 18);
  }

  const mx = 92; // margem interna
  const larguraTexto = W - mx * 2;

  // cabecalho administrativo
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(94,84,62,0.9)";
  ctx.font = `500 25px ${fontes.mono}`;
  ctx.fillText("CASO DANIEL VORCARO · MICROFILME DO ARQUIVO", mx, 74);
  ctx.textAlign = "right";
  ctx.fillText(
    `REG-${String(registro).padStart(3, "0")} · QUADRO ${String(registro).padStart(3, "0")}/${total}`,
    W - mx,
    74,
  );
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(94,84,62,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx, 92);
  ctx.lineTo(W - mx, 92);
  ctx.stroke();

  // data em destaque
  ctx.fillStyle = "#221d14";
  ctx.font = `700 46px ${fontes.head}`;
  ctx.fillText(fato.dataLabel.toUpperCase(), mx, 152);
  if (fato.destaque) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#8a2f22";
    ctx.font = `700 30px ${fontes.mono}`;
    ctx.fillText("★ MARCO DO CASO", W - mx, 148);
    ctx.textAlign = "left";
  }

  // titulo
  let yTitulo = 214;
  ctx.fillStyle = "#1c1811";
  ctx.font = `700 62px ${fontes.head}`;
  const linhasTitulo = quebrarTexto(ctx, fato.titulo, larguraTexto - 40);
  for (const linha of linhasTitulo.slice(0, 3)) {
    ctx.fillText(linha, mx, yTitulo);
    yTitulo += 74;
  }

  // filete duplo datilografado
  yTitulo += 8;
  ctx.strokeStyle = "rgba(60,52,36,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, yTitulo);
  ctx.lineTo(W - mx, yTitulo);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, yTitulo + 6);
  ctx.lineTo(W - mx, yTitulo + 6);
  ctx.stroke();

  // corpo do texto: reduz a fonte ate caber na area util
  const yCorpo = yTitulo + 52;
  const alturaCorpo = H - yCorpo - 168;
  let tamanho = 40;
  let linhasCorpo: string[] = [];
  for (; tamanho >= 26; tamanho -= 2) {
    ctx.font = `400 ${tamanho}px ${fontes.mono}`;
    linhasCorpo = quebrarTexto(ctx, fato.texto, larguraTexto - 24);
    if (linhasCorpo.length * (tamanho * 1.42) <= alturaCorpo) break;
  }
  const entrelinha = tamanho * 1.42;
  ctx.fillStyle = "rgba(43,37,26,0.94)";
  let y = yCorpo + tamanho;
  const limite = 44;
  const cortadas = linhasCorpo.length > limite;
  for (const linha of linhasCorpo.slice(0, limite)) {
    ctx.fillText(linha, mx, y);
    y += entrelinha;
  }
  if (cortadas) {
    ctx.fillText("…", mx, y);
  }

  // carimbos administrativos no rodape
  const yBase = H - 118;
  ctx.font = `700 27px ${fontes.mono}`;
  ctx.textBaseline = "middle";
  const grauRot =
    meta.escala.find((e) => e.id === fato.grau)?.rotulo ?? fato.grau;
  const itens: string[] = [`GRAU: ${grauRot.toUpperCase()}`];
  const tiposTxt = fato.tipos
    .slice(0, 3)
    .map((t) => labelTipo(t))
    .join(" · ");
  if (tiposTxt) itens.push(`APURAÇÃO: ${tiposTxt.toUpperCase()}`);
  const esquemaTxt =
    fato.esquema === "geral" ? "REDE GERAL" : fato.esquema.toUpperCase();
  itens.push(`ESQUEMA: ${esquemaTxt}`);

  let x = mx;
  for (const item of itens) {
    const w = ctx.measureText(item).width + 34;
    ctx.strokeStyle = "rgba(70,60,40,0.75)";
    ctx.lineWidth = 2;
    retanguloInk(ctx, x, yBase - 24, w, 48);
    ctx.fillStyle = "rgba(58,50,34,0.92)";
    ctx.fillText(item, x + 17, yBase + 1);
    x += w + 18;
  }

  // contagem de fontes no rodape direito (sobe uma linha se colidir)
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(94,84,62,0.9)";
  ctx.font = `500 26px ${fontes.mono}`;
  const veiculos = [...new Set(fato.fontes.map((f) => f.veiculo))]
    .slice(0, 2)
    .join(", ");
  const txtFontes = `FONTES: ${fato.fontes.length}${veiculos ? ` · ${veiculos}` : ""}`;
  const largFontes = ctx.measureText(txtFontes).width;
  const yFontes = x > W - mx - largFontes - 30 ? yBase - 62 : yBase + 2;
  ctx.fillText(txtFontes, W - mx, yFontes);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // poeira, fibras e riscos estaveis por quadro
  for (let i = 0; i < 46; i += 1) {
    const px = 30 + rnd() * (W - 60);
    const py = rnd() * H;
    const r = 0.6 + rnd() * 1.8;
    ctx.fillStyle = `rgba(40,34,24,${0.05 + rnd() * 0.16})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 3; i += 1) {
    ctx.strokeStyle = `rgba(50,42,30,${0.05 + rnd() * 0.07})`;
    ctx.lineWidth = 0.8 + rnd();
    ctx.beginPath();
    const x0 = 40 + rnd() * (W - 80);
    const y0 = rnd() * H;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (rnd() - 0.5) * 90, y0 + 20 + rnd() * 70);
    ctx.stroke();
  }
}

export const LARG_TELA = 1536;
export const ALT_TELA = 920;

export interface FontesTela {
  head: string;
  mono: string;
}

// painel verde de contagem de quadros do painel da maquina
export function desenharContador(
  cv: HTMLCanvasElement,
  registro: number,
  total: number,
  mono: string,
) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#0c130c";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "rgba(70,255,122,0.22)";
  for (let y = 0; y < cv.height; y += 3) ctx.fillRect(0, y, cv.width, 1);
  const txt = `${String(registro).padStart(3, "0")}/${total}`;
  ctx.font = `700 ${cv.height * 0.5}px ${mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5cff85";
  ctx.shadowColor = "rgba(92,255,133,0.8)";
  ctx.shadowBlur = 14;
  ctx.fillText(txt, cv.width / 2, cv.height / 2 + 2);
  ctx.shadowBlur = 0;
}

// etiqueta gravada da frente da maquina
export function desenharEtiqueta(
  cv: HTMLCanvasElement,
  head: string,
  mono: string,
) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "rgba(122,110,84,0.95)";
  ctx.font = `700 ${cv.height * 0.34}px ${head}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MASTERFILM SC-740", cv.width / 2, cv.height * 0.34);
  ctx.fillStyle = "rgba(122,110,84,0.8)";
  ctx.font = `500 ${cv.height * 0.2}px ${mono}`;
  ctx.fillText(
    "ARQUIVO · CASO DANIEL VORCARO",
    cv.width / 2,
    cv.height * 0.7,
  );
}
