import { useEffect } from 'react'
import { Link } from 'react-router'
import { latLngBounds } from 'leaflet'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Place } from '@/lib/places'
import { describePlace } from '@/lib/places'
import { caseUrl, palette, profileUrl } from '@/lib/graph'
import { formatDate, formatLabel, plural } from '@/lib/format'

export type Layer = 'firs' | 'homes' | 'calls'
export const layers: Layer[] = ['firs', 'homes', 'calls']
export const layerNames: Record<Layer, string> = { firs: 'FIR places', homes: 'Homes', calls: 'Call activity' }
const layerPhrases: Record<Layer, string> = { firs: 'FIR places', homes: 'homes', calls: 'call activity' }
export const layerHues: Record<Layer, string> ={ firs: palette.location, homes: palette.person, calls: palette.phone }
const selectedStroke = '#B42318'
const centre: [number, number] = [18.5204, 73.8567]
const tiles: string = import.meta.env.VITE_MAP_TILES ||'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const listed = (items: string[]) => items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

const weigh = (place: Place): Record<Layer, number> => ({ firs: 3 * place.firs.length, homes: place.residents.length, calls: Math.log1p(place.calls) })

function View({ places, selected }: { places: Place[]; selected?: string }) {
  const map = useMap()
  const key = places.map(place => place.id).join(',')
  useEffect(() => {
    const bounds = latLngBounds(places.map(place => [place.lat, place.lon] as [number, number]))
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, key])
  useEffect(() => {
    const place = places.find(item => item.id === selected)
    if (place) map.panTo([place.lat, place.lon])
  }, [map, selected])
  return null
}

export default function PlaceMap({ places, shown, selected, onSelect }: { places: Place[]; shown: Layer[]; selected?: string; onSelect: (id: string) => void }) {
  const drawn = places
    .map(place => {
      const weights = weigh(place)
      const active = shown.filter(layer => weights[layer] > 0).sort((a, b) => weights[b] - weights[a])
      return { place, active }
    })
    .filter(marker => marker.active.length > 0)
  const labelled = new Set([...drawn].sort((a, b) => b.place.size - a.place.size).slice(0, 6).map(marker => marker.place.id))
  return <MapContainer className="place-map" center={centre} zoom={12} scrollWheelZoom minZoom={9}>
    <TileLayer url={tiles} attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
    <View places={drawn.map(marker => marker.place)} selected={selected} />
    {drawn.map(({ place, active }) => {
      const [dominant, ...rest] = active
      const picked = place.id === selected
      return <CircleMarker
        key={place.id}
        center={[place.lat, place.lon]}
        radius={Math.min(26, 6 + 3 * Math.sqrt(place.size))}
        pathOptions={{ color: picked ? selectedStroke : '#FFFFFF', weight: picked ? 3 : 1.5, fillColor: layerHues[dominant], fillOpacity: 0.55 }}
        eventHandlers={{ click: () => onSelect(place.id) }}
      >
        <Tooltip permanent={labelled.has(place.id)} direction="top" offset={[0, -4]}>{place.label}</Tooltip>
        <Popup>
          <h3>{place.label}</h3>
          <p>{describePlace(place)}.</p>
          {rest.length > 0 && <p className="place-layers">Drawn as {layerPhrases[dominant]}, and also counted under {listed(rest.map(layer => layerPhrases[layer]))}.</p>}
          {place.firs.length > 0 && <>
            <h4>{plural(place.firs.length, 'FIR')} here</h4>
            <ul>{place.firs.slice(0, 6).map(item => <li key={item.id}><Link to={caseUrl(item.id)} className="tabular">{item.fir_number}</Link> <span>{item.station}{item.incident_time ? `, ${formatDate(item.incident_time)}` : ''}</span></li>)}</ul>
            {place.firs.length > 6 && <p className="place-more">{plural(place.firs.length - 6, 'more FIR')} not listed.</p>}
          </>}
          {place.people.length > 0 && <>
            <h4>{plural(place.people.length, 'person', 'people')} linked to this place</h4>
            <ul className="place-people">{place.people.slice(0, 8).map(person => <li key={person.id}><Link to={profileUrl(person.id)}>{formatLabel(person.type, person.label)}</Link></li>)}</ul>
            {place.people.length > 8 && <p className="place-more">{plural(place.people.length - 8, 'more person', 'more people')} not listed.</p>}
          </>}
        </Popup>
      </CircleMarker>
    })}
  </MapContainer>
}
