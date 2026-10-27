# Caso Master: dossiê público sobre o Banco Master e Daniel Vorcaro

**Caso Master** é um dossiê público e independente que reúne tudo o que se sabe até
**27/10/2026** sobre o colapso do Banco Master e os envolvimentos de Daniel Vorcaro,
com fontes e grau de comprovação em cada fato. Sem banco de dados e sem servidor:
todo o conteúdo é estático, compilado de documentos oficiais e matérias jornalísticas
públicas, e a navegação acontece inteiramente no navegador.

## O que há dentro

- **Linha do tempo** com 91 fatos documentados de 2017 a 27/10/2026, filtráveis por
  grau de comprovação, tipo de apuração (BC, PF, STF, TCU, CVM, FGC, Congresso,
  Justiça estrangeira) e por pessoa, com marcos do caso destacados.
- **Onze esquemas explicados passo a passo** em infográficos interativos: captação
  superjuros, fábrica de créditos fantasmas (Tirreno), compra do regulador, marchinha
  em Brasília, fundos de pensão, engrenagem no STF, milícia privada, fuga do dinheiro,
  compra da narração, colapso e a origem do grupo.
- **63 fichas de pessoas** com foto, papel, situação atual, grau de comprovação e as
  fontes de cada alegação, incluindo quem nega.
- **Ranking de menções**: as pessoas mais citadas nas apurações, com contagem objetiva
  derivada dos fatos e esquemas documentados.
- **Busca global** por nome, operação ou valor (tecla `/`), sem diferenciar acentos,
  cobrindo pessoas, fatos e esquemas.
- **Escala de comprovação** em quatro graus: oficial, multi-fonte, fonte única e
  alegação, com aviso permanente de presunção de inocência.

## Tecnologia

- Next.js 16 (App Router) + React 19 + TypeScript, exportação estática (`out/`),
  pronta para Cloudflare Pages/Workers.
- Tailwind CSS 4 + componentes shadcn/ui; sem framer-motion: animações em CSS +
  IntersectionObserver, pensadas para rodar bem até em aparelhos básicos.
- Dados em `src/data/master/*.json`, tipados em `src/lib/master.ts`.
- Fotos otimizadas localmente (640px JPEG) em `public/pessoas/`.

## Scripts

- `bun run dev`: ambiente de desenvolvimento (porta 3000).
- `bun run lint`: ESLint.
- `bun run build`: exportação estática em `out/`.

## Aviso legal

Nenhuma pessoa citada foi condenada criminalmente até a data da compilação. Alegações
não confirmadas estão sempre marcadas como alegação, com a identificação de quem alega
e de quem nega. Todo fato traz veículo, título, data e link da fonte original.
