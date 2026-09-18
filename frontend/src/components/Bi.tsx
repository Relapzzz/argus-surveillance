export function Bi({ en, hi }: { en: string; hi: string }) {
  return <span className="bi"><span>{en}</span><small lang="hi">{hi}</small></span>
}
