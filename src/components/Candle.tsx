// A small candle flame, the signature motif of the salon. Respects reduced
// motion via the global CSS (animation neutralized there).

export function Candle({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 22 33"
      fill="none"
      aria-hidden
      className="animate-flicker"
      style={{ filter: "drop-shadow(0 0 6px rgba(242,193,78,0.55))" }}
    >
      <ellipse cx="11" cy="29" rx="5" ry="2.4" fill="#9c7430" opacity="0.5" />
      <rect x="7.5" y="14" width="7" height="15" rx="2" fill="#e6d6b8" />
      <rect x="7.5" y="14" width="3" height="15" rx="2" fill="#fbf4e4" opacity="0.6" />
      <rect x="10.5" y="11" width="1" height="4" fill="#3a2618" />
      <path
        d="M11 1C11 1 5.5 6.5 5.5 10.2C5.5 13.4 8 15.5 11 15.5C14 15.5 16.5 13.4 16.5 10.2C16.5 6.5 11 1 11 1Z"
        fill="url(#flame)"
      />
      <path
        d="M11 5.5C11 5.5 8.5 8.5 8.5 10.5C8.5 12.2 9.6 13.4 11 13.4C12.4 13.4 13.5 12.2 13.5 10.5C13.5 8.5 11 5.5 11 5.5Z"
        fill="#fff6d8"
      />
      <defs>
        <linearGradient id="flame" x1="11" y1="1" x2="11" y2="15.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f2c14e" />
          <stop offset="0.6" stopColor="#e8951f" />
          <stop offset="1" stopColor="#b14a1f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
