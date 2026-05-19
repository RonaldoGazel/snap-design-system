import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

import { handleDocumentError } from './error-handler.util';

function createHttpError(status: number, body?: { message?: string; error?: string }): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: 'Error',
    error: body ?? null,
  });
}

describe('handleDocumentError', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = new MessageService();
    vi.spyOn(messageService, 'add');
  });

  // --- HTTP 400 → warn severity ---

  it('should map HTTP 400 to warn severity with validation message', () => {
    const error = createHttpError(400);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'Validação',
        detail: 'Dados inválidos. Verifique os campos.',
      }),
    );
  });

  it('should use backend message for HTTP 400 when available', () => {
    const error = createHttpError(400, { message: 'Campo título é obrigatório' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'Validação',
        detail: 'Campo título é obrigatório',
      }),
    );
  });

  // --- HTTP 403 → warn severity ---

  it('should map HTTP 403 to warn severity with access denied message', () => {
    const error = createHttpError(403);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Operação não permitida — verifique suas permissões.',
      }),
    );
  });

  it('should use backend message for HTTP 403 when available', () => {
    const error = createHttpError(403, { message: 'Documento formalizado é imutável e não pode ser editado' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: 'Documento formalizado é imutável e não pode ser editado',
      }),
    );
  });

  // --- HTTP 404 → error severity ---

  it('should map HTTP 404 to error severity with not found message', () => {
    const error = createHttpError(404);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Não Encontrado',
        detail: 'Recurso não encontrado.',
      }),
    );
  });

  it('should use backend message for HTTP 404 when available', () => {
    const error = createHttpError(404, { message: 'Documento não encontrado' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Não Encontrado',
        detail: 'Documento não encontrado',
      }),
    );
  });

  // --- HTTP 409 → error severity ---

  it('should map HTTP 409 to error severity with conflict message', () => {
    const error = createHttpError(409);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Conflito',
        detail: 'Conflito de edição: recurso foi alterado por outro usuário.',
      }),
    );
  });

  it('should use backend message for HTTP 409 when available', () => {
    const error = createHttpError(409, { message: 'Documento possui documentos filhos ativos e não pode ser removido' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Conflito',
        detail: 'Documento possui documentos filhos ativos e não pode ser removido',
      }),
    );
  });

  // --- HTTP 502 → error severity ---

  it('should map HTTP 502 to error severity with processing error message', () => {
    const error = createHttpError(502);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro de Processamento',
        detail: 'Erro no processamento. Tente novamente.',
      }),
    );
  });

  it('should use backend message for HTTP 502 when available', () => {
    const error = createHttpError(502, { message: 'Falha no OCR. Tente novamente.' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro de Processamento',
        detail: 'Falha no OCR. Tente novamente.',
      }),
    );
  });

  // --- HTTP 500 → error severity with generic message ---

  it('should map HTTP 500 to error severity with generic message', () => {
    const error = createHttpError(500);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });

  // --- Unknown status → default error ---

  it('should map unknown status to error severity with generic message', () => {
    const error = createHttpError(503);
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });

  // --- Backend message via error field ---

  it('should use error field from backend when message is not available', () => {
    const error = createHttpError(403, { error: 'Apenas o setor atual pode editar este documento' });
    handleDocumentError(error, messageService);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        detail: 'Apenas o setor atual pode editar este documento',
      }),
    );
  });
});
