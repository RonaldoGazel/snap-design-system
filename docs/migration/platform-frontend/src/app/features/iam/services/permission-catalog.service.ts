import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import { PermissionCatalogResponse } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.permissionServiceUrl}/permissions/catalog`;
  private cachedCatalog: PermissionCatalogResponse | null = null;

  getCatalog(): Observable<PermissionCatalogResponse> {
    if (this.cachedCatalog) {
      return of(this.cachedCatalog);
    }
    return this.http
      .get<PermissionCatalogResponse>(this.apiUrl)
      .pipe(tap((catalog) => (this.cachedCatalog = catalog)));
  }

  refreshCatalog(): Observable<PermissionCatalogResponse> {
    this.cachedCatalog = null;
    return this.getCatalog();
  }

  clearCache(): void {
    this.cachedCatalog = null;
  }
}
