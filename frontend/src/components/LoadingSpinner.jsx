/**
 * components/LoadingSpinner.jsx
 * ──────────────────────────────
 * Centered loading indicator used during data fetches.
 */

export default function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
