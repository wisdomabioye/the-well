import type { Metadata } from "next";
import "@repo/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adorbitals — Launch on Bitcoin",
  description: "A self-custodial launchpad and arcade for Bitcoin Alkanes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
