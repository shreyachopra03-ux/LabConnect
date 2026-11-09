"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button with a pending state: disabled and labelled while the form is sending.
 * On weak connections this stops double taps (two OTPs, two resends). Without JavaScript
 * it is a normal submit button, so every form still works.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn",
  style,
  title,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} style={style} title={title} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
