import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d'
import { Maximize2, Minus, Plus } from 'lucide-react'
import type { GraphNode, GraphResponse, Relationship, RelationshipType } from '@/api/types'
import { formatLabel } from '@/lib/format'
import { groupColor, groupName, palette } from '@/lib/graph'
import { Button } from './ui/button'

type EdgeData = Omit<Relationship, 'source' | 'target'>
type CanvasNode = NodeObject<GraphNode>
type CanvasEdge = LinkObject<GraphNode, EdgeData>
type Point = { x: number; y: number }

const REL_SIZE = 3
const STRING = '#B42318'
const INK = '#132238'
const PAPER = '#F7F7F4'
const edgeHue: Record<RelationshipType, string> = { called: '#1971C2', transacted: '#2B8A3E', co_accused: '#132238', associate_of: '#132238', member_of: '#0C8599', owns: '#5C6B7D', resides_at: '#C2255C', seen_at: '#C2255C', mentioned_in: '#868E96' }
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const nodeVal = (n: GraphNode) => n.type === 'person' ? 2.2 + n.metrics.pagerank * 260 : n.type === 'case' ? 0.7 : 1 + n.metrics.pagerank * 90
const radiusOf = (n: GraphNode) => Math.sqrt(nodeVal(n)) * REL_SIZE
const endpoint = (end: CanvasEdge['source']) => typeof end === 'object' && end ? String(end.id) : String(end)
const alpha = (hex: string, a: number) => hex + Math.round(a * 255).toString(16).padStart(2, '0')

function hull(points: Point[]): Point[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Point[] = [], upper: Point[] = []
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  for (const p of pts.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}
function tracePadded(ctx: CanvasRenderingContext2D, ring: Point[], pad: number) {
  ctx.beginPath()
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const prev = ring[(i + n - 1) % n], p = ring[i], next = ring[(i + 1) % n]
    ctx.arc(p.x, p.y, pad, Math.atan2(p.y - prev.y, p.x - prev.x) - Math.PI / 2, Math.atan2(next.y - p.y, next.x - p.x) - Math.PI / 2)
  }
  ctx.closePath()
}

