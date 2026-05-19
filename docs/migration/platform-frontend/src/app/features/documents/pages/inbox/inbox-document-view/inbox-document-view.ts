import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-inbox-document-view',
  standalone: true,
  imports: [ButtonModule, DateFormatPipe],
  templateUrl: './inbox-document-view.html',
  styleUrl: './inbox-document-view.css',
})
export class InboxDocumentViewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  title = signal('');
  protocolNumber = signal('');
  receivedAt = signal('');
  documentId = signal('');
  pdfUrl = signal<SafeResourceUrl | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private blobUrl: string | null = null;

  constructor() {
    const params = this.route.snapshot.queryParams;
    this.documentId.set(
      params['documentId'] ?? this.route.snapshot.paramMap.get('documentId') ?? '',
    );
    this.title.set(params['title'] ?? 'Documento');
    this.protocolNumber.set(params['protocol'] ?? '—');
    this.receivedAt.set(params['receivedAt'] ?? '');
  }

  ngOnInit(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }

  private loadPdf(): void {
    const id = this.documentId();
    if (!id) {
      this.loading.set(false);
      this.error.set('ID do documento não encontrado.');
      return;
    }

    this.http.get(`/api/v1/documents/${id}/final-artifact`, {
      responseType: 'blob',
      observe: 'response',
    }).subscribe({
      next: (response) => {
        const blob = response.body!;
        this.blobUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
        // Read protocol number from response header
        const protocol = response.headers.get('X-Protocol-Number');
        if (protocol) {
          this.protocolNumber.set(protocol);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar o PDF.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/intelligence', 'documents', 'inbox']);
  }
}
