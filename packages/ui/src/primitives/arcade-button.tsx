import type { ReactNode } from "react";

export type ArcadeTone = "cyan" | "mint" | "pink" | "red" | "yellow";

interface ArcadeButtonProps {
  readonly children: ReactNode;
  readonly href: string;
  readonly tone?: ArcadeTone;
}

export function ArcadeButton({
  children,
  href,
  tone = "cyan",
}: ArcadeButtonProps) {
  return (
    <a className={`arcade-button arcade-button--${tone}`} href={href}>
      {children}
    </a>
  );
}
