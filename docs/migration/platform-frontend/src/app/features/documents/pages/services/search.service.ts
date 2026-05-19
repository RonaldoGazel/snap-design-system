import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { SearchRequest, SearchResult } from '../models/document.models';
import { ApiService } from '../../../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiService);

  search(request: SearchRequest): Observable<ApiResponse<SearchResult>> {
    return this.api.post<SearchResult>('/search/documents', request);
  }
}
