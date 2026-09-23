import type { ReactNode } from 'react'
export function PageTitle({ title, hi, description, children }: { title: string; hi?: string; description?: string; children?: ReactNode }) {
  return <>
    <title>{`${title}, VYUHA`}</title>
    <div className="page-title"><div><h1 className="display">{title}</h1>{hi && <span className="hi" lang="hi">{hi}</span>}{description && <p>{description}</p>}</div>{children}</div>
  </>
}
