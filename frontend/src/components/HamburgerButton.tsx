interface Props {
  open: boolean;
  onClick: () => void;
  className?: string;
}

/** Three bars that morph into an X when open — no extra deps, pure CSS transforms. */
export function HamburgerButton({ open, onClick, className = "" }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className={`relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 ${className}`}
    >
      <span
        className={`block h-[1.5px] w-5 bg-mint transition-all duration-300 ${
          open ? "rotate-45 translate-y-[6px]" : ""
        }`}
      />
      <span
        className={`block h-[1.5px] w-5 bg-mint transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`block h-[1.5px] w-5 bg-mint transition-all duration-300 ${
          open ? "-rotate-45 -translate-y-[6px]" : ""
        }`}
      />
    </button>
  );
}
