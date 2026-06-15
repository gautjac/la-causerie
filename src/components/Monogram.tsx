// A figure's place-card monogram — a brass-rimmed medallion in their accent
// colour. Used on the roster cards, in the chat header, and in the carnet.

export function Monogram({
  text,
  accent,
  size = 56,
}: {
  text: string;
  accent: string; // hex
  size?: number;
}) {
  const fontSize = text.length > 2 ? size * 0.34 : size * 0.42;
  return (
    <span
      aria-hidden
      className="inline-flex select-none items-center justify-center rounded-full font-display"
      style={{
        width: size,
        height: size,
        fontSize,
        lineHeight: 1,
        color: "#fbf4e4",
        background: `radial-gradient(circle at 32% 28%, ${accent}, ${shade(accent, -28)})`,
        border: "1.5px solid rgba(199,154,75,0.55)",
        boxShadow: `0 6px 18px -8px ${accent}, inset 0 1px 0 rgba(255,255,255,0.22)`,
        fontWeight: 600,
        letterSpacing: text.length > 2 ? "0" : "0.02em",
      }}
    >
      {text}
    </span>
  );
}

// Darken/lighten a hex colour by a percent (-100..100).
function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "");
  const num = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
