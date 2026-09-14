import type { ReactNode } from 'react'
export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">INVESTIGATION WORKSPACE</p><h1>{title}</h1><p className="muted">{description}</p></div>{children}</div>
}
