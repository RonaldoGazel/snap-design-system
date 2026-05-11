import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApiService } from './api.service';
import { API_BASE_URL } from '../utils/constants';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- GET ----------------------------------------------------------------

  it('get() should prepend API_BASE_URL and return the response', () => {
    const mockResponse = { success: true, data: [{ id: '1' }] };

    service.get<{ id: string }[]>('/users').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${API_BASE_URL}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('get() should forward query params', () => {
    service.get('/users', { params: { role: 'ADMIN' } }).subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${API_BASE_URL}/users`);
    expect(req.request.params.get('role')).toBe('ADMIN');
    req.flush({ success: true });
  });

  it('get() should return error response on HTTP failure', () => {
    service.get('/users').subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.error).toBeTruthy();
    });

    httpTesting
      .expectOne(`${API_BASE_URL}/users`)
      .flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  // -- POST ---------------------------------------------------------------

  it('post() should send body and return the response', () => {
    const body = { name: 'Test' };
    const mockResponse = { success: true, data: { id: '1', name: 'Test' } };

    service.post('/users', body).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${API_BASE_URL}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockResponse);
  });

  it('post() should return error response on HTTP failure', () => {
    service.post('/users', {}).subscribe((res) => {
      expect(res.success).toBe(false);
      expect(res.error).toBeTruthy();
    });

    httpTesting
      .expectOne(`${API_BASE_URL}/users`)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  // -- PUT ----------------------------------------------------------------

  it('put() should send body and return the response', () => {
    const body = { name: 'Updated' };
    const mockResponse = { success: true, data: { id: '1', name: 'Updated' } };

    service.put('/users/1', body).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${API_BASE_URL}/users/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  // -- PATCH --------------------------------------------------------------

  it('patch() should send body and return the response', () => {
    const body = { name: 'Patched' };
    const mockResponse = { success: true, data: { id: '1', name: 'Patched' } };

    service.patch('/users/1', body).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${API_BASE_URL}/users/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);
  });

  // -- DELETE -------------------------------------------------------------

  it('delete() should return the response', () => {
    const mockResponse = { success: true };

    service.delete('/users/1').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(`${API_BASE_URL}/users/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('delete() should return error response on HTTP failure', () => {
    service.delete('/users/1').subscribe((res) => {
      expect(res.success).toBe(false);
    });

    httpTesting
      .expectOne(`${API_BASE_URL}/users/1`)
      .flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  // -- Headers ------------------------------------------------------------

  it('should forward custom headers', () => {
    service.get('/secure', { headers: { 'X-Custom': 'value' } }).subscribe();

    const req = httpTesting.expectOne(`${API_BASE_URL}/secure`);
    expect(req.request.headers.get('X-Custom')).toBe('value');
    req.flush({ success: true });
  });
});
