import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { WorkflowApiBaseService } from '../../../workflows/services/workflow-api-base.service';

/**
 * Dissemination record received by the current user's section.
 */
export interface ReceivedDissemination {
  id: string;
  instanceId: string;
  documentVersionId: string;
  documentId: string;
  documentTitle: string;
  protocolReference: string | null;
  senderId: string;
  recipients: Record<string, unknown>[];
  classificationAtTime: string;
  disseminationType: string;
  channel: string | null;
  status: string;
  createdAt: string;
}

/**
 * Service for querying disseminations received by the current user's section.
 *
 * Replaces the old TramitationService for the inbox view.
 * The backend filters by the user's section+role automatically.
 *
 * Calls: GET /api/v1/workflows/dissemination/received
 */
@Injectable({ providedIn: 'root' })
export class DisseminationInboxService {
  private readonly api = inject(WorkflowApiBaseService);

  /**
   * Get disseminations received by the current user's section.
   */
  getReceivedDisseminations(): Observable<ReceivedDissemination[]> {
    return this.api
      .workflowGet<any>('/dissemination/received')
      .pipe(
        map((res) => {
          const items = res.data?.items ?? res.data ?? [];
          return (Array.isArray(items) ? items : []).map((d: any) => ({
            id: d.id,
            instanceId: d.instance_id,
            documentVersionId: d.document_version_id,
            documentId: d.document_id ?? '',
            documentTitle: d.document_title ?? '',
            protocolReference: d.protocol_reference ?? null,
            senderId: d.sender_id,
            recipients: d.recipients ?? [],
            classificationAtTime: d.classification_at_time,
            disseminationType: d.dissemination_type,
            channel: d.channel,
            status: d.status,
            createdAt: d.created_at,
          }));
        }),
      );
  }
}
