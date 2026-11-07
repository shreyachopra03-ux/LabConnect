/** A drop with a result line through it: the lab, reduced to one mark. Inline SVG, no request. */
export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.8c3.4 4.1 6.2 7.7 6.2 11.2A6.2 6.2 0 0 1 5.8 14c0-3.5 2.8-7.1 6.2-11.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.6 15.2h2l1.1-2.4 1.6 4 1-1.6h1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ suffix }: { suffix?: string }) {
  return (
    <>
      <BrandMark />
      <span style={{ color: "inherit" }}>
        Company A{!suffix && <span className="brand-long"> Diagnostics</span>}
      </span>
      {suffix && <small>{suffix}</small>}
    </>
  );
}
