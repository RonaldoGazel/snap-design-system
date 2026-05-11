import { HttpBackend, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Custom TranslateLoader that loads multiple namespace JSON files per locale
 * and merges them into a single translation object.
 *
 * Uses HttpBackend directly to bypass interceptors (auth interceptor would
 * block translation loading before authentication completes).
 *
 * File structure: locales/{lang}/{namespace}.json
 * Keys in each file are prefixed with the namespace: "namespace.key"
 */
export class MultiFileTranslateLoader implements TranslateLoader {
  private readonly http: HttpClient;

  constructor(
    httpBackend: HttpBackend,
    private readonly prefix: string,
    private readonly namespaces: string[],
  ) {
    this.http = new HttpClient(httpBackend);
  }

  getTranslation(lang: string): Observable<TranslationObject> {
    const requests = this.namespaces.map((ns) =>
      this.http.get<Record<string, string>>(`${this.prefix}${lang}/${ns}.json`).pipe(
        map((data) => this.prefixKeys(ns, data)),
        catchError(() => {
          console.warn(`[i18n] Missing translation file: ${this.prefix}${lang}/${ns}.json`);
          return of({});
        }),
      ),
    );

    return forkJoin(requests).pipe(
      map((results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {} as TranslationObject)),
    );
  }

  private prefixKeys(namespace: string, data: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[`${namespace}.${key}`] = value;
    }
    return result;
  }
}
