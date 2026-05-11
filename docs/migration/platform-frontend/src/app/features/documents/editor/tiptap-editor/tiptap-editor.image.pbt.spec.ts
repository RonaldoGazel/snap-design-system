// Feature: document-content-editor, Property 6: Imagem convertida para base64 embutido no HTML

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

import { TiptapEditorComponent } from './tiptap-editor';
import { DocumentService } from '../../pages/services/document.service';

function createMockDocumentService() {
  return { updateDocument: vi.fn() };
}

/**
 * Validates: Requirements 5.2, 5.3
 *
 * Property 6: For any image file in accepted formats (PNG, JPEG, GIF, WebP),
 * readAndInsertImage must convert it to a base64 data URL and call setImage
 * with a src starting with 'data:image/'.
 */
describe('Property 6: Imagem convertida para base64 embutido no HTML', () => {
  let component: TiptapEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapEditorComponent],
      providers: [{ provide: DocumentService, useValue: createMockDocumentService() }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TiptapEditorComponent);
    component = fixture.componentInstance;

    vi.spyOn(component, 'ngAfterViewInit').mockImplementation(() => {});
    fixture.componentRef.setInput('documentId', 'test-doc-id');
    fixture.detectChanges();
  });

  const imageMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;

  /**
   * Creates a FileReader constructor mock that fires onload synchronously
   * with the given dataUrl as `reader.result`.
   */
  function makeMockFileReaderClass(dataUrl: string) {
    let readAsDataURLSpy: ReturnType<typeof vi.fn>;

    class MockFileReader {
      result: string = dataUrl;
      onload: ((event: ProgressEvent) => void) | null = null;

      readAsDataURL = vi.fn().mockImplementation(() => {
        if (this.onload) this.onload({} as ProgressEvent);
      });

      constructor() {
        // capture the spy so callers can assert on it
        readAsDataURLSpy = this.readAsDataURL;
      }
    }

    return { MockFileReader, getReadAsDataURLSpy: () => readAsDataURLSpy };
  }

  it('readAndInsertImage calls setImage with a valid base64 data URL for any accepted image type', () => {
    fc.assert(
      fc.property(
        // Generate random byte content for the image (1–100 bytes)
        fc.uint8Array({ minLength: 1, maxLength: 100 }),
        // Pick a random accepted MIME type
        fc.constantFrom(...imageMimeTypes),
        (bytes, mimeType) => {
          let capturedSrc: string | null = null;

          // Mock the editor chain
          component.editor = {
            chain: () => ({
              focus: () => ({
                setImage: ({ src }: { src: string }) => {
                  capturedSrc = src;
                  return { run: () => true };
                },
              }),
            }),
            destroy: vi.fn(),
          } as any;

          // Build the expected data URL
          const expectedDataUrl = `data:${mimeType};base64,dGVzdA==`;

          const { MockFileReader, getReadAsDataURLSpy } = makeMockFileReaderClass(expectedDataUrl);
          vi.stubGlobal('FileReader', MockFileReader);

          const file = new File([bytes], `test.${mimeType.split('/')[1]}`, { type: mimeType });

          component.readAndInsertImage(file);

          // FileReader.readAsDataURL must have been called with the file
          expect(getReadAsDataURLSpy()).toHaveBeenCalledWith(file);

          // setImage must have been called with a valid data URL
          expect(capturedSrc).not.toBeNull();
          expect(capturedSrc!).toMatch(/^data:image\//);
          expect(capturedSrc!).toBe(expectedDataUrl);

          vi.unstubAllGlobals();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('readAndInsertImage accepts all four image formats', () => {
    for (const mimeType of imageMimeTypes) {
      let capturedSrc: string | null = null;

      component.editor = {
        chain: () => ({
          focus: () => ({
            setImage: ({ src }: { src: string }) => {
              capturedSrc = src;
              return { run: () => true };
            },
          }),
        }),
        destroy: vi.fn(),
      } as any;

      const dataUrl = `data:${mimeType};base64,dGVzdA==`;
      const { MockFileReader } = makeMockFileReaderClass(dataUrl);
      vi.stubGlobal('FileReader', MockFileReader);

      const file = new File([new Uint8Array([1, 2, 3])], 'test', { type: mimeType });
      component.readAndInsertImage(file);

      expect(capturedSrc).not.toBeNull();
      expect(capturedSrc!).toMatch(/^data:image\//);

      vi.unstubAllGlobals();
    }
  });
});
