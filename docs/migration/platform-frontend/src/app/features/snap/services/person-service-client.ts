import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RuntimeConfigService } from '../../../services/runtime-config.service';
import { GeneratePersonResponse } from '../models/person.model';
import { Pessoa } from '../../person/models';
import { mapApiPersonListToPessoas } from '../../person/services/api-person-mapper';

// ---------------------------------------------------------------------------
// Response & param interfaces
// ---------------------------------------------------------------------------

export interface PersonListResponse {
  items: Pessoa[];
  total: number;
  total_merged: number;
  total_raw: number;
  limit: number;
  offset: number;
}

export interface TraverseParams {
  depth?: number;
  limit?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, unknown>;
  _node_id: string;
  _graph_id: string | null;
  _graph_name: string | null;
  _sources: Array<{ graph_id: string; display_name: string }>;
  _merged_from: number;
}

export interface GraphEdge {
  start_id: string;
  end_id: string;
  label: string;
  properties?: Record<string, unknown>;
  _graph_id: string;
  _graph_name: string;
}

export interface TraverseResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Raw API response shape before mapping (snake_case items). */
interface ApiPersonListResponse {
  items: Record<string, unknown>[];
  total: number;
  total_merged: number;
  total_raw: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class PersonServiceClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(RuntimeConfigService).config.personServiceUrl;

  generatePerson(cpf: string, targetVisibility?: 'public' | 'private'): Observable<GeneratePersonResponse> {
    const sanitized = cpf.replace(/\D/g, '');
    return this.http.post<GeneratePersonResponse>(`${this.apiUrl}/generate-person/snap`, {
      cpf: sanitized,
      target_visibility: targetVisibility ?? null,
    });
  }

  generatePersonSipen(cpf: string, targetVisibility?: 'public' | 'private'): Observable<GeneratePersonResponse> {
    const sanitized = cpf.replace(/\D/g, '');
    return this.http.post<GeneratePersonResponse>(`${this.apiUrl}/generate-person/sipen`, {
      cpf: sanitized,
      target_visibility: targetVisibility ?? null,
    });
  }

  listPersons(params?: {
    source?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Observable<PersonListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.source) queryParams['source'] = params.source;
    if (params?.q) queryParams['q'] = params.q;
    if (params?.limit) queryParams['limit'] = String(params.limit);
    if (params?.offset) queryParams['offset'] = String(params.offset);

    return this.http
      .get<ApiPersonListResponse>(`${this.apiUrl}/person/list`, { params: queryParams })
      .pipe(
        map((res) => ({
          items: mapApiPersonListToPessoas(res as unknown as Record<string, unknown>),
          total: res.total,
          total_merged: res.total_merged,
          total_raw: res.total_raw,
          limit: res.limit,
          offset: res.offset,
        })),
      );
  }

  getPersonById(personId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/person/${personId}`);
  }

  traversePerson(personId: string, params?: TraverseParams): Observable<TraverseResponse> {
    const queryParams: Record<string, string> = {};

    if (params?.depth != null) {
      queryParams['depth'] = String(Math.min(5, Math.max(1, params.depth)));
    }
    if (params?.limit != null) {
      queryParams['limit'] = String(Math.min(2000, Math.max(1, params.limit)));
    }

    return this.http.get<TraverseResponse>(`${this.apiUrl}/person/${personId}/traverse`, {
      params: queryParams,
    });
  }
}
