import type { Metadata } from "next";
import { Bungee, Chakra_Petch, Press_Start_2P } from "next/font/google";
import "@repo/ui/styles.css";
import "./globals.css";

const bodyFont = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-chakra",
  weight: ["400", "500", "600", "700"],
});
const displayFont = Bungee({
  subsets: ["latin"],
  variable: "--font-bungee",
  weight: "400",
});
const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-press-start",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Adorbitals — Launch on Bitcoin",
  description: "A self-custodial launchpad and arcade for Bitcoin Alkanes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${pixelFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
