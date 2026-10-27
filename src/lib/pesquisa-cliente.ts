/* ------------------------------------------------------------------ */
/* Pesquisa eleitoral: impressão anônima do lado do cliente             */
/*                                                                      */
/* Combina sinais estáveis do navegador (user agent, idiomas, fuso,     */
/* tela, hardware e um traçado de canvas) num resumo SHA-256. O valor   */
/* derivado não identifica a pessoa: é apenas um número grande que      */
/* muda de navegador para navegador e de dispositivo para dispositivo,  */
/* permitindo ao servidor recusar segundo voto do mesmo perfil sem      */
/* guardar quem é o perfil. O valor é persistido para sobreviver a      */
/* pequenas variações de sinais entre visitas.                          */
/* ------------------------------------------------------------------ */

export const CHAVE_PARTICIPOU = "voto-claro:pesquisa:participou";
const CHAVE_IMPRESSAO = "voto-claro:pesquisa:impressao";

type NavigatorEstendido = Navigator & { deviceMemory?: number };

/** SHA-256 em hexadecimal; com fallback determinístico quando o contexto
 *  não dispõe de crypto.subtle (ex.: páginas não seguras). */
export const resumoSha256 = async (texto: string): Promise<string> => {
  try {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(texto),
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    let h1 = 0x811c9dc5;
    let h2 = 0xdeadbeef;
    for (let i = 0; i < texto.length; i++) {
      const c = texto.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (c + i), 2654435761) >>> 0;
    }
    const meio = h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
    return meio + meio.split("").reverse().join("") + meio;
  }
};

/** Traçado de canvas com gradientes e textos: varia conforme GPU, fontes
 *  e sistema — um dos sinais de navegador mais estáveis sem invadir a
 *  privacidade. Vazio quando indisponível. */
const impressaoCanvas = (): string => {
  try {
    const cv = document.createElement("canvas");
    cv.width = 240;
    cv.height = 60;
    const ctx = cv.getContext("2d");
    if (!ctx) return "";
    const g = ctx.createLinearGradient(0, 0, 240, 60);
    g.addColorStop(0, "#10b981");
    g.addColorStop(1, "#f59e0b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 240, 60);
    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(20,83,45,0.85)";
    ctx.fillText("Voto Claro 2026 \u2713 DF", 6, 24);
    ctx.font = "12px 'Times New Roman'";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("pesquisa an\u00f4nima \u00b7 25/10/2026", 6, 44);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(200, 30, 18, 0, Math.PI * 1.5);
    ctx.stroke();
    return cv.toDataURL();
  } catch {
    return "";
  }
};

/** Sinais estáveis do navegador, concatenados. */
const sinais = (): string => {
  const nav = navigator as NavigatorEstendido;
  const partes: string[] = [
    navigator.userAgent,
    navigator.language,
    Array.from(navigator.languages ?? []).join(","),
    String(navigator.hardwareConcurrency ?? ""),
    String(nav.deviceMemory ?? ""),
    String(navigator.maxTouchPoints ?? 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    impressaoCanvas(),
  ];
  return partes.join("|");
};

/** Impressão do eleitor: SHA-256 dos sinais do navegador, persistido na
 *  primeira visita para permanecer estável mesmo se os sinais variarem. */
export const impressaoEleitor = async (): Promise<string> => {
  let salva: string | null = null;
  try {
    salva = localStorage.getItem(CHAVE_IMPRESSAO);
  } catch {
    /* armazenamento indisponível: recalcula a cada visita */
  }
  if (salva && /^[0-9a-f]{16,256}$/.test(salva)) return salva;
  const nova = await resumoSha256(sinais());
  try {
    localStorage.setItem(CHAVE_IMPRESSAO, nova);
  } catch {
    /* sem persistência: o valor ainda vale nesta sessão */
  }
  return nova;
};
