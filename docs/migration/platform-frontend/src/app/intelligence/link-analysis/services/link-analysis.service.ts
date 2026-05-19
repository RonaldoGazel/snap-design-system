/**
 * Stub — ported types consumed by shared layer.
 * Full link-analysis feature has not been ported yet.
 */

export type GraphEntityType =
  | 'PERSON'
  | 'COMPANY'
  | 'ADDRESS'
  | 'PHONE'
  | 'EMAIL'
  | 'VEHICLE'
  | 'PROPERTY'
  | 'RELATIVE';

export type GraphRelationType =
  | 'WORKS_AT'
  | 'LIVES_AT'
  | 'OWNS'
  | 'RELATED_TO'
  | 'CONTACTS'
  | 'ASSOCIATED_WITH';

export interface GraphEntity {
  id: string;
  type: GraphEntityType;
  label: string;
  properties: Record<string, unknown>;
  isRoot?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  pinned?: boolean;
}

export interface GraphRelationship {
  id: string;
  type: GraphRelationType;
  source: string;
  target: string;
  strength?: number;
  properties?: Record<string, unknown>;
}

export interface NetworkGraph {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  metadata: { rootEntityId: string; generatedAt: string; source: string };
}
