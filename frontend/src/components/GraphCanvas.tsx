import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { Maximize2, Minus, Plus } from 'lucide-react'
import type { GraphNode, GraphResponse, Relationship } from '@/api/types'
import { palette } from '@/lib/graph'
import { Button } from './ui/button'

type CanvasNode = NodeObject<GraphNode>
type CanvasEdge = Omit<Relationship, 'source' | 'target'>
export default function GraphCanvas({ graph, selected, onSelect, highlightNodes = [], highlightEdges = [] }: { graph: GraphResponse; selected?: string; onSelect: (id: string) => void; highlightNodes?: string[]; highlightEdges?: string[] }) {
  const container = useRef<HTMLDivElement>(null)
  const canvas = useRef<ForceGraphMethods<CanvasNode, CanvasEdge> | undefined>(undefined)
  const [size, setSize] = useState({ width: 600, height: 560 })
  const [hover, setHover] = useState<string>()
  const fitted = useRef(false)
  const data = useMemo(() => ({ nodes: graph.nodes.map(n => ({ ...n })), links: graph.edges.map(e => ({ ...e })) }), [graph])
  const nodeHighlights = useMemo(() => new Set(highlightNodes), [highlightNodes])
  const edgeHighlights = useMemo(() => new Set(highlightEdges), [highlightEdges])
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const center = (node: CanvasNode) => { canvas.current?.centerAt(node.x ?? 0, node.y ?? 0, 500); canvas.current?.zoom(3, 500) }
  useEffect(() => {
    const n = data.nodes.find(n => n.id === selected)
    if (n) center(n)
  }, [selected, data])
  return <div className="graph-frame" ref={container} role="region" aria-label="Interactive network graph">
    <ForceGraph2D<CanvasNode, CanvasEdge> ref={canvas} width={size.width} height={size.height} graphData={data}
      backgroundColor="#141b20" nodeColor={n => palette[n.type]} nodeVal={n => 1 + n.metrics.pagerank * 100} nodeRelSize={3}
      nodeLabel="" linkLabel="" linkColor={e => edgeHighlights.has(e.id) ? '#f1cc84' : '#43535d'}
      linkWidth={e => edgeHighlights.has(e.id) ? 3 : Math.min(1.6, .5 + Math.log1p(e.weight) / 5)}
      warmupTicks={80} cooldownTicks={80} minZoom={.2} maxZoom={10}
      onNodeClick={n => { onSelect(n.id); center(n) }} onNodeHover={n => setHover(n?.id)}
      onEngineStop={() => { if (!fitted.current && data.nodes.length) { fitted.current = true; if (selected) { const n = data.nodes.find(n => n.id === selected); if (n) center(n) } else canvas.current?.zoomToFit(400, 65) } }}
      nodeCanvasObjectMode={() => 'after'} nodeCanvasObject={(n, ctx, scale) => {
        const radius = 3 * Math.sqrt(1 + n.metrics.pagerank * 100)
        if (n.id === selected || nodeHighlights.has(n.id)) {
          ctx.beginPath(); ctx.arc(n.x ?? 0, n.y ?? 0, radius + 3, 0, 2 * Math.PI)
          ctx.strokeStyle = nodeHighlights.has(n.id) ? '#f1cc84' : '#ffffff'; ctx.lineWidth = 1.5 / scale; ctx.stroke()
        }
        if (n.id === hover || n.id === selected) {
          const fontSize = 12 / scale
          ctx.font = `${fontSize}px Segoe UI`; const width = ctx.measureText(n.label).width
          const x = n.x ?? 0, y = (n.y ?? 0) + radius + fontSize
          ctx.fillStyle = '#0d1219'; ctx.fillRect(x - width / 2 - 4 / scale, y - fontSize, width + 8 / scale, fontSize + 6 / scale)
          ctx.textAlign = 'center'; ctx.fillStyle = '#eef3f5'; ctx.fillText(n.label, x, y)
        }
      }} />
    <div className="graph-count" role="status">{graph.nodes.length} entities <span> / </span>{graph.edges.length} relationships</div>
    <div className="graph-controls"><Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => canvas.current?.zoom((canvas.current?.zoom() ?? 1) * 1.4, 250)}><Plus /></Button><Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => canvas.current?.zoom((canvas.current?.zoom() ?? 1) / 1.4, 250)}><Minus /></Button><Button variant="outline" size="icon" aria-label="Fit network to view" onClick={() => canvas.current?.zoomToFit(400, 50)}><Maximize2 /></Button></div>
    {!graph.nodes.length && <div className="graph-empty">No entities match these filters.</div>}
    <span className="graph-help">Scroll to zoom · Drag to pan · Select an entity to inspect</span>
  </div>
}
