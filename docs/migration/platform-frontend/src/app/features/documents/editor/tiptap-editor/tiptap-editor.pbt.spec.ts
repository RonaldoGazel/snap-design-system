// Feature: document-content-editor, Property 11: Indicador de sincronização reflete o estado atual
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

import { TiptapEditorComponent } from './tiptap-editor';
import { DocumentService } from '../../pages/services/document.service';

function createMockDocumentService() {
  return { updateDocument: vi.fn() };
}

/**
 * Validates: Requirements 7.2, 7.3, 7.4, 8.2, 8.4
 *
 * Property 11: For any value of syncState ('idle', 'saving', 'saved', 'error'),
 * the sync indicator must display the correct text and icon for each state.
 */
describe('Property 11: Indicador de sincronização reflete o estado atual', () => {
  let fixture: ComponentFixture<TiptapEditorComponent>;
  let component: TiptapEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
      providers: [{ provide: DocumentService, useValue: createMockDocumentService() }],
    }).compileComponents();

    fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;

    // Prevent TipTap from mounting — it requires a real browser DOM, not jsdom
    vi.spyOn(component, 'ngAfterViewInit').mockImplementation(() => {});

    fixture.componentRef.setInput('documentId', 'test-doc-id');
    fixture.detectChanges();
  });

  const syncStates = ['idle', 'saving', 'saved', 'error'] as const;
  type SyncState = (typeof syncStates)[number];

  it('sync indicator text and icon match syncState for all states', () => {
    fc.assert(
      fc.property(fc.constantFrom(...syncStates), (state: SyncState) => {
        if (state === 'saved') {
          component.lastSyncTime.set(new Date());
        }
        component.syncState.set(state);
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const syncIndicator = el.querySelector('.sync-indicator');
        expect(syncIndicator).toBeTruthy();

        const text = syncIndicator?.textContent ?? '';

        if (state === 'saving') {
          expect(syncIndicator?.querySelector('.pi-spinner')).toBeTruthy();
          expect(text).toContain('Sincronizando...');
        } else if (state === 'saved') {
          expect(syncIndicator?.querySelector('.pi-check-circle')).toBeTruthy();
          expect(text).toContain('Última sincronização:');
        } else if (state === 'error') {
          expect(syncIndicator?.querySelector('.pi-exclamation-triangle')).toBeTruthy();
          expect(text).toContain('Erro ao sincronizar');
        } else {
          // idle: none of the state-specific texts shown
          expect(text).not.toContain('Sincronizando...');
          expect(text).not.toContain('Última sincronização:');
          expect(text).not.toContain('Erro ao sincronizar');
        }
      }),
      { numRuns: 100 },
    );
  });
});
