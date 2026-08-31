import type { ReactNode } from "react";

type ArcadeTone = "cyan" | "magenta" | "yellow";

interface ArcadeButtonProps {
  children: ReactNode;
  href: string;
  tone: ArcadeTone;
}

interface ArcadePanelProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
}

interface StatusLampProps {
  label: string;
}

export function ArcadeButton({ children, href, tone }: ArcadeButtonProps) {
  return (
    <a className={`arcade-button arcade-button-${tone}`} href={href}>
      {children}
    </a>
  );
}

export function ArcadePanel({ children, eyebrow, title }: ArcadePanelProps) {
  return (
    <article className="arcade-panel">
      <p className="arcade-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

export function StatusLamp({ label }: StatusLampProps) {
  return (
    <p className="arcade-status">
      <span aria-hidden="true" />
      {label}
    </p>
  );
}
