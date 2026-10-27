import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caso Master: tudo o que se sabe sobre o Banco Master e Daniel Vorcaro",
  description:
    "Dossiê público do caso Banco Master e Daniel Vorcaro: linha do tempo completa das apurações da Polícia Federal, do Banco Central, do STF e do TCU, ranking das pessoas mais mencionadas, busca por nomes, explicação passo a passo de cada esquema e todas as fontes com grau de comprovação.",
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
      "Linha do tempo, esquemas explicados passo a passo, ranking de envolvidos e busca por nomes, com fontes e grau de comprovação de cada fato.",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
