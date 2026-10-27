// Motor 3D da maquina de microfilme (three.js): corpo bege de epoca, visor
// grande com a cronologia projetada, carreteis, lente com engrenagem verde,
// botoes fisicos pressionaveis (raycast) e knobs que giram ao avancar o
// filme. Toda a parte reativa (React) fica em microfilme.tsx.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  ALT_TELA,
  LARG_TELA,
  desenharContador,
  desenharEtiqueta,
  desenharQuadro,
  type FontesTela,
} from "./tela";
import type { Fato } from "@/lib/master";

type Acao = "anterior" | "proximo" | "auto";

const COR = {
  corpo: 0xd8ccb0,
  corpoClaro: 0xe3d9c1,
  painel: 0xcfc2a4,
  mecanismo: 0x1b181d,
  filme: 0x232028,
  verde: 0x3d7a44,
  verdeClaro: 0x57a35e,
  borracha: 0x35312b,
  vermelho: 0xb0352c,
  carretel: 0xece7da,
  metal: 0x8f8878,
};

function material(cor: number, rugosidade = 0.55, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: rugosidade, metalness: 0.04, ...extra });
}

function retanguloArredondado(w: number, h: number, r: number) {
  const forma = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  forma.moveTo(x + r, y);
  forma.lineTo(x + w - r, y);
  forma.quadraticCurveTo(x + w, y, x + w, y + r);
  forma.lineTo(x + w, y + h - r);
  forma.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  forma.lineTo(x + r, y + h);
  forma.quadraticCurveTo(x, y + h, x, y + h - r);
  forma.lineTo(x, y + r);
  forma.quadraticCurveTo(x, y, x + r, y);
  return forma;
}

// ShapeGeometry gera UVs em unidades do mundo; normaliza para 0..1
function normalizarUV(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const dx = bb.max.x - bb.min.x;
  const dy = bb.max.y - bb.min.y;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(
      i,
      (pos.getX(i) - bb.min.x) / dx,
      (pos.getY(i) - bb.min.y) / dy,
    );
  }
  uv.needsUpdate = true;
}

