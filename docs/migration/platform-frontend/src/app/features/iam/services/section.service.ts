/**
 * Section management service — calls identity-service section endpoints.
 *
 * Per ADR-005, sections (identity-service) are the single source of truth
 * for organizational compartmentalization and data segregation. The IAM panel
 * manages sections here, NOT permission-service groups.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  SectionResponse,
  SectionTreeNode,
  CreateSectionRequest,
  UpdateSectionRequest,
  UserSectionResponse,
  AssignSectionRequest,
  SectionUsersResponse,
} from '../models/identity.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return this.cfg.config.identityServiceUrl;
  }

  // ------------------------------------------------------------------
  // Section CRUD (scoped to an organization)
  // ------------------------------------------------------------------

  listSections(
    organizationId: string,
    params: PaginationParams,
  ): Observable<PaginatedResponse<SectionResponse>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<SectionResponse>>(
      `${this.baseUrl}/organizations/${organizationId}/sections`,
      { params: httpParams },
    );
  }

  getSection(organizationId: string, sectionId: string): Observable<SectionResponse> {
    return this.http.get<SectionResponse>(
      `${this.baseUrl}/organizations/${organizationId}/sections/${sectionId}`,
    );
  }

  createSection(
    organizationId: string,
    body: CreateSectionRequest,
  ): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(
      `${this.baseUrl}/organizations/${organizationId}/sections`,
      body,
    );
  }

  updateSection(
    organizationId: string,
    sectionId: string,
    body: UpdateSectionRequest,
  ): Observable<SectionResponse> {
    return this.http.patch<SectionResponse>(
      `${this.baseUrl}/organizations/${organizationId}/sections/${sectionId}`,
      body,
    );
  }

  deleteSection(organizationId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/organizations/${organizationId}/sections/${sectionId}`,
    );
  }

  /**
   * Build a tree structure from a flat list of sections.
   * Useful for hierarchical display in TreeTable.
   */
  getSectionTree(organizationId: string): Observable<SectionTreeNode[]> {
    return this.listSections(organizationId, { limit: 500, offset: 0 }).pipe(
      map((response) => this.buildTree(response.items)),
    );
  }

  // ------------------------------------------------------------------
  // User-section assignment
  // ------------------------------------------------------------------

  assignUserToSection(
    userId: string,
    body: AssignSectionRequest,
  ): Observable<UserSectionResponse> {
    return this.http.post<UserSectionResponse>(
      `${this.baseUrl}/users/${userId}/sections`,
      body,
    );
  }

  removeUserFromSection(userId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/users/${userId}/sections/${sectionId}`,
    );
  }

  // ------------------------------------------------------------------
  // Section members (ADR-005)
  // ------------------------------------------------------------------

  /**
   * List users assigned to a section.
   * Calls GET /api/v1/identity/sections/{sectionId}/users
   */
  getSectionUsers(
    sectionId: string,
    statusFilter?: string,
  ): Observable<SectionUsersResponse> {
    let params = new HttpParams();
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<SectionUsersResponse>(
      `${this.baseUrl}/sections/${sectionId}/users`,
      { params },
    );
  }

  /**
   * List sections a user belongs to.
   * Calls GET /api/v1/identity/users/{userId}/sections
   */
  getUserSections(userId: string): Observable<{ items: SectionResponse[]; total_count: number }> {
    return this.http.get<{ items: SectionResponse[]; total_count: number }>(
      `${this.baseUrl}/users/${userId}/sections`,
    );
  }

  // ------------------------------------------------------------------
  // Tree builder
  // ------------------------------------------------------------------

  private buildTree(sections: SectionResponse[]): SectionTreeNode[] {
    const map = new Map<string, SectionTreeNode>();
    const roots: SectionTreeNode[] = [];

    // Create nodes
    for (const s of sections) {
      map.set(s.id, { ...s, children: [] });
    }

    // Build hierarchy
    for (const node of map.values()) {
      if (node.parent_section_id && map.has(node.parent_section_id)) {
        map.get(node.parent_section_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
