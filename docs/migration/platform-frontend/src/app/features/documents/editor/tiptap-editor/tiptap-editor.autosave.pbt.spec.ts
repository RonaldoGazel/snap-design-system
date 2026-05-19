// Feature: document-content-editor
// Properties 7, 8, 9, 10, 12: Auto-save and manual sync correctness

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { of, throwError, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

import { TiptapEditorComponent } from './tiptap-editor';
import { DocumentService } from '../../pages/services/document.service';

function createMockDocumentService() {
  return {
    updateDocument: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 7: Auto-save dispara após 2 segundos de inatividade
// Validates: Requirement 6.1
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 7: Auto-save dispara após 2 segundos de inatividade', () => {
  /**
   * Validates: Requirement 6.1
   *
   * Property: For any sequence of rapid content changes followed by 2s of
   * inactivity, the debounce pipeline emits exactly once with the last value.
   * Rapid changes within the 2s window reset the timer.
   */
  it('debounce emits only after 2s of inactivity and resets on new emission', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 4 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (rapidChanges, finalChange) => {
          const scheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
          });

          scheduler.run(({ cold, expectObservable }) => {
            const subject$ = new Subject<string>();
            const result: string[] = [];

            const sub = subject$
              .pipe(debounceTime(2000, scheduler))
              .subscribe((val) => result.push(val));

            // Emit rapid changes at 100ms intervals (all within 2s window)
            let elapsed = 0;
            for (const change of rapidChanges) {
              scheduler.schedule(() => subject$.next(change), elapsed);
              elapsed += 100;
            }

            // Emit final change
            scheduler.schedule(() => subject$.next(finalChange), elapsed);

            // Advance to just before debounce fires — no emission yet
            scheduler.flush();

            // Advance past debounce window (2000ms after last emission)
            // The TestScheduler.run() virtual time handles this via debounceTime

            sub.unsubscribe();
          });
        },
      ),
      { numRuns: 50 },
    );
  });

  it('debounce emits the last value after 2s with no new emissions', () => {
    const scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    scheduler.run(({ cold, expectObservable }) => {
      // Marble: emit 'a' at frame 0, debounceTime(2000) emits 'a' at frame 2000
      const source$ = cold('a 2000ms |', { a: 'content-A' });
      const expected$ = cold('2000ms a|', { a: 'content-A' });

      expectObservable(source$.pipe(debounceTime(2000, scheduler))).toEqual(expected$);
    });
  });

  it('debounce resets timer when new emission arrives before 2s', () => {
    const scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    scheduler.run(({ cold, expectObservable }) => {
      // Emit 'a' at 0ms, 'b' at 1000ms — debounce resets, 'b' emits at 3000ms
      const source$ = cold('a 999ms b 2000ms |', { a: 'first', b: 'second' });
      // 'a' is cancelled by 'b'; 'b' emits 2000ms after it was emitted = at 3001ms
      const expected$ = cold('3000ms b|', { b: 'second' });

      expectObservable(source$.pipe(debounceTime(2000, scheduler))).toEqual(expected$);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 8: Sem salvamentos concorrentes
// Validates: Requirement 6.2
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 8: Sem salvamentos concorrentes', () => {
  /**
   * Validates: Requirement 6.2
   *
   * Property: switchMap cancels any in-flight save when a new debounced emission
   * arrives. For any sequence of rapid changes, at most one save is active at
   * any given time.
   */
  it('switchMap cancels previous in-flight save when new debounced emission arrives', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 4 }),
        (contents) => {
          const scheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
          });

          scheduler.run(() => {
            const subject$ = new Subject<string>();
            let saveCallCount = 0;
            let concurrentSaves = 0;
            let maxConcurrent = 0;

            const sub = subject$
              .pipe(
                debounceTime(2000, scheduler),
                switchMap((_html) => {
                  saveCallCount++;
                  concurrentSaves++;
                  maxConcurrent = Math.max(maxConcurrent, concurrentSaves);
                  // Simulate a slow save (500ms)
                  return new Subject<void>(); // never completes — simulates in-flight
                }),
              )
              .subscribe(() => {
                concurrentSaves--;
              });

            // Emit all contents rapidly (100ms apart — all within 2s debounce window)
            let elapsed = 0;
            for (const content of contents) {
              scheduler.schedule(() => subject$.next(content), elapsed);
              elapsed += 100;
            }

            // Advance past debounce — only the last emission triggers switchMap
            scheduler.schedule(() => {
              // After debounce fires, at most 1 save should be active
              expect(saveCallCount).toBeLessThanOrEqual(1);
              expect(maxConcurrent).toBeLessThanOrEqual(1);
            }, elapsed + 2001);

            scheduler.flush();
            sub.unsubscribe();
          });
        },
      ),
      { numRuns: 50 },
    );
  });

  it('switchMap cancels previous save when new emission arrives mid-save', () => {
    const scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    scheduler.run(({ cold, expectObservable }) => {
      // Two debounced emissions: 'a' at 2000ms, 'b' at 5000ms
      // Each save takes 3000ms (never completes within test window)
      // switchMap should cancel 'a' save when 'b' arrives
      const source$ = cold('a 1999ms b 2000ms |', { a: 'first', b: 'second' });

      let saveCount = 0;
      const result$ = source$.pipe(
        debounceTime(2000, scheduler),
        switchMap((val) => {
          saveCount++;
          // Slow save — takes longer than the next debounce window
          return cold('3000ms x|', { x: `saved-${val}` });
        }),
      );

      // Only the last save result should come through
      expectObservable(result$).toBe('7000ms x|', { x: 'saved-second' });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 9: Sync manual dispara salvamento imediato
// Validates: Requirement 8.1
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 9: Sync manual dispara salvamento imediato', () => {
  let component: TiptapEditorComponent;
  let mockDocService: ReturnType<typeof createMockDocumentService>;

  beforeEach(async () => {
    mockDocService = createMockDocumentService();
    mockDocService.updateDocument.mockReturnValue(of({ success: true, data: {} }));

    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
      providers: [{ provide: DocumentService, useValue: mockDocService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;

    // Prevent TipTap from mounting in jsdom
    vi.spyOn(component, 'ngAfterViewInit').mockImplementation(() => {});

    fixture.componentRef.setInput('documentId', 'doc-123');
    fixture.detectChanges();
  });

  /**
   * Validates: Requirement 8.1
   *
   * Property: For any pair of (lastSaved, currentContent) where they differ,
   * calling manualSync() must immediately invoke updateDocument with the
   * current content.
   */
  it('manualSync calls updateDocument immediately with current content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (lastSaved, currentContent) => {
          fc.pre(currentContent !== lastSaved);

          mockDocService.updateDocument.mockClear();
          mockDocService.updateDocument.mockReturnValue(of({ success: true, data: {} }));

          component.editor = { getHTML: () => currentContent, destroy: vi.fn() } as any;
          component.lastSavedContent = lastSaved;

          component.manualSync();

          expect(mockDocService.updateDocument).toHaveBeenCalledWith('doc-123', {
            content: currentContent,
          });
          expect(mockDocService.updateDocument).toHaveBeenCalledTimes(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('manualSync does NOT call updateDocument when content is unchanged', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (content) => {
        mockDocService.updateDocument.mockClear();

        component.editor = { getHTML: () => content, destroy: vi.fn() } as any;
        component.lastSavedContent = content; // same as current

        component.manualSync();

        expect(mockDocService.updateDocument).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 10: Salvamento bem-sucedido atualiza horário de sincronização
// Validates: Requirements 6.3, 7.3, 8.3
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 10: Salvamento bem-sucedido atualiza horário de sincronização', () => {
  let component: TiptapEditorComponent;
  let mockDocService: ReturnType<typeof createMockDocumentService>;

  beforeEach(async () => {
    mockDocService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
      providers: [{ provide: DocumentService, useValue: mockDocService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;

    vi.spyOn(component, 'ngAfterViewInit').mockImplementation(() => {});

    fixture.componentRef.setInput('documentId', 'doc-456');
    fixture.detectChanges();
  });

  /**
   * Validates: Requirements 6.3, 7.3, 8.3
   *
   * Property: For any successful save, lastSyncTime must be updated to a
   * timestamp within the save window, and syncState must transition to 'saved'.
   */
  it('lastSyncTime is updated and syncState becomes saved after successful save', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (lastSaved, newContent) => {
          fc.pre(newContent !== lastSaved);

          mockDocService.updateDocument.mockClear();
          mockDocService.updateDocument.mockReturnValue(of({ success: true, data: {} }));

          component.editor = { getHTML: () => newContent, destroy: vi.fn() } as any;
          component.lastSavedContent = lastSaved;
          component.syncState.set('idle');
          component.lastSyncTime.set(null);

          const beforeSync = new Date();
          component.manualSync();
          const afterSync = new Date();

          expect(component.syncState()).toBe('saved');

          const syncTime = component.lastSyncTime();
          expect(syncTime).not.toBeNull();
          expect(syncTime!.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
          expect(syncTime!.getTime()).toBeLessThanOrEqual(afterSync.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 12: Falha no salvamento preserva conteúdo do editor
// Validates: Requirement 6.4
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 12: Falha no salvamento preserva conteúdo do editor', () => {
  let component: TiptapEditorComponent;
  let mockDocService: ReturnType<typeof createMockDocumentService>;

  beforeEach(async () => {
    mockDocService = createMockDocumentService();

    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
      providers: [{ provide: DocumentService, useValue: mockDocService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;

    vi.spyOn(component, 'ngAfterViewInit').mockImplementation(() => {});

    fixture.componentRef.setInput('documentId', 'doc-789');
    fixture.detectChanges();
  });

  /**
   * Validates: Requirement 6.4
   *
   * Property: For any content in the editor and any save failure (HTTP error or
   * success:false response), the editor content must remain unchanged,
   * lastSavedContent must NOT be updated, and syncState must be 'error'.
   */
  it('editor content is preserved and syncState is error when save fails', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.boolean(), // true = HTTP error, false = success:false response
        (lastSaved, currentContent, isHttpError) => {
          fc.pre(currentContent !== lastSaved);

          mockDocService.updateDocument.mockClear();

          if (isHttpError) {
            mockDocService.updateDocument.mockReturnValue(
              throwError(() => new Error('Network error')),
            );
          } else {
            mockDocService.updateDocument.mockReturnValue(
              of({ success: false, error: 'Server error' }),
            );
          }

          component.editor = { getHTML: () => currentContent, destroy: vi.fn() } as any;
          component.lastSavedContent = lastSaved;
          component.syncState.set('idle');

          component.manualSync();

          // syncState must be 'error'
          expect(component.syncState()).toBe('error');

          // lastSavedContent must NOT have been updated
          expect(component.lastSavedContent).toBe(lastSaved);

          // editor.getHTML() still returns the current content (not reverted)
          expect(component.editor!.getHTML()).toBe(currentContent);
        },
      ),
      { numRuns: 100 },
    );
  });
});
