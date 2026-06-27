import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Archivo_Black } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./components/SmoothScroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boechat. Faço seu negócio vender de verdade",
  description:
    "A era do amador acabou. Anúncio traz gente; estrutura faz vender. Construo a presença e o comercial que transformam quem te descobre em quem te paga.",
  metadataBase: new URL("https://boechat.company"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
