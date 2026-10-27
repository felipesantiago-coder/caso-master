import type { Metadata, Viewport } from "next";
import { Courier_Prime, Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografia de manchete: condensada de jornal investigativo
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Tipografia de máquina de escrever: corpo dos expedientes
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Caso Master: tudo o que se sabe sobre o Banco Master e Daniel Vorcaro",
  description:
    "Dossiê público do caso Banco Master e Daniel Vorcaro: linha do tempo completa das apurações da Polícia Federal, do Banco Central, do STF e do TCU, ranking das pessoas mais mencionadas, redes de conexão 3D interativas dos esquemas, busca por nomes e todas as fontes com grau de comprovação.",
  keywords: [
    "Banco Master",
    "Daniel Vorcaro",
    "caso Master",
    "Operação Compliance Zero",
    "BRB",
    "FGC",
    "fraude bancária",
    "linha do tempo",
    "dossiê",
  ],
  authors: [{ name: "Felipe Santiago" }],
  openGraph: {
    title: "Caso Master: tudo o que se sabe sobre o Banco Master e Daniel Vorcaro",
    description:
      "Linha do tempo, esquemas explicados passo a passo, redes de conexão 3D interativas, ranking de envolvidos e busca por nomes, com fontes e grau de comprovação de cada fato.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* marca a presença de JS para o aprimoramento progressivo das animações */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} ${courierPrime.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
