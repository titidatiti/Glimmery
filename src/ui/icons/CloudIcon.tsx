export function CloudIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 18h10a4 4 0 0 0 .5-7.98A5 5 0 0 0 6.5 8.5 4.5 4.5 0 0 0 7 18z" />
      <path d="M12 12v6" />
      <path d="M9.5 15 12 12l2.5 3" />
    </svg>
  );
}
