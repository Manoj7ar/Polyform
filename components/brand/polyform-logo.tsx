interface PolyformLogoMarkProps {
  className?: string;
  title?: string;
}

interface PolyformLogoBadgeProps {
  className?: string;
  markClassName?: string;
  title?: string;
}

export function PolyformLogoMark({ className, title }: PolyformLogoMarkProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <rect x="14" y="14" width="68" height="68" stroke="currentColor" strokeWidth="10" />
      <path d="M30 30H66V48" stroke="currentColor" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M30 30L66 66" stroke="currentColor" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M30 48V66H48" stroke="currentColor" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export function PolyformLogoBadge({ className, markClassName, title }: PolyformLogoBadgeProps): JSX.Element {
  return (
    <div className={className}>
      <div className="grid h-full w-full place-items-center rounded-[inherit] bg-[#e7e6df]">
        <PolyformLogoMark className={markClassName ?? "h-6 w-6 text-[#2f3338]"} title={title} />
      </div>
    </div>
  );
}
