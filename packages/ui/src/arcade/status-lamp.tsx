export type StatusTone = "attention" | "ready" | "unavailable";

interface StatusLampProps {
  readonly label: string;
  readonly tone?: StatusTone;
}

export function StatusLamp({ label, tone = "attention" }: StatusLampProps) {
  return (
    <p className={`status-lamp status-lamp--${tone}`} role="status">
      <span className="status-lamp__light" aria-hidden="true" />
      {label}
    </p>
  );
}
