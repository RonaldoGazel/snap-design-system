import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { TranslateService } from '@ngx-translate/core';

import { CollaboraSessionService } from '../../services/collabora-session.service';

/**
 * Reusable Collabora Online editor component.
 *
 * Embeds a Collabora Online iframe for WOPI-based DOCX editing.
 * Used by BPMS template editing, document editing, and document creation flows.
 *
 * Usage:
 *   <app-collabora-editor [resourceType]="'document'" [resourceId]="doc.id" />
 *   <app-collabora-editor [resourceType]="'template'" [resourceId]="tpl.id" />
 *   <app-collabora-editor [resourceType]="'blank'" resourceId="" />
 */
@Component({
  selector: 'app-collabora-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  templateUrl: './collabora-editor.html',
  styleUrl: './collabora-editor.css',
})
export class CollaboraEditorComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly translate = inject(TranslateService);
  private readonly collaboraSession = inject(CollaboraSessionService);

  /**
   * Type of resource being edited:
   *   - 'document' — existing backend document
   *   - 'template' — BPMS template DOCX
   *   - 'blank'    — new empty DOCX (no resource needed)
   */
  resourceType = input.required<'document' | 'template' | 'blank'>();

  /** ID of the resource (document or template). Ignored for 'blank'. */
  resourceId = input<string>('');

  /** If true, open Collabora in read-only/preview mode. */
  readonly = input<boolean>(false);
  /** Emitted when Collabora signals the document has been loaded. */
  documentLoaded = output<void>();

  /** Emitted on any Collabora error. */
  editorError = output<string>();

  readonly collaboraUrl = signal<SafeResourceUrl | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    effect(() => {
      const type = this.resourceType();
      const id = this.resourceId();
      if (type === 'blank' || (type && id)) {
        this.openEditor(type, id);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeMessageListener();
  }

  /** Request a WOPI editing session and build the Collabora iframe URL. */
  openEditor(type: 'document' | 'template' | 'blank', id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.collaboraUrl.set(null);

    this.collaboraSession.createEditSession(type, id).subscribe({
      next: (session) => {
        const appLang = this.translate.currentLang || 'pt-BR';
        const editorUrl = session.editor_url.replace(/&lang=[^&]+/, `&lang=${appLang}`);

        let fullUrl =
          editorUrl +
          '&access_token=' +
          encodeURIComponent(session.access_token) +
          '&access_token_ttl=' +
          session.access_token_ttl * 1000; // Collabora expects milliseconds

        // Add permission=readonly for preview mode
        if (this.readonly()) {
          fullUrl += '&permission=readonly';
        }

        this.collaboraUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl));
        this.loading.set(false);
        this.setupMessageListener();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail ?? 'Falha ao abrir o editor de documentos.';
        this.error.set(detail);
        this.editorError.emit(detail);
      },
    });
  }

  retry(): void {
    this.openEditor(this.resourceType(), this.resourceId());
  }

  private setupMessageListener(): void {
    this.removeMessageListener();

    this.messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      let data: Record<string, unknown>;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      const messageId = data['MessageId'] as string | undefined;
      if (!messageId) return;

      if (
        messageId === 'App_LoadingStatus' &&
        (data['Values'] as Record<string, unknown>)?.['Status'] === 'Document_Loaded'
      ) {
        const iframe = document.querySelector<HTMLIFrameElement>('.collabora-iframe');
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ MessageId: 'Hide_Sidebar' }),
            window.location.origin,
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ MessageId: 'Collapse_Notebookbar', Values: null }),
            window.location.origin,
          );
        }
        this.documentLoaded.emit();
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  private removeMessageListener(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }
}
