/**
 * @deprecated Use types from link-analysis.service.ts instead
 * This file is kept for backward compatibility but should not be used for new code.
 * The canonical definitions are in src/app/intelligence/link-analysis/services/link-analysis.service.ts
 */

export type { GraphEntity as Entity } from '../../intelligence/link-analysis/services/link-analysis.service';
export type { GraphRelationship as Relationship } from '../../intelligence/link-analysis/services/link-analysis.service';
export type { NetworkGraph } from '../../intelligence/link-analysis/services/link-analysis.service';

export interface NetworkGraphMetadata {
  rootEntityId?: string;
  generatedAt: string;
  source?: string;
}
