/** Shown while a page loads on a slow connection. No spinner text to translate. */
export default function Loading() {
  return (
    <main className="shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="skeleton" aria-hidden="true">
        <i className="big" />
        <i />
        <i style={{ width: "80%" }} />
        <i style={{ width: "60%" }} />
      </div>
    </main>
  );
}
