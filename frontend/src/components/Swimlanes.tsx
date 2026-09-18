import { useRef, useState, type MouseEvent } from 'react'
import { formatDateTime, formatDay, formatInr } from '@/lib/format'
import { groupColor, palette } from '@/lib/graph'
import { dayKey, dayStart, ticks, type ContactEvent, type FirEvent, type Lane } from '@/lib/timeline'

const width = 1100, column = 200, right = 46, lane = 28, axis = 30
const plot = width - right - column

interface Tip { left: number; top: number; lines: string[] }

export default function Swimlanes({ lanes, firs, span, day, onPickDay, summary }: { lanes: Lane[]; firs: FirEvent[]; span: [Date, Date]; day: string; onPickDay: (day: string) => void; summary: string }) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<SVGSVGElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [from, to] = span
  const at = (time: Date) => column + (time.getTime() - from.getTime()) / (to.getTime() - from.getTime()) * plot
  const height = axis + lane * (lanes.length + 1) + 6
  const largest = Math.max(1, ...lanes.flatMap(l => l.events.map(e => e.kind === 'transfer' ? e.amount : 0)))
  const side = (amount: number) => 5 + 11 * Math.sqrt(amount / largest)
  const { months, weeks } = ticks(span)

  const show = (pointer: MouseEvent, lines: string[]) => {
    const edge = box.current!.getBoundingClientRect()
    setTip({ left: pointer.clientX - edge.left + box.current!.scrollLeft, top: pointer.clientY - edge.top, lines })
  }
  const pickAt = (clientX: number) => {
    const edge = frame.current!.getBoundingClientRect()
    const units = (clientX - edge.left) * (width / edge.width)
    const time = from.getTime() + Math.min(Math.max(units - column, 0), plot) / plot * (to.getTime() - from.getTime())
    onPickDay(dayKey(new Date(time)))
  }
  const describe = (event: ContactEvent, label: string) => event.kind === 'call'
    ? [formatDateTime(event.at.toISOString()), event.cell ? `Called ${label} near ${event.cell} tower` : `Called ${label}`]
    : [formatDateTime(event.at.toISOString()), `${event.direction === 'in' ? 'Received' : 'Sent'} ${formatInr(event.amount)} ${event.direction === 'in' ? 'from' : 'to'} ${label}`]

  return <div className="swim" ref={box} onMouseLeave={() => setTip(null)}>
    <svg ref={frame} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: 900 }} role="img" aria-label={summary}>
      <rect className="swim-field" x={column} y={axis} width={plot} height={height - axis - 6} />
      {weeks.map(week => <line key={`w${week.getTime()}`} className="swim-week" x1={at(week)} x2={at(week)} y1={axis} y2={height - 6} />)}
      {months.map(month => <g key={`m${month.getTime()}`}>
        <line className="swim-month" x1={at(month)} x2={at(month)} y1={axis - 14} y2={height - 6} />
        <text className="swim-tick" x={at(month) + 5} y={axis - 16}>{formatDay(month)}</text>
      </g>)}
      {day && <line className="swim-day" x1={at(new Date(dayStart(day).getTime() + 432e5))} x2={at(new Date(dayStart(day).getTime() + 432e5))} y1={axis} y2={height - 6} />}

      <text className="swim-label" x={8} y={axis + lane / 2 + 4}>FIRs</text>
      <rect className="swim-strip" x={column} y={axis} width={plot} height={lane} onClick={event => pickAt(event.clientX)} />
      {firs.map(fir => <g key={fir.caseId} className="swim-flag" onClick={() => onPickDay(dayKey(fir.at))} onMouseEnter={event => show(event, [formatDateTime(fir.at.toISOString()), `Named in ${fir.firNumber}, ${fir.station}`])}>
        <line x1={at(fir.at)} x2={at(fir.at)} y1={axis + lane - 4} y2={axis + 6} />
        <rect x={at(fir.at)} y={axis + 6} width={7} height={6} />
        <text x={at(fir.at) + 10} y={axis + 12}>{fir.firNumber.replace('FIR-2026-', '')}</text>
      </g>)}

      {lanes.map((row, index) => {
        const top = axis + lane * (index + 1)
        const middle = top + lane / 2
        return <g key={row.id}>
          <line className="swim-rule" x1={0} x2={width - right} y1={top} y2={top} />
          <rect className="swim-chip" x={8} y={middle - 5} width={10} height={10} rx={2} fill={groupColor(row.group)} />
          <text className="swim-label" x={24} y={middle + 4}>{row.label}</text>
          <rect className="swim-strip" x={column} y={top} width={plot} height={lane} onClick={event => pickAt(event.clientX)} />
          {row.events.map((event, mark) => event.kind === 'call'
            ? <rect key={mark} className="swim-mark" x={at(event.at)} y={middle - 6} width={1} height={12} fill={palette.phone} onClick={() => onPickDay(dayKey(event.at))} onMouseEnter={pointer => show(pointer, describe(event, row.label))} />
            : <rect key={mark} className="swim-mark" x={at(event.at) - side(event.amount) / 2} y={middle - side(event.amount) / 2} width={side(event.amount)} height={side(event.amount)} rx={1} fill={event.direction === 'in' ? palette.account : 'var(--ink)'} onClick={() => onPickDay(dayKey(event.at))} onMouseEnter={pointer => show(pointer, describe(event, row.label))} />)}
        </g>
      })}
    </svg>
    {tip && <div className="swim-tip" style={{ left: tip.left, top: tip.top }}>{tip.lines.map(line => <span key={line}>{line}</span>)}</div>}
  </div>
}
