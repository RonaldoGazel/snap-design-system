// ─────────────────────────────────────────────────────────────────────────────
// Person Registration — Page Orchestrator Component
// ─────────────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import type {
  DataSource,
  NormalizedFormData,
  PersonMatch,
  SecrecyOption,
} from '../../models/registration.model';
import { RegistrationFlowService } from './services/registration-flow.service';
import { PersonRegistrationDataSource } from './adapters/person-registration-data-source';
import { MockRegistrationDataSource } from './adapters/mock-registration-data-source';
import { ApiRegistrationDataSource } from './adapters/api-registration-data-source';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';
import { RegistrationOverlayComponent } from './components/registration-overlay/registration-overlay.component';
import { RegistrationResultsComponent } from './components/registration-results/registration-results.component';
import { ReviewDrawerComponent } from './components/review-drawer/review-drawer.component';
import { RegistrationSummaryComponent } from './components/registration-summary/registration-summary.component';
import { environment } from '../../../../../environments/environment';

/**
 * Top-level page orchestrator for the person registration flow.
 *
 * Wires together all sub-components and the `RegistrationFlowService`.
 * Renders a two-column layout (form card + results panel) with a background
 * hero image. Provides the flow service and data source at the component level
 * so each page instance gets a fresh state.
 */
@Component({
  selector: 'app-person-registration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-registration.component.html',
  styleUrl: './person-registration.component.scss',
  imports: [
    ButtonModule,
    RegistrationFormComponent,
    RegistrationOverlayComponent,
    RegistrationResultsComponent,
    ReviewDrawerComponent,
    RegistrationSummaryComponent,
  ],
  providers: [
    RegistrationFlowService,
    {
      provide: PersonRegistrationDataSource,
      useClass: environment.useMocks ? MockRegistrationDataSource : ApiRegistrationDataSource,
    },
  ],
})
export class PersonRegistrationComponent {
  protected readonly flowService = inject(RegistrationFlowService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Whether the review drawer is open. */
  protected readonly drawerOpen = signal(false);

  // ── Event Handlers ──────────────────────────────────────────────────────

  /**
   * Handle form submission — start the registration flow.
   */
  onFormSubmit(data: NormalizedFormData): void {
    this.flowService.startFlow(data);
  }

  /**
   * Handle person card selection — open the review drawer and select the person.
   */
  onPersonSelected(event: { person: PersonMatch; source: DataSource }): void {
    this.drawerOpen.set(true);
    this.flowService.selectPerson(event.person, event.source);
  }

  /**
   * Handle advance request — move to the next source in the pipeline.
   */
  onAdvanceRequested(source: DataSource): void {
    this.flowService.advanceFromSource(source);
  }

  /**
   * Handle generate request — trigger person generation from an external source.
   */
  onGenerateRequested(source: 'SIPEN' | 'SNAP'): void {
    this.flowService.generateFromSource(source);
  }

  /**
   * Handle registration confirmation from the review drawer.
   */
  onRegisterConfirmed(event: { person: PersonMatch; secrecy: SecrecyOption }): void {
    this.drawerOpen.set(false);
    this.flowService.confirmRegistration(event.secrecy);
  }

  /**
   * Navigate to the person profile route for manual registration.
   */
  onManualRegistration(): void {
    this.router.navigate(['/intelligence/person/pessoas/p1'], {
      queryParams: { id: 'novo-registro' },
    });
  }

  /**
   * Navigate back to the previous page.
   */
  goBack(): void {
    this.location.back();
  }
}
