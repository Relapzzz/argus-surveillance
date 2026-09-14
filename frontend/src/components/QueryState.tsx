export function QueryState({ pending, error, retry }: { pending?: boolean; error?: Error | null; retry?: () => void }) {
  if (error) return <div role="alert" className="error-box"><p>{error.message}</p>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div>
  if (pending) return <p role="status" className="loading">Loading data…</p>
  return null
}
