import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

import { DocumentService } from '../../pages/services/document.service';
@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './tiptap-editor.html',
  styleUrl: './tiptap-editor.css',
})
export class TiptapEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  content = input<string>('');
  documentId = input<string>();

  saved = output<string>();
  contentChange = output<string>();

  syncState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  lastSyncTime = signal<Date | null>(null);
  editorUpdated = signal(0);

  editorElement = viewChild<ElementRef>('editorContainer');
  toolbarSentinel = viewChild<ElementRef>('toolbarSentinel');
  toolbarEl = viewChild<ElementRef>('toolbar');
  wrapperEl = viewChild<ElementRef>('editorWrapper');

  editor: Editor | null = null;
  lastSavedContent = '';
  toolbarSticky = signal(false);

  private readonly contentChanged$ = new Subject<string>();
  private readonly documentService = inject(DocumentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private toolbarPortalActive = false;
  private portalToolbarEl: HTMLElement | null = null;
  private portalWrapperEl: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Only react after the editor is initialized (ngAfterViewInit already ran)
    if (!this.editor) return;

    const docIdChanged = changes['documentId'] && !changes['documentId'].firstChange;
    const contentChanged = changes['content'] && !changes['content'].firstChange;

    if (docIdChanged || contentChanged) {
      const currentHtml = this.editor.getHTML();
      const hasUnsaved = currentHtml !== this.lastSavedContent;

      const loadNewContent = () => {
        this.editor!.commands.setContent(this.content() ?? '');
        this.lastSavedContent = this.content() ?? '';
        this.syncState.set('idle');
        this.lastSyncTime.set(null);
      };

      if (hasUnsaved && docIdChanged) {
        // Save the previous document before switching
        this.syncState.set('saving');
        // Use the previous documentId from the change, not the new one
        const prevDocId = changes['documentId'].previousValue as string;
        if (prevDocId) {
          this.documentService.updateDocument(prevDocId, { content: currentHtml }).subscribe({
            next: (res) => {
              if (res.success) {
                this.saved.emit(currentHtml);
              }
              loadNewContent();
            },
            error: () => {
              // Save failed — still switch to the new document
              loadNewContent();
            },
          });
        } else {
          loadNewContent();
        }
      } else {
        loadNewContent();
      }
    }
  }

  ngAfterViewInit(): void {
    const el = this.editorElement();
    if (!el) return;

    this.editor = new Editor({
      element: el.nativeElement,
      extensions: [
        StarterKit.configure({
          // StarterKit includes underline and link in v3 — configure them here
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Underline,
        Link.configure({ openOnClick: false }),
        Image,
        Placeholder.configure({ placeholder: 'Comece a escrever...' }),
      ],
      content: this.content(),
      editorProps: {
        handlePaste: (_view: unknown, event: ClipboardEvent): boolean => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                this.readAndInsertImage(file);
                return true; // prevent default paste handling
              }
            }
          }
          return false;
        },
      },
      onTransaction: () => {
        this.editorUpdated.set(this.editorUpdated() + 1);
      },
      onUpdate: ({ editor }: { editor: Editor }) => {
        this.contentChanged$.next(editor.getHTML());
      },
    });

    this.contentChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((html) => {
      this.contentChange.emit(html);
    });

    // Auto-save pipeline — only active when documentId is provided
    this.contentChanged$
      .pipe(
        debounceTime(2000),
        filter((html) => html !== this.lastSavedContent && !!this.documentId()),
        tap(() => this.syncState.set('saving')),
        switchMap((html) =>
          this.documentService
            .updateDocument(this.documentId()!, { content: html })
            .pipe(map((res) => ({ html, res }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ html, res }) => {
          if (res.success) {
            this.lastSavedContent = html;
            this.syncState.set('saved');
            this.lastSyncTime.set(new Date());
            this.saved.emit(html);
          } else {
            this.syncState.set('error');
          }
        },
        error: () => {
          this.syncState.set('error');
        },
      });

    this.setupStickyToolbar();
  }

  private setupStickyToolbar(): void {
    const sentinel = this.toolbarSentinel()?.nativeElement as HTMLElement | undefined;
    const wrapper = this.wrapperEl()?.nativeElement as HTMLElement | undefined;
    if (!sentinel || !wrapper) return;

    const toolbarEl = this.toolbarEl()?.nativeElement as HTMLElement | undefined;
    if (!toolbarEl) return;

    const isComponentVisible = (): boolean => {
      // Check if any ancestor has display:none (e.g. hidden p-tabpanel)
      let el: HTMLElement | null = wrapper;
      while (el) {
        if (getComputedStyle(el).display === 'none') return false;
        el = el.parentElement;
      }
      return true;
    };

    const applyPortal = (): void => {
      if (this.toolbarPortalActive) return;
      // Never apply portal when the tab panel is hidden
      if (!isComponentVisible()) return;

      this.toolbarPortalActive = true;
      this.portalToolbarEl = toolbarEl;
      this.portalWrapperEl = wrapper;

      const rect = wrapper.getBoundingClientRect();
      toolbarEl.style.position = 'fixed';
      toolbarEl.style.top = '60px';
      toolbarEl.style.left = `${rect.left}px`;
      toolbarEl.style.width = `${rect.width}px`;
      toolbarEl.style.zIndex = '1000';
      toolbarEl.style.backgroundColor = 'var(--p-surface-100)';
      toolbarEl.style.borderTop = 'none';
      toolbarEl.style.borderBottom = '1px solid var(--p-surface-border)';
      toolbarEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      this.document.body.appendChild(toolbarEl);
    };

    const removePortal = (): void => {
      if (!this.toolbarPortalActive) return;
      this.toolbarPortalActive = false;
      this.portalToolbarEl = null;
      this.portalWrapperEl = null;

      toolbarEl.removeAttribute('style');
      const spacer = wrapper.querySelector('.tiptap-editor__sticky-spacer');
      if (spacer) {
        wrapper.insertBefore(toolbarEl, spacer);
      } else {
        const contentArea = wrapper.querySelector('.tiptap-editor__content');
        if (contentArea) {
          wrapper.insertBefore(toolbarEl, contentArea);
        } else {
          wrapper.appendChild(toolbarEl);
        }
      }
    };

    const updatePortalPosition = (): void => {
      if (!this.toolbarPortalActive) return;
      const rect = wrapper.getBoundingClientRect();
      toolbarEl.style.left = `${rect.left}px`;
      toolbarEl.style.width = `${rect.width}px`;
    };

    this.ngZone.runOutsideAngular(() => {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          // If the sentinel has zero size (panel hidden), boundingClientRect is all zeros — ignore
          const rect = entry.boundingClientRect;
          if (rect.width === 0 && rect.height === 0 && rect.top === 0) return;

          const isSticky = !entry.isIntersecting && rect.top < 60;
          this.ngZone.run(() => {
            this.toolbarSticky.set(isSticky);
            if (isSticky) {
              applyPortal();
            } else {
              removePortal();
            }
          });
        },
        {
          root: null,
          rootMargin: '-60px 0px 0px 0px',
          threshold: 0,
        },
      );

      this.intersectionObserver.observe(sentinel);

      this.resizeObserver = new ResizeObserver(() => {
        updatePortalPosition();
      });
      this.resizeObserver.observe(wrapper);

      // Watch for tab panel visibility changes (p-tabpanel hides with display:none)
      const tabPanel = wrapper.closest(
        '[data-pc-name="tabpanel"], p-tabpanel, [role="tabpanel"]',
      ) as HTMLElement | null;
      const observeTarget = tabPanel ?? wrapper;
      this.mutationObserver = new MutationObserver(() => {
        if (!isComponentVisible() && this.toolbarPortalActive) {
          this.ngZone.run(() => {
            this.toolbarSticky.set(false);
            removePortal();
          });
        }
      });
      this.mutationObserver.observe(observeTarget, {
        attributes: true,
        attributeFilter: ['style', 'hidden', 'class'],
      });
    });
  }

  ngOnDestroy(): void {
    this.contentChanged$.complete();
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    // Remove portal element from body if still active
    if (this.toolbarPortalActive && this.portalToolbarEl) {
      this.portalToolbarEl.removeAttribute('style');
      if (this.portalToolbarEl.parentNode) {
        this.portalToolbarEl.parentNode.removeChild(this.portalToolbarEl);
      }
      this.toolbarPortalActive = false;
      this.portalToolbarEl = null;
      this.portalWrapperEl = null;
    }
    this.editor?.destroy();
    this.editor = null;
  }

  // --- State helpers ---

  isBold(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('bold') ?? false;
  }

  isItalic(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('italic') ?? false;
  }

  isUnderline(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('underline') ?? false;
  }

  isStrike(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('strike') ?? false;
  }

  isCode(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('code') ?? false;
  }

  isOrderedList(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('orderedList') ?? false;
  }

  isBulletList(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('bulletList') ?? false;
  }

  isBlockquote(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('blockquote') ?? false;
  }

  isLink(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('link') ?? false;
  }

  isInTable(): boolean {
    this.editorUpdated();
    return this.editor?.isActive('table') ?? false;
  }

  isAlign(align: string): boolean {
    this.editorUpdated();
    return this.editor?.isActive({ textAlign: align }) ?? false;
  }

  // --- Action methods ---

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  toggleCode(): void {
    this.editor?.chain().focus().toggleCode().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  setAlign(align: string): void {
    this.editor?.chain().focus().setTextAlign(align).run();
  }

  setHeading(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (value === 0) {
      this.editor?.chain().focus().setParagraph().run();
    } else {
      this.editor
        ?.chain()
        .focus()
        .toggleHeading({ level: value as 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    }
  }

  insertTable(): void {
    this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  addRowAfter(): void {
    this.editor?.chain().focus().addRowAfter().run();
  }

  deleteRow(): void {
    this.editor?.chain().focus().deleteRow().run();
  }

  addColumnAfter(): void {
    this.editor?.chain().focus().addColumnAfter().run();
  }

  deleteColumn(): void {
    this.editor?.chain().focus().deleteColumn().run();
  }

  setLink(): void {
    const url = window.prompt('URL do link:');
    if (url === null) return;
    if (url === '') {
      this.editor?.chain().focus().unsetLink().run();
    } else {
      this.editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  insertHorizontalRule(): void {
    this.editor?.chain().focus().setHorizontalRule().run();
  }

  undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  manualSync(): void {
    if (!this.editor || !this.documentId()) return;
    const html = this.editor.getHTML();
    if (html === this.lastSavedContent) return;

    this.syncState.set('saving');
    this.documentService.updateDocument(this.documentId()!, { content: html }).subscribe({
      next: (res) => {
        if (res.success) {
          this.lastSavedContent = html;
          this.syncState.set('saved');
          this.lastSyncTime.set(new Date());
          this.saved.emit(html);
        } else {
          this.syncState.set('error');
        }
      },
      error: () => {
        this.syncState.set('error');
      },
    });
  }

  insertImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.readAndInsertImage(file);
    };
    input.click();
  }

  readAndInsertImage(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.editor?.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
  }
}
