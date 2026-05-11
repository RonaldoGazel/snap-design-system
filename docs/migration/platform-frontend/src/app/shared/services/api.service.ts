import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiResponse } from '../models/api-response.model';
import { API_BASE_URL } from '../utils/constants';

export interface RequestOptions {
  params?: HttpParams | { [key: string]: string | string[] };
  headers?: HttpHeaders | { [key: string]: string | string[] };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<ApiResponse<T>>(`${API_BASE_URL}${path}`, options)
      .pipe(catchError((err) => this.handleError<T>(err)));
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .post<ApiResponse<T>>(`${API_BASE_URL}${path}`, body, options)
      .pipe(catchError((err) => this.handleError<T>(err)));
  }

  put<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .put<ApiResponse<T>>(`${API_BASE_URL}${path}`, body, options)
      .pipe(catchError((err) => this.handleError<T>(err)));
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .patch<ApiResponse<T>>(`${API_BASE_URL}${path}`, body, options)
      .pipe(catchError((err) => this.handleError<T>(err)));
  }

  delete<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .delete<ApiResponse<T>>(`${API_BASE_URL}${path}`, options)
      .pipe(catchError((err) => this.handleError<T>(err)));
  }

  private handleError<T>(error: unknown): Observable<ApiResponse<T>> {
    // Extract backend error message from HttpErrorResponse body first
    const httpError = error as { error?: { error?: string; message?: string }; message?: string };
    const message =
      httpError?.error?.error ??
      httpError?.error?.message ??
      (error instanceof Error ? error.message : 'Ocorreu um erro inesperado');

    return of({ success: false, error: message } as ApiResponse<T>);
  }
}
