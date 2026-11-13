export function ArcadeStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="5.5"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 4v32M4 20h32M8.7 8.7l22.6 22.6M8.7 31.3 31.3 8.7" />
    </svg>
  );
}
