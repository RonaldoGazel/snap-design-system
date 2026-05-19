import { GRAPH_RELATION_LABEL_MAP, GraphRelationType } from '../models/enums';
import {
  GraphEntity,
  GraphRelationship,
  NetworkGraph,
} from '../../intelligence/link-analysis/services/link-analysis.service';
import { Target, TargetPhoto, TargetReport, TargetRelationship } from '../models/target.model';

/**
 * Backend NetworkNode structure (from API)
 */
interface NetworkNode {
  id: string;
  type: string;
  label: string;
  data?: Record<string, unknown>;
}

/**
 * Backend NetworkEdge structure (from API)
 */
interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  properties?: Record<string, unknown>;
}

/**
 * Backend NetworkGraph structure (from API)
 */
interface BackendNetworkGraph {
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  entities?: GraphEntity[];
  relationships?: GraphRelationship[];
  metadata?: { rootEntityId?: string; generatedAt?: string; source?: string };
}

/**
 * Backend Target structure (from API)
 */
interface BackendTarget extends Omit<Target, 'photos' | 'reports' | 'relationships'> {
  target_photos?: TargetPhoto[];
  target_reports?: TargetReport[];
  relationships_from?: TargetRelationship[];
  relationships_to?: TargetRelationship[];
}

/**
 * Transform a backend NetworkNode to a frontend GraphEntity
 */
export function mapNodeToEntity(node: NetworkNode): GraphEntity {
  return {
    id: node.id,
    type: node.type as any,
    label: node.label,
    properties: node.data || {},
  };
}

/**
 * Transform a backend NetworkEdge to a frontend GraphRelationship
 */
export function mapEdgeToRelationship(edge: NetworkEdge): GraphRelationship {
  const type = edge.label
    ? GRAPH_RELATION_LABEL_MAP[edge.label] || (edge.label as GraphRelationType)
    : GraphRelationType.ASSOCIATED_WITH;

  return {
    id: edge.id,
    type,
    source: edge.source,
    target: edge.target,
    properties: edge.properties,
  };
}

/**
 * Merge relationships_from and relationships_to into a unified array
 */
export function mergeRelationships(
  relationshipsFrom?: TargetRelationship[],
  relationshipsTo?: TargetRelationship[],
): TargetRelationship[] {
  const merged: TargetRelationship[] = [];

  if (relationshipsFrom && Array.isArray(relationshipsFrom)) {
    merged.push(...relationshipsFrom);
  }

  if (relationshipsTo && Array.isArray(relationshipsTo)) {
    merged.push(...relationshipsTo);
  }

  return merged;
}

/**
 * Transform backend graph response to frontend NetworkGraph interface
 * Handles both old format (nodes/edges) and new format (entities/relationships)
 */
export function mapBackendGraphToFrontend(backendGraph: BackendNetworkGraph): NetworkGraph {
  // If already in correct format, return as-is
  if (backendGraph.entities && backendGraph.relationships) {
    return {
      entities: backendGraph.entities,
      relationships: backendGraph.relationships,
      metadata: {
        rootEntityId: backendGraph.metadata?.rootEntityId || '',
        generatedAt: backendGraph.metadata?.generatedAt || new Date().toISOString(),
        source: backendGraph.metadata?.source || 'unknown',
      },
    };
  }

  // Transform from old format (nodes/edges) to new format
  const entities = (backendGraph.nodes || []).map(mapNodeToEntity);
  const relationships = (backendGraph.edges || []).map(mapEdgeToRelationship);

  return {
    entities,
    relationships,
    metadata: {
      rootEntityId: backendGraph.metadata?.rootEntityId || '',
      generatedAt: backendGraph.metadata?.generatedAt || new Date().toISOString(),
      source: backendGraph.metadata?.source || 'unknown',
    },
  };
}

/**
 * Transform backend target response to frontend Target interface
 * Handles property name mappings:
 * - target_photos -> photos
 * - target_reports -> reports
 * - relationships_from + relationships_to -> relationships (unified)
 */
export function mapBackendTargetToFrontend(backendTarget: BackendTarget): Target {
  const target: Target = {
    ...backendTarget,
    photos: backendTarget.target_photos || [],
    reports: backendTarget.target_reports || [],
    relationships: mergeRelationships(
      backendTarget.relationships_from,
      backendTarget.relationships_to,
    ),
  };

  // Remove backend-specific properties
  delete (target as any).target_photos;
  delete (target as any).target_reports;
  delete (target as any).relationships_from;
  delete (target as any).relationships_to;

  return target;
}
