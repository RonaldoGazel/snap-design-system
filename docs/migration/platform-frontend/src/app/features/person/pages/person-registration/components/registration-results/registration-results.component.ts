import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import type { DataSource, PersonMatch, ResultGroup } from '../../../../models/registration.model';
import { PersonMatchCardComponent } from '../person-match-card/person-match-card.component';

@Component({
  selector: 'app-registration-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration-results.component.html',
  styleUrl: './registration-results.component.scss',
  imports: [PersonMatchCardComponent, ButtonModule],
})
export class RegistrationResultsComponent {
  /** Groups of person match results from each data source. */
  readonly resultGroups = input<ResultGroup[]>([]);

  /** Emitted when the user selects a person from a result group. */
  readonly personSelected = output<{ person: PersonMatch; source: DataSource }>();

  /** Emitted when the user wants to advance past a source (e.g. "Nenhuma corresponde"). */
  readonly advanceRequested = output<DataSource>();

  /** Emitted when the user wants to generate a person from an external source. */
  readonly generateRequested = output<'SIPEN' | 'SNAP'>();

  /** Whether the form data has a valid CPF (enables generate buttons). */
  readonly hasValidCPF = input<boolean>(false);

  /** Result groups in reverse order (newest at top). */
  readonly reversedGroups = computed(() => [...this.resultGroups()].reverse());

  protected onPersonCardClicked(person: PersonMatch, source: DataSource): void {
    this.personSelected.emit({ person, source });
  }

  protected onRegisterClicked(person: PersonMatch, source: DataSource): void {
    this.personSelected.emit({ person, source });
  }

  protected onOpenProfileClicked(person: PersonMatch): void {
    if (person.profileUrl) {
      window.open(person.profileUrl, '_blank');
    }
  }

  protected onAdvance(source: DataSource): void {
    this.advanceRequested.emit(source);
  }

  protected onGenerate(source: 'SIPEN' | 'SNAP'): void {
    this.generateRequested.emit(source);
  }
}
