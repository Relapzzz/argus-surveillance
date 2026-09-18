import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { api } from '@/api/client'
import { Bi } from '@/components/Bi'
import { PageTitle } from '@/components/PageTitle'
import { QueryState } from '@/components/QueryState'
import Search, { nodeItems } from '@/components/Search'
import PlaceMap, { layerHues, layerNames, layers as allLayers } from '@/components/PlaceMap'
import type { Layer } from '@/components/PlaceMap'
import { buttonVariants } from '@/components/ui/button'
import { formatLabel, plural } from '@/lib/format'
import { networkUrl, palette } from '@/lib/graph'
import { aggregatePlaces, describePlace } from '@/lib/places'
import { hi } from '@/lib/vocab'
import './map.css'

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const entity = params.get('entity') ?? undefined
  const graph = useQuery({ queryKey: ['graph'], queryFn: () => api.graph() })
  const cases = useQuery({ queryKey: ['cases'], queryFn: api.cases })
  const [shown, setShown] = useState<Layer[]>(allLayers)
  const [selected, setSelected] = useState<string>()
  const report = useMemo(() => graph.data && cases.data ? aggregatePlaces(graph.data, cases.data, entity) : undefined, [graph.data, cases.data, entity])
  const picked = entity ? graph.data?.nodes.find(node => node.id === entity) : undefined
  const focus = selected ?? entity
  const pick = (id?: string) => {
    setSelected(undefined)
    setParams(previous => { if (id) previous.set('entity', id); else previous.delete('entity'); return previous })
  }
  const empty = graph.data?.nodes.length === 0
  return <div className="page">
    <PageTitle title="Map" hi="नक्शा" description="Where the FIRs happened, where the people live, and which towers their phones used.">
      {focus && <Link className={buttonVariants({ size: 'lg' })} to={networkUrl([focus])}><Bi en="Show on network" hi={hi.showOnNetwork} /></Link>}
    </PageTitle>
    <QueryState pending={graph.isPending || cases.isPending} error={graph.error ?? cases.error} retry={() => { graph.refetch(); cases.refetch() }} />
    {empty && <div className="empty"><h2>No records yet</h2><p>Add an FIR, call records or transactions and the places in them appear on this map.</p><p className="actions"><Link className={buttonVariants({ size: 'lg' })} to="/ingest"><Bi en="Add records" hi={hi.addRecords} /></Link></p></div>}
    {report && !empty && <>
      <div className="map-picker">
        <Search items={nodeItems(graph.data?.nodes ?? [])} label="Scope the map to one record" placeholder="Follow one person, phone or account" onPick={item => pick(item.id)} />
        {picked && <span className="picked"><i style={{ background: palette[picked.type] }} /><span className="tabular">{formatLabel(picked.type, picked.label)}</span><button type="button" aria-label="Show every place again" onClick={() => pick(undefined)}><X size={14} /></button></span>}
        <div className="layer-toggles" role="group" aria-label="Map layers">
          {allLayers.map(layer => <button type="button" key={layer} aria-pressed={shown.includes(layer)} onClick={() => setShown(shown.includes(layer) ? shown.filter(item => item !== layer) : allLayers.filter(item => item === layer || shown.includes(item)))}><i style={{ background: layerHues[layer] }} />{layerNames[layer]}</button>)}
        </div>
      </div>
      <div className="map-grid">
        <div className="map-frame">
          <PlaceMap places={report.places} shown={shown} selected={selected} onSelect={setSelected} />
          {report.unknownCells > 0 && <p className="map-note">{plural(report.unknownCells, 'call')} were made near towers that are not on the map.</p>}
        </div>
        <section className="map-list" aria-label="Places">
          <div className="section-head"><h2>{picked ? `Places for ${formatLabel(picked.type, picked.label)}` : 'Places'}</h2><span className="count">{report.places.length}</span></div>
          {report.places.length === 0 && <p className="empty">Nothing on the map for this record yet. Clear the pick to see every place.</p>}
          <div className="rows">
            {report.places.map(place => <div className="place-row" key={place.id} aria-current={place.id === selected}>
              <button type="button" onClick={() => setSelected(place.id)}><b>{place.label}</b><span>{describePlace(place)}.</span></button>
              <Link className="text-button" to={networkUrl([place.id])}>Show on network</Link>
            </div>)}
          </div>
        </section>
      </div>
    </>}
  </div>
}
