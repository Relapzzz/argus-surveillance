import type { ReactNode } from 'react'
export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-head"><div><h1 className="display">{title}</h1><p>{description}</p></div>{children}</div>
}
