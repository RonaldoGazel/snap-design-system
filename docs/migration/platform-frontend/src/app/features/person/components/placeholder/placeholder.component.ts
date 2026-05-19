import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

export interface PlaceholderDestino {
  telaNumero: number;
  label: string;
  route: string;
}

@Component({
  selector: 'app-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink, ButtonModule],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.scss',
})
export class PlaceholderComponent {
  telaNumero = input.required<number>();
  titulo = input.required<string>();
  bloco = input.required<string>();
  destinos = input<PlaceholderDestino[]>([]);
}
