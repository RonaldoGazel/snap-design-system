import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../services/runtime-config.service';
import { ClearanceLevelResponse } from '../models/identity.model';

@Injectable({ providedIn: 'root' })
export class ClearanceLevelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.identityServiceUrl}/clearance-levels`;

  listClearanceLevels(): Observable<ClearanceLevelResponse[]> {
    return this.http.get<ClearanceLevelResponse[]>(this.apiUrl);
  }
}