function parafuso(r: number) {
  const g = new THREE.CylinderGeometry(r, r, r * 1.2, 12);
  const m = material(0x4a453b, 0.5, { metalness: 0.5 });
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export interface CenaMicrofilme {
  definirQuadro(fato: Fato, registro: number, total: number, animar: boolean, direcao: number): void;
  definirFontes(fontes: FontesTela): void;
  definirAtiva(ativa: boolean): void;
  aoAcao(cb: (acao: Acao) => void): void;
  dispose(): void;
}

export function criarCena(container: HTMLElement): CenaMicrofilme | null {
  try {
    const larg = container.clientWidth || 900;
    const alt = container.clientHeight || 560;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(larg, alt, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(36, larg / Math.max(1, alt), 0.1, 120);

    // ---------- luzes ----------
    const hemi = new THREE.HemisphereLight(0xf6ecd9, 0x241f18, 0.55);
    scene.add(hemi);
    const chave = new THREE.DirectionalLight(0xfff2dd, 1.45);
    chave.position.set(7, 13, 9);
    chave.castShadow = true;
    chave.shadow.mapSize.set(1024, 1024);
    chave.shadow.camera.left = -9;
    chave.shadow.camera.right = 9;
    chave.shadow.camera.top = 16;
    chave.shadow.camera.bottom = -2;
    chave.shadow.bias = -0.0006;
    scene.add(chave);
    const contraluz = new THREE.DirectionalLight(0xcfd8e8, 0.4);
    contraluz.position.set(-8, 7, -7);
    scene.add(contraluz);
    const brilhoVisor = new THREE.PointLight(0xfff3de, 2.4, 8, 2);
    scene.add(brilhoVisor);
    const lampadaBay = new THREE.PointLight(0xffd9a2, 1.8, 5.5, 2);
    lampadaBay.position.set(0, 4.9, 1.0);
    scene.add(lampadaBay);

    // piso que recebe a sombra
    const piso = new THREE.Mesh(
      new THREE.CircleGeometry(16, 40),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    );
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    scene.add(piso);

    // ---------- texturas de tela ----------
    const cvTela = document.createElement("canvas");
    cvTela.width = LARG_TELA;
    cvTela.height = ALT_TELA;
    const texTela = new THREE.CanvasTexture(cvTela);
    texTela.colorSpace = THREE.SRGBColorSpace;
    texTela.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const cvContador = document.createElement("canvas");
    cvContador.width = 256;
    cvContador.height = 96;
    const texContador = new THREE.CanvasTexture(cvContador);
    texContador.colorSpace = THREE.SRGBColorSpace;

    const cvEtiqueta = document.createElement("canvas");
    cvEtiqueta.width = 512;
    cvEtiqueta.height = 136;
    const texEtiqueta = new THREE.CanvasTexture(cvEtiqueta);
    texEtiqueta.colorSpace = THREE.SRGBColorSpace;

    // granulacao animada sobre o visor
    const cvRuido = document.createElement("canvas");
    cvRuido.width = 160;
    cvRuido.height = 160;
    const ctxRuido = cvRuido.getContext("2d")!;
    const img = ctxRuido.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 145;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 26 + Math.random() * 42;
    }
    ctxRuido.putImageData(img, 0, 0);
    const texRuido = new THREE.CanvasTexture(cvRuido);
    texRuido.wrapS = THREE.RepeatWrapping;
    texRuido.wrapT = THREE.RepeatWrapping;
    texRuido.repeat.set(7, 4);

    // ---------- construcao da maquina ----------
    const maquina = new THREE.Group();
    scene.add(maquina);
    const mCorpo = material(COR.corpo, 0.62);
    const mCorpoClaro = material(COR.corpoClaro, 0.58);
    const mPainel = material(0xc2b394, 0.6);
    const mEscuro = material(COR.mecanismo, 0.62);
    const mFilme = material(COR.filme, 0.45);
    const mCarretel = material(COR.carretel, 0.5);

    const adicionar = (mesh: THREE.Object3D, x: number, y: number, z: number) => {
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      maquina.add(mesh);
      return mesh;
    };

    // pe e base
    for (const [px, pz] of [[-4.4, -2.7], [4.4, -2.7], [-4.4, 2.7], [4.4, 2.7]]) {
      adicionar(new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.28, 0.9, 2, 0.08), mEscuro), px, 0.14, pz);
    }
    adicionar(new THREE.Mesh(new RoundedBoxGeometry(10.6, 2.7, 7.4, 4, 0.24), mCorpo), 0, 1.65, 0);

    // knobs frontais (esquerda recua, direita avanca)
    const criarKnob = (x: number) => {
      const grupo = new THREE.Group();
      const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.6, 28), mCorpoClaro);
      corpo.rotation.x = Math.PI / 2;
      corpo.castShadow = true;
      grupo.add(corpo);
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 28), material(0x8a8272, 0.7));
      face.rotation.x = Math.PI / 2;
      face.position.z = 0.3;
      grupo.add(face);
      for (let i = 0; i < 20; i += 1) {
        const nervura = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.16), material(COR.corpoClaro, 0.7));
        const ang = (i / 20) * Math.PI * 2;
        nervura.position.set(Math.cos(ang) * 0.99, Math.sin(ang) * 0.99, 0.02);
        nervura.rotation.z = ang;
        grupo.add(nervura);
      }
      const marcador = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), material(COR.vermelho, 0.4));
      marcador.position.set(0, 0.6, 0.32);
      grupo.add(marcador);
      grupo.position.set(x, 1.7, 3.85);
      maquina.add(grupo);
      return grupo;
    };
    const knobEsq = criarKnob(-2.6);
    const knobDir = criarKnob(2.6);

    // etiqueta da frente
    const etiqueta = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.9),
      new THREE.MeshBasicMaterial({ map: texEtiqueta, transparent: true }),
    );
    etiqueta.position.set(0, 1.7, 3.72);
    maquina.add(etiqueta);

    // biruta do mecanismo (compartimento escuro entre base e visor)
    adicionar(new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.2, 4.8), mEscuro), 0, 3.1, -0.3);
    adicionar(new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 4.8), mCorpo), -4.7, 4.4, -0.3);
    adicionar(new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 4.8), mCorpo), 4.7, 4.4, -0.3);
    adicionar(new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.6, 0.2), mEscuro), 0, 4.4, -2.6);
    // penteadeira superior que sustenta o visor
    adicionar(new THREE.Mesh(new RoundedBoxGeometry(11.4, 0.6, 4.6, 3, 0.18), mCorpo), 0, 5.9, -0.9);

    // carreteis
    const criarCarretel = (x: number, comFilme: boolean, comManivela: boolean) => {
      const grupo = new THREE.Group();
      const disco = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.26, 30), mCarretel);
      disco.rotation.x = Math.PI / 2;
      disco.castShadow = true;
      grupo.add(disco);
      for (let i = 0; i < 5; i += 1) {
        const raio = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.28), mCarretel);
        raio.rotation.z = (i / 5) * Math.PI * 2;
        raio.castShadow = true;
        grupo.add(raio);
      }
      const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.4, 18), mEscuro);
      cubo.rotation.x = Math.PI / 2;
      grupo.add(cubo);
      if (comFilme) {
        const bobina = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.28, 14, 40), mFilme);
        grupo.add(bobina);
      }
      if (comManivela) {
        const braco = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 0.14), material(COR.vermelho, 0.45));
        braco.position.set(0.5, 0.35, 0.26);
        grupo.add(braco);
        const pegada = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12), material(COR.vermelho, 0.45));
        pegada.position.set(0.95, 0.7, 0.26);
        grupo.add(pegada);
      }
      grupo.position.set(x, 4.5, 0.45);
      maquina.add(grupo);
      return grupo;
    };
    const carretelEsq = criarCarretel(-2.55, true, false);
    const carretelDir = criarCarretel(2.55, false, true);

    // rolos guia + tira de filme
    for (const px of [-1.3, 1.3]) {
      const guia = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 14), material(COR.metal, 0.35, { metalness: 0.6 }));
      guia.rotation.x = Math.PI / 2;
      guia.position.set(px, 5.28, 0.45);
      guia.castShadow = true;
      maquina.add(guia);
    }
    const tiraFilme = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.05, 0.3), mFilme);
    tiraFilme.position.set(0, 5.3, 0.45);
    maquina.add(tiraFilme);

    // torre da lente com engrenagem verde
    const torre = new THREE.Group();
    const baseTorre = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.74, 0.5, 20), mEscuro);
    torre.add(baseTorre);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.55, 20), material(0x55504a, 0.4, { metalness: 0.4 }));
    tubo.position.y = 0.5;
    torre.add(tubo);
    const lente = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 24, 18),
      new THREE.MeshPhysicalMaterial({ color: 0x0b0d12, roughness: 0.06, metalness: 0.3, clearcoat: 1, envMapIntensity: 1.6 }),
    );
    lente.scale.z = 0.55;
    lente.rotation.x = Math.PI / 2;
    lente.position.set(0, 0.78, 0.28);
    torre.add(lente);
    const engrenagem = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.13, 12, 26), material(COR.verde, 0.45));
    engrenagem.add(aro);
    for (let i = 0; i < 14; i += 1) {
      const dente = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.2), material(COR.verde, 0.5));
      const ang = (i / 14) * Math.PI * 2;
      dente.position.set(Math.cos(ang) * 0.74, Math.sin(ang) * 0.74, 0);
      dente.rotation.z = ang;
      engrenagem.add(dente);
    }
    engrenagem.position.set(0, 1.28, 0);
    torre.add(engrenagem);
    torre.position.set(0, 4.1, 0.75);
    maquina.add(torre);

    // painel de comandos
    adicionar(new THREE.Mesh(new RoundedBoxGeometry(9.5, 1.05, 0.55, 3, 0.12), mPainel), 0, 6.22, 2.35);

    const botoes: THREE.Mesh[] = [];
    const baseYBotoes = new Map<THREE.Mesh, number>();

    const criarBotao = (x: number, acao: Acao) => {
      const botao = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.64, 0.3, 2, 0.09), material(COR.corpoClaro, 0.5));
      botao.position.set(x, 6.22, 2.66);
      botao.userData.acao = acao;
      botao.castShadow = true;
      maquina.add(botao);
      botoes.push(botao);
      baseYBotoes.set(botao, botao.position.y);
      const seta = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.3, 4),
        material(0x4c453a, 0.5),
      );
      seta.rotation.z = acao === "anterior" ? Math.PI / 2 : -Math.PI / 2;
      seta.position.set(x + (acao === "anterior" ? -0.07 : 0.07), 6.22, 2.84);
      maquina.add(seta);
      return botao;
    };
    criarBotao(-1.9, "anterior");
    criarBotao(-1.05, "proximo");

    // botao verde de projecao automatica
    const botaoAuto = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 18), material(COR.verdeClaro, 0.4, { emissive: 0x1c4a22, emissiveIntensity: 0.6 }));
    botaoAuto.rotation.x = Math.PI / 2;
    botaoAuto.position.set(0.35, 6.22, 2.69);
    botaoAuto.userData.acao = "auto";
    maquina.add(botaoAuto);
    (botaoAuto as unknown as { baseZ?: number }).baseZ = botaoAuto.position.z;

    // contador verde
    const aroContador = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.55, 0.12, 2, 0.05), mEscuro);
    aroContador.position.set(1.95, 6.22, 2.64);
    maquina.add(aroContador);
    const janelaContador = new THREE.Mesh(
      new THREE.PlaneGeometry(1.22, 0.42),
      new THREE.MeshBasicMaterial({ map: texContador, toneMapped: false }),
    );
    janelaContador.position.set(1.95, 6.22, 2.71);
    maquina.add(janelaContador);

    // led de energia
    const led = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xff5a4a, emissive: 0xff3524, emissiveIntensity: 2.2, roughness: 0.3 }),
    );
    led.rotation.x = Math.PI / 2;
    led.position.set(3.4, 6.22, 2.68);
    maquina.add(led);

    for (const px of [-4.55, 4.55]) {
      const par = parafuso(0.055);
      par.position.set(px, 6.22, 2.66);
      maquina.add(par);
    }

    // gabinete do visor (tombado para tras)
    const gabinete = new THREE.Group();
    gabinete.position.set(0, 9.15, -0.75);
    gabinete.rotation.x = -0.13;
    maquina.add(gabinete);
    const corpoVisor = new THREE.Mesh(new RoundedBoxGeometry(11.3, 6.9, 5.2, 4, 0.3), mCorpo);
    corpoVisor.castShadow = true;
    corpoVisor.receiveShadow = true;
    gabinete.add(corpoVisor);

    // moldura + tela + vidro + granulacao
    const formaMoldura = retanguloArredondado(10.7, 6.6, 0.4);
    const burcoTela = new THREE.Path();
    const furo = retanguloArredondado(9.6, 5.75, 0.36);
    burcoTela.copy(furo);
    formaMoldura.holes.push(burcoTela);
    const moldura = new THREE.Mesh(
      new THREE.ExtrudeGeometry(formaMoldura, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }),
      mCorpoClaro,
    );
    moldura.position.z = 2.58;
    moldura.castShadow = true;
    gabinete.add(moldura);

    const geoTela = new THREE.ShapeGeometry(retanguloArredondado(9.6, 5.75, 0.36), 12);
    normalizarUV(geoTela);
    const tela = new THREE.Mesh(
      geoTela,
      new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }),
    );
    tela.position.z = 2.62;
    gabinete.add(tela);

    const vidro = new THREE.Mesh(
      new THREE.ShapeGeometry(retanguloArredondado(9.75, 5.9, 0.38), 12),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 1.5, clearcoat: 1 }),
    );
    vidro.position.z = 3.07;
    gabinete.add(vidro);

    const granulado = new THREE.Mesh(
      new THREE.ShapeGeometry(retanguloArredondado(9.6, 5.75, 0.36), 12),
      new THREE.MeshBasicMaterial({ map: texRuido, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    normalizarUV(granulado.geometry);
    granulado.position.z = 2.66;
    gabinete.add(granulado);

    for (const [px, py] of [[-5.15, -3.1], [5.15, -3.1], [-5.15, 3.1], [5.15, 3.1]]) {
      const par = parafuso(0.07);
      par.position.set(px, py, 3.02);
      gabinete.add(par);
    }

    // aletas laterais
    for (let i = 0; i < 6; i += 1) {
      for (const lado of [-1, 1]) {
        const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 3.4), material(0xb9ad92, 0.7));
        aleta.position.set(lado * 5.66, 7.6 + i * 0.55, -0.75);
        maquina.add(aleta);
      }
    }

    // brilho do visor acompanhando a posicao mundial da tela
    brilhoVisor.position.set(0, 9.5, 6.0);

    // ---------- estado do motor ----------
    let fontesTela: FontesTela = { head: "Georgia, serif", mono: '"Courier New", monospace' };
    let fatoAtual: Fato | null = null;
    let registroAtual = 1;
    let totalAtual = 1;
    let cbAcao: ((acao: Acao) => void) | null = null;
    let ativa = true;
    let disposado = false;

    let transicao = 0; // 0..1
    let transindo = false;
    let direcaoTransicao = 1;
    let canvasTransicao: HTMLCanvasElement | null = null;
    let pressAnim = 0;
    let botaoPressionado: THREE.Object3D | null = null;

    desenharEtiqueta(cvEtiqueta, fontesTela.head, fontesTela.mono);
    texEtiqueta.needsUpdate = true;

    const redesenharQuadroAtual = () => {
      if (!fatoAtual) return;
      desenharQuadro(cvTela, fatoAtual, registroAtual, totalAtual, fontesTela);
      texTela.needsUpdate = true;
    };

    const api: CenaMicrofilme = {
      definirQuadro(fato, registro, total, animar, direcao) {
        if (disposado) return;
        totalAtual = total;
        if (animar && fatoAtual && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          // congela o quadro atual em canvas auxiliar para a passagem de filme
          canvasTransicao = document.createElement("canvas");
          canvasTransicao.width = LARG_TELA;
          canvasTransicao.height = ALT_TELA;
          canvasTransicao.getContext("2d")!.drawImage(cvTela, 0, 0);
          direcaoTransicao = direcao >= 0 ? 1 : -1;
          transicao = 0;
          transindo = true;
        }
        fatoAtual = fato;
        registroAtual = registro;
        desenharQuadro(cvTela, fato, registro, total, fontesTela);
        texTela.needsUpdate = true;
        desenharContador(cvContador, registro, total, fontesTela.mono);
        texContador.needsUpdate = true;
      },
      definirFontes(f) {
        if (disposado) return;
        fontesTela = f;
        redesenharQuadroAtual();
        desenharContador(cvContador, registroAtual, totalAtual, f.mono);
        texContador.needsUpdate = true;
        desenharEtiqueta(cvEtiqueta, f.head, f.mono);
        texEtiqueta.needsUpdate = true;
      },
      definirAtiva(v) {
        ativa = v;
      },
      aoAcao(cb) {
        cbAcao = cb;
      },
      dispose() {
        disposado = true;
        renderer.dispose();
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        });
        pmrem.dispose();
        renderer.domElement.remove();
      },
    };

    // ---------- interacao por raycast ----------
    const raycaster = new THREE.Raycaster();
    const ponteiro = new THREE.Vector2();
    let arrasto = { x: 0, y: 0, ativo: false };

    const alvos = (): THREE.Object3D[] => [...botoes, botaoAuto, knobDir, knobEsq];

    const resolverAcao = (obj: THREE.Object3D): Acao | null => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (cur.userData && cur.userData.acao) return cur.userData.acao as Acao;
        if (cur === knobDir) return "proximo";
        if (cur === knobEsq) return "anterior";
        cur = cur.parent;
      }
      return null;
    };

    const aoPonteiroMover = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ponteiro.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ponteiro.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      arrasto.x = ponteiro.x;
      arrasto.y = ponteiro.y;
      arrasto.ativo = true;
      raycaster.setFromCamera(ponteiro, camera);
      const atingido = raycaster.intersectObjects(alvos(), true)[0];
      renderer.domElement.style.cursor = atingido ? "pointer" : "";
    };

    const aoPonteiroSair = () => {
      arrasto.ativo = false;
      renderer.domElement.style.cursor = "";
    };

    const aoPonteiroBaixo = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ponteiro.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ponteiro.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ponteiro, camera);
      const atingido = raycaster.intersectObjects(alvos(), true)[0];
      if (!atingido) return;
      const acao = resolverAcao(atingido.object);
      if (!acao) return;
      botaoPressionado = atingido.object;
      pressAnim = 1;
      cbAcao?.(acao);
    };

    renderer.domElement.addEventListener("pointermove", aoPonteiroMover);
    renderer.domElement.addEventListener("pointerdown", aoPonteiroBaixo);
    renderer.domElement.addEventListener("pointerleave", aoPonteiroSair);

    // ---------- redimensionamento ----------
    const ajustar = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const aspecto = w / h;
      camera.aspect = aspecto;
      if (aspecto < 0.95) {
        camera.fov = 49;
        camera.position.set(0, 6.6, 25);
      } else if (aspecto < 1.45) {
        camera.fov = 41;
        camera.position.set(0, 6.5, 22.5);
      } else {
        camera.fov = 35;
        camera.position.set(0, 6.5, 22.5);
      }
      camera.lookAt(0, 6.3, 0);
      camera.updateProjectionMatrix();
    };
    ajustar();
    const obsTamanho = new ResizeObserver(ajustar);
    obsTamanho.observe(container);

    // ---------- laco de animacao ----------
    let raf = 0;
    let tAnterior = performance.now();
    let tRelogio = 0;

    const laco = (t: number) => {
      if (disposado) return;
      raf = requestAnimationFrame(laco);
      if (!ativa || document.hidden) {
        tAnterior = t;
        return;
      }
      const dt = Math.min(0.05, (t - tAnterior) / 1000);
      tAnterior = t;
      tRelogio += dt;

      // passagem de filme
      if (transindo) {
        transicao = Math.min(1, transicao + dt / 0.55);
        const suave = transicao < 0.5 ? 4 * transicao ** 3 : 1 - (-2 * transicao + 2) ** 3 / 2;
        const giro = suave * 2.3 * direcaoTransicao;
        carretelEsq.rotation.z = giro;
        carretelDir.rotation.z = giro;
        knobDir.rotation.z = -suave * 1.1 * direcaoTransicao;
        knobEsq.rotation.z = -suave * 1.1 * direcaoTransicao;
        engrenagem.rotation.z = suave * 1.7 * direcaoTransicao;
        const ctx = cvTela.getContext("2d")!;
        const H = ALT_TELA;
        const desloc = suave * H;
        ctx.fillStyle = "#191510";
        ctx.fillRect(0, 0, LARG_TELA, H);
        // quadro antigo sai na direcao do filme; o novo entra logo a seguir
        ctx.drawImage(canvasTransicao!, 0, -direcaoTransicao * desloc);
        ctx.drawImage(cvTela, 0, direcaoTransicao * (H - desloc));
        // faixa de obturador no encontro dos quadros
        const faixaY = direcaoTransicao > 0 ? H - desloc : desloc;
        ctx.fillStyle = `rgba(255,250,232,${0.18 * (1 - Math.abs(suave - 0.5) * 2)})`;
        ctx.fillRect(0, faixaY - 26, LARG_TELA, 52);
        if (transicao >= 1) {
          transindo = false;
          canvasTransicao = null;
          redesenharQuadroAtual();
        }
        texTela.needsUpdate = true;
      }

      // tremor e cintilacao de projecao
      const cintila = 0.965 + Math.sin(tRelogio * 9.3) * 0.012 + Math.sin(tRelogio * 23.7) * 0.008;
      (tela.material as THREE.MeshBasicMaterial).color.setScalar(cintila);
      brilhoVisor.intensity = 4.6 + Math.sin(tRelogio * 7.1) * 0.35;
      led.material.emissiveIntensity = 1.9 + Math.sin(tRelogio * 2.2) * 0.35;

      texRuido.offset.x = (tRelogio * 0.021) % 1;
      texRuido.offset.y = (tRelogio * 0.013) % 1;

      // pressionar botao
      if (pressAnim > 0) {
        pressAnim = Math.max(0, pressAnim - dt * 6);
        const alvoPress = botaoPressionado;
        if (alvoPress) {
          const base = baseYBotoes.get(alvoPress as THREE.Mesh);
          if (base !== undefined) alvoPress.position.y = base - pressAnim * 0.12;
          const baseZ = (alvoPress as unknown as { baseZ?: number }).baseZ;
          if (baseZ !== undefined) alvoPress.position.z = baseZ - pressAnim * 0.1;
        }
      }

      // balanco sutil e parallax do ponteiro
      const alvoYaw = arrasto.ativo ? arrasto.x * 0.05 : 0;
      maquina.rotation.y += ((alvoYaw + Math.sin(tRelogio * 0.22) * 0.022) - maquina.rotation.y) * Math.min(1, dt * 3);
      maquina.rotation.x += ((-arrasto.y * 0.02 + Math.sin(tRelogio * 0.17) * 0.01) - maquina.rotation.x) * Math.min(1, dt * 3);

      renderer.render(scene, camera);
    };

    // quadro auxiliar: o quadro antigo e congelado em canvas proprio na hora
    // do avanco (ver definirQuadro); aqui apenas o laco de animacao comeca
    raf = requestAnimationFrame(laco);

    return api;
  } catch {
    return null;
  }
}
