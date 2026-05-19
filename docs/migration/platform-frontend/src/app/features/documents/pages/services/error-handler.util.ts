import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

export function handleDocumentError(
  error: HttpErrorResponse,
  messageService: MessageService,
  router?: Router,
  context?: string,
): void {
  const status = error.status;
  const backendMessage = error.error?.message || error.error?.error;

  switch (status) {
    case 400:
      messageService.add({
        severity: 'warn',
        summary: 'Validação',
        detail: backendMessage || 'Dados inválidos. Verifique os campos.',
        life: 8000,
      });
      break;
    case 403:
      messageService.add({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: backendMessage || 'Operação não permitida — verifique suas permissões.',
        life: 8000,
      });
      break;
    case 404:
      messageService.add({
        severity: 'error',
        summary: 'Não Encontrado',
        detail: backendMessage || 'Recurso não encontrado.',
        life: 8000,
      });
      break;
    case 409:
      messageService.add({
        severity: 'error',
        summary: 'Conflito',
        detail: backendMessage || 'Conflito de edição: recurso foi alterado por outro usuário.',
        life: 8000,
      });
      break;
    case 502:
      messageService.add({
        severity: 'error',
        summary: 'Erro de Processamento',
        detail: backendMessage || 'Erro no processamento. Tente novamente.',
        life: 8000,
      });
      break;
    default:
      messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro interno. Tente novamente mais tarde.',
        life: 8000,
      });
  }
}