export default function GraphCanvas({ graph, names, selected, onSelect, onDeselect, highlightNodes = [], highlightEdges = [], colorBy, showGroups, children }: { graph: GraphResponse; names?: Map<number, string>; selected?: string; onSelect: (id: string) => void; onDeselect: () => void; highlightNodes?: string[]; highlightEdges?: string[]; colorBy: 'type' | 'group'; showGroups: boolean; children?: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  const canvas = useRef<ForceGraphMethods<CanvasNode, CanvasEdge> | undefined>(undefined)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const hover = useRef<string>(undefined)
  const previous = useRef(new Map<string, CanvasNode>())
  const fittedFor = useRef(-1)
  const data = useMemo(() => ({
    nodes: graph.nodes.map((n): CanvasNode => { const p = previous.current.get(n.id); return p ? { ...n, x: p.x, y: p.y } : { ...n } }),
    links: graph.edges.map(e => ({ ...e }) as CanvasEdge),
  }), [graph])
  useEffect(() => { previous.current = new Map(data.nodes.map(n => [n.id, n])) }, [data])
  const nodeHighlights = useMemo(() => new Set(highlightNodes), [highlightNodes])
  const edgeHighlights = useMemo(() => new Set(highlightEdges), [highlightEdges])
  const neighborhood = useMemo(() => {
    if (!selected) return undefined
    const set = new Set([selected])
    graph.edges.forEach(e => { if (e.source === selected) set.add(e.target); else if (e.target === selected) set.add(e.source) })
    return set
  }, [graph, selected])
  const focus = useMemo(() => nodeHighlights.size ? new Set(selected ? [...nodeHighlights, selected] : nodeHighlights) : neighborhood, [nodeHighlights, neighborhood, selected])
  const labelled = useMemo(() => new Set(graph.nodes.filter(n => n.type === 'person').sort((a, b) => b.metrics.pagerank - a.metrics.pagerank).slice(0, 8).map(n => n.id)), [graph])
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => { canvas.current?.d3Force('charge')?.strength(-55) }, [])
  const center = (node: CanvasNode) => { canvas.current?.centerAt(node.x ?? 0, node.y ?? 0, 500); canvas.current?.zoom(Math.max(canvas.current.zoom(), 2.2), 500) }
  useEffect(() => { const node = selected ? previous.current.get(selected) : undefined; if (node?.x !== undefined) center(node) }, [selected])

  const labelBoxes = useRef<{ x1: number; y1: number; x2: number; y2: number }[]>([])
  const paintGroups = (ctx: CanvasRenderingContext2D, scale: number) => {
    labelBoxes.current = []
    if (!showGroups) return
    const members = new Map<number, Point[]>()
    for (const n of data.nodes) {
      if (n.x === undefined || n.y === undefined || n.type === 'location' || n.type === 'case') continue
      let list = members.get(n.metrics.community)
      if (!list) members.set(n.metrics.community, list = [])
      list.push({ x: n.x, y: n.y })
    }
    ctx.save()
    for (const [group, points] of members) {
      const ring = points.length >= 3 ? hull(points) : []
      if (ring.length < 3) continue
      const hue = groupColor(group), pad = 14 + 6 / scale
      tracePadded(ctx, ring, pad)
      ctx.fillStyle = alpha(hue, 0.1); ctx.fill()
      ctx.setLineDash([4 / scale, 3 / scale]); ctx.strokeStyle = alpha(hue, 0.5); ctx.lineWidth = 1 / scale; ctx.stroke(); ctx.setLineDash([])
      const top = ring.reduce((a, p) => p.y < a.y ? p : a)
      ctx.font = `600 ${Math.max(11 / scale, 2.6)}px Mukta, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillStyle = alpha(hue, 0.9); ctx.fillText(groupName(names, group), top.x, top.y - pad - 4 / scale)
    }
    ctx.restore()
  }
  const paintNode = (n: CanvasNode, ctx: CanvasRenderingContext2D, scale: number) => {
    const x = n.x ?? 0, y = n.y ?? 0, r = radiusOf(n)
    const emphasised = n.id === selected || nodeHighlights.has(n.id), hovered = n.id === hover.current
    const dim = Boolean(focus && !focus.has(n.id))
    ctx.save()
    ctx.globalAlpha = dim && !hovered ? 0.22 : 1
    if (emphasised) { ctx.beginPath(); ctx.arc(x, y, r + 3 / scale + 1.5, 0, 2 * Math.PI); ctx.fillStyle = alpha(STRING, 0.22); ctx.fill() }
    ctx.beginPath()
    if (n.type === 'case') ctx.rect(x - r, y - r, 2 * r, 2 * r); else ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fillStyle = colorBy === 'group' && n.type !== 'case' && n.type !== 'location' ? groupColor(n.metrics.community) : palette[n.type]
    ctx.fill()
    ctx.lineWidth = (emphasised ? 2 : 0.8) / scale; ctx.strokeStyle = emphasised ? STRING : '#FFFFFF'; ctx.stroke()
    if (hovered || emphasised || scale >= 2.2 || labelled.has(n.id)) {
      const fontSize = Math.max(11 / scale, 2.6), label = formatLabel(n.type, n.label)
      ctx.font = `500 ${fontSize}px Mukta, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round'
      const ly = y + r + 2.5 / scale, half = ctx.measureText(label).width / 2
      const box = { x1: x - half, y1: ly, x2: x + half, y2: ly + fontSize }
      const priority = hovered || emphasised
      if (priority || !labelBoxes.current.some(b => b.x1 < box.x2 && b.x2 > box.x1 && b.y1 < box.y2 && b.y2 > box.y1)) {
        labelBoxes.current.push(box)
        ctx.lineWidth = 3.5 / scale; ctx.strokeStyle = alpha(PAPER, 0.92); ctx.strokeText(label, x, ly)
        ctx.fillStyle = priority || n.type === 'person' ? INK : palette[n.type]
        ctx.fillText(label, x, ly)
      }
    }
    ctx.restore()
  }
  const edgeDimmed = (e: CanvasEdge) => Boolean(focus && !(focus.has(endpoint(e.source)) && focus.has(endpoint(e.target))))
  return <div className="graph-frame" ref={container} role="region" aria-label="Interactive network graph">
    <ForceGraph2D<GraphNode, EdgeData> ref={canvas} width={size.width} height={size.height} graphData={data} backgroundColor="rgba(0,0,0,0)"
      nodeVal={nodeVal} nodeRelSize={REL_SIZE} nodeLabel="" linkLabel="" autoPauseRedraw={false} minZoom={0.15} maxZoom={12} warmupTicks={60} cooldownTicks={120}
      nodeCanvasObjectMode={() => 'replace'} nodeCanvasObject={paintNode} onRenderFramePre={paintGroups}
      linkColor={e => edgeHighlights.has(e.id) ? STRING : alpha(edgeHue[e.type], edgeDimmed(e) ? 0.05 : 0.24)}
      linkWidth={e => edgeHighlights.has(e.id) ? 2.6 : Math.min(1.8, 0.4 + Math.log1p(e.weight) / 4)}
      linkDirectionalParticles={e => !reduceMotion && edgeHighlights.has(e.id) ? 3 : 0} linkDirectionalParticleWidth={2.8} linkDirectionalParticleColor={() => STRING} linkDirectionalParticleSpeed={0.008}
      onNodeHover={n => { hover.current = n?.id }} onNodeClick={n => { onSelect(n.id); center(n) }} onBackgroundClick={onDeselect}
      onEngineStop={() => { if (fittedFor.current === data.nodes.length) return; fittedFor.current = data.nodes.length; const node = selected ? previous.current.get(selected) : undefined; if (node?.x !== undefined) center(node); else canvas.current?.zoomToFit(400, 60) }} />
    {children}
    <div className="zoom-controls"><Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => canvas.current?.zoom(canvas.current.zoom() * 1.4, 250)}><Plus /></Button><Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => canvas.current?.zoom(canvas.current.zoom() / 1.4, 250)}><Minus /></Button><Button variant="outline" size="icon" aria-label="Fit network to view" onClick={() => canvas.current?.zoomToFit(400, 50)}><Maximize2 /></Button></div>
    {!graph.nodes.length && <div className="graph-empty">No entities match these filters.</div>}
  </div>
}
