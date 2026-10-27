"use client";

import { useCallback, useEffect, useState } from "react";
import SiteHeader from "./site-header";
import Hero from "./hero";
import Esquemas from "./esquemas";
import Timeline from "./timeline";
import Pessoas from "./pessoas";
import Ranking from "./ranking";
import SiteFooter from "./site-footer";
import PerfilDialog from "./perfil-dialog";
import Escala from "./escala";
import { BuscaOverlay, BuscaSection } from "./busca";

export default function MasterApp() {
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [focoEventoId, setFocoEventoId] = useState<string | null>(null);
  const [focoEsquemaId, setFocoEsquemaId] = useState<string | null>(null);

  // atalho "/" abre a busca
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
      if (!digitando && e.key === "/") {
        e.preventDefault();
        setBuscaAberta(true);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const abrirPessoa = useCallback((id: string) => {
    setPessoaAberta(id);
    setBuscaAberta(false);
  }, []);

  const abrirFato = useCallback((id: string) => {
    setPessoaAberta(null);
    setFocoEventoId(id);
    setBuscaAberta(false);
  }, []);

  const abrirEsquema = useCallback((id: string) => {
    setFocoEsquemaId(id);
    setBuscaAberta(false);
  }, []);

  const limparFocoEvento = useCallback(() => setFocoEventoId(null), []);
  const limparFocoEsquema = useCallback(() => setFocoEsquemaId(null), []);

  return (
    <div className="noise flex min-h-screen flex-col">
      <SiteHeader onOpenSearch={() => setBuscaAberta(true)} />
      <main>
        <Hero />
        <Escala />
        <Esquemas onPessoa={abrirPessoa} focoEsquemaId={focoEsquemaId} aoLimparFoco={limparFocoEsquema} />
        <Timeline onPessoa={abrirPessoa} focoEventoId={focoEventoId} aoLimparFoco={limparFocoEvento} />
        <Pessoas onPessoa={abrirPessoa} />
        <Ranking onPessoa={abrirPessoa} />
        <BuscaSection
          termo={termo}
          setTermo={setTermo}
          onPessoa={abrirPessoa}
          aoAbrirFato={abrirFato}
          aoAbrirEsquema={abrirEsquema}
        />
      </main>
      <SiteFooter />

      <PerfilDialog pessoaId={pessoaAberta} aoFechar={() => setPessoaAberta(null)} aoAbrirFato={abrirFato} />
      <BuscaOverlay
        aberto={buscaAberta}
        fechar={() => setBuscaAberta(false)}
        termo={termo}
        setTermo={setTermo}
        onPessoa={abrirPessoa}
        aoAbrirFato={abrirFato}
        aoAbrirEsquema={abrirEsquema}
      />
    </div>
  );
}
