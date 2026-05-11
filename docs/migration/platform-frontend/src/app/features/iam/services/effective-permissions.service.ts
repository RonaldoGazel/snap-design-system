import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  EffectivePermissionsRequest,
  EffectivePermissionsResponse,
} from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class EffectivePermissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.permissionServiceUrl}/authorize/effective-permissions`;

  getEffectivePermissions(
    body: EffectivePermissionsRequest,
    trace = false,
  ): Observable<EffectivePermissionsResponse> {
    let params = new HttpParams();
    if (trace) {
      params = params.set('trace', 'true');
    }
    return this.http.post<EffectivePermissionsResponse>(this.apiUrl, body, { params });
  }
}
