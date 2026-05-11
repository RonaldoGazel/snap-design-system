import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { BpmsApiService } from './bpms-api.service';
import { ToastService } from './toast.service';
import {
  BpmsProcess,
  BpmsDocumentInstance,
  BpmsPendingTask,
  UnitProfileCombo,
  DisseminationTarget,
} from '../models/bpms.model';

/**
 * Structured error from workflow backend responses.
 */
export interface WorkflowActionError {
  /** HTTP status code */
  status: number;
  /** Backend error code (e.g., AUTHORIZATION_DENIED, TRANSITION_GUARD_FAILED) */
  code: string;
  /** Human-readable message from backend */
  message: string;
  /** Additional details (guard failures, etc.) */
  details?: string[];
  /** For OTP step-up flows */
  requiredAction?: string;
}

function parseBackendError(err: HttpErrorResponse): WorkflowActionError {
  const detail = err.error?.detail;
  if (typeof detail === 'object' && detail !== null) {
    return {
      status: err.status,
      code: detail.code ?? 'UNKNOWN',
      message: detail.message ?? err.message,
      details: detail.details,
      requiredAction: detail.required_action,
    };
  }
  return {
    status: err.status,
    code: err.status === 403 ? 'AUTHORIZATION_DENIED' : 'UNKNOWN',
    message: typeof detail === 'string' ? detail : err.message,
  };
}

/**
 * State management for workflow instances.
 *
 * All mutations delegate to the backend API. No local authorization checks.
 * The backend enforces all permission and flow rules.
 *
 * Methods return Observable so components can handle success/error.
 * Common errors (403, 409, 400) show toast notifications automatically.
 * Components can add additional error handling via subscribe({ error }).
 */
@Injectable({ providedIn: 'root' })
export class BpmsInstanceStateService {
  private readonly api = inject(BpmsApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly processes = signal<BpmsProcess[]>([]);
  readonly documentInstances = signal<BpmsDocumentInstance[]>([]);

  readonly pendingTasks = computed<BpmsPendingTask[]>(() =>
    this.documentInstances()
      .filter(
        (i) =>
          !i.is_formalized &&
          i.current_step_id &&
          !['DIFUNDIDO_INTERNO', 'DIFUNDIDO_EXTERNO', 'CANCELADO'].includes(i.status),
      )
      .map((i) => ({ instance: i })),
  );

  readonly pendingCount = computed(() => this.pendingTasks().length);

  loadAll(): void {
    this.api.getProcesses().subscribe((p) => this.processes.set(p));
    this.api.getDocumentInstances().subscribe((d) => this.documentInstances.set(d));
  }

  createProcess(data: Partial<BpmsProcess>): void {
    this.api.createProcess(data).subscribe((process) => {
      this.processes.update((p) => [...p, process]);
    });
  }

  createDocumentInstance(data: Partial<BpmsDocumentInstance>): void {
    this.api.createDocumentInstance(data).subscribe((instance) => {
      this.documentInstances.update((d) => [...d, instance]);
    });
  }

  /**
   * Advance document through a transition.
   * Returns Observable so the component can react to success/error.
   * Shows toast on common errors (403, 409).
   */
  advanceDocument(
    instanceId: string,
    transitionId: string,
    actor: UnitProfileCombo,
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .executeTransition(instanceId, {
        transition_id: transitionId,
        actor_unit_id: actor.unit_id,
        actor_profile_id: actor.profile_id,
      })
      .pipe(
        tap((updated) => {
          this.documentInstances.update((d) =>
            d.map((i) => (i.id === instanceId ? updated : i)),
          );
          this.toast.success(
            this.translate.instant('workflows.toast.transitionSuccess'),
          );
        }),
        catchError((err: HttpErrorResponse) => {
          const parsed = parseBackendError(err);
          this.showActionError('workflows.toast.transitionFailed', parsed);
          return throwError(() => parsed);
        }),
      );
  }

  /**
   * Formalize a document.
   * Returns Observable so the component can react to success/error.
   */
  formalizeDocument(
    instanceId: string,
    actor: UnitProfileCombo,
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .formalizeDocument(instanceId, {
        actor_unit_id: actor.unit_id,
        actor_profile_id: actor.profile_id,
      })
      .pipe(
        tap((updated) => {
          this.documentInstances.update((d) =>
            d.map((i) => (i.id === instanceId ? updated : i)),
          );
          this.toast.success(
            this.translate.instant('workflows.toast.formalizationSuccess'),
          );
        }),
        catchError((err: HttpErrorResponse) => {
          const parsed = parseBackendError(err);
          this.showActionError('workflows.toast.formalizationFailed', parsed);
          return throwError(() => parsed);
        }),
      );
  }

  /**
   * Disseminate a document.
   * Returns Observable so the component can react to success/error.
   * Surfaces OTP_STEP_UP_REQUIRED so the component can trigger step-up flow.
   */
  disseminateDocument(
    instanceId: string,
    targets: DisseminationTarget[],
    actor: UnitProfileCombo,
    type: 'INTERNAL' | 'EXTERNAL' = 'INTERNAL',
  ): Observable<BpmsDocumentInstance> {
    return this.api
      .disseminateDocument(instanceId, {
        type,
        targets,
        actor_unit_id: actor.unit_id,
        actor_profile_id: actor.profile_id,
      })
      .pipe(
        tap((updated) => {
          this.documentInstances.update((d) =>
            d.map((i) => (i.id === instanceId ? updated : i)),
          );
          this.toast.success(
            this.translate.instant('workflows.toast.disseminationSuccess'),
          );
        }),
        catchError((err: HttpErrorResponse) => {
          const parsed = parseBackendError(err);
          // Don't show toast for OTP step-up — the component handles that flow
          if (parsed.code !== 'OTP_STEP_UP_REQUIRED') {
            this.showActionError('workflows.toast.disseminationFailed', parsed);
          }
          return throwError(() => parsed);
        }),
      );
  }

  // ---------------------------------------------------------------------------
  // Error presentation
  // ---------------------------------------------------------------------------

  private showActionError(summaryKey: string, error: WorkflowActionError): void {
    const summary = this.translate.instant(summaryKey);
    let detail: string;

    switch (error.code) {
      case 'AUTHORIZATION_DENIED':
        detail = this.translate.instant('workflows.errors.authorizationDenied');
        break;
      case 'TRANSITION_GUARD_FAILED':
        detail = error.details?.join('; ') ?? error.message;
        break;
      case 'FLOW_MATRIX_DENIED':
        detail = this.translate.instant('workflows.errors.flowMatrixDenied');
        break;
      case 'CAPABILITY_NOT_ALLOWED':
        detail = this.translate.instant('workflows.errors.capabilityNotAllowed');
        break;
      case 'INSTANCE_SUSPENDED':
      case 'INSTANCE_PENDING_CONFIRMATION':
        detail = this.translate.instant('workflows.errors.instanceNotActionable');
        break;
      default:
        detail = error.message;
    }

    this.toast.error(summary, detail);
  }
}
