export const entityTypes = ['person', 'phone', 'vehicle', 'location', 'organization', 'account', 'case'] as const
export type EntityType = typeof entityTypes[number]
export type RelationshipType = 'called' | 'transacted' | 'co_accused' | 'owns' | 'resides_at' | 'seen_at' | 'member_of' | 'mentioned_in' | 'associate_of'
export interface Entity { id: string; type: EntityType; label: string; attributes: Record<string, unknown>; sources: string[] }
export interface Metrics { degree: number; betweenness: number; pagerank: number; community: number }
export interface GraphNode extends Entity { metrics: Metrics }
export interface Relationship { id: string; source: string; target: string; type: RelationshipType; weight: number; attributes: Record<string, unknown>; sources: string[] }
export interface GraphResponse { nodes: GraphNode[]; edges: Relationship[] }
export interface Neighbor { id: string; type: EntityType; label: string; relationship: RelationshipType; edge_id: string }
export interface EntityDetail { entity: Entity; metrics: Metrics; neighbors: Neighbor[]; sources: string[] }
export interface Stats { entities: Record<EntityType, number>; relationships: number; cases: number; alerts: number }
export interface KeyPlayer extends Metrics { entity_id: string; label: string; score: number; reason: string }
export interface Community { id: number; size: number; member_ids: string[]; top_member: string }
export interface Alert { id: string; type: 'burst_calls' | 'structuring' | 'bridge_node' | 'night_calls'; severity: 'low' | 'medium' | 'high'; title: string; description: string; entity_ids: string[]; evidence: Record<string, unknown> }
export interface PathResponse { node_ids: string[]; edge_ids: string[] }
export interface CaseSummary { id: string; fir_number: string; station: string; incident_time: string | null; sections: string[]; entity_count: number }
export interface Span { id: string; type: EntityType; label: string; start: number; end: number }
export interface CaseDetail extends CaseSummary { narrative: string; entities: Span[] }
export interface IngestResult { case_id?: string | null; entities_added: number; relationships_added: number }
export interface ResetResult { nodes: number; edges: number }
export interface GraphFilters { types?: EntityType[]; community?: number; min_degree?: number }
export type IngestKind = 'fir' | 'cdr' | 'transactions'
