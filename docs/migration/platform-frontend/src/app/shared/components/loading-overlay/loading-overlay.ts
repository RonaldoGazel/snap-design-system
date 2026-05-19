import { Component, input } from '@angular/core';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [ProgressSpinner],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css',
})
export class LoadingOverlayComponent {
  visible = input(false);
  message = input('Carregando...');
}
