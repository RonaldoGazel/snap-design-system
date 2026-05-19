import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { calcularIniciais } from '../../../intelligence/persons/utils/iniciais';

export interface PessoaMonitorada {
  id: string;
  name: string;
  cpf: string;
  motherName?: string;
  photo?: string;
  roles?: string[];
  monitoringActive?: boolean;
  threatLevel?: string;
}

@Component({
  selector: 'app-pessoa-card',
  standalone: true,
  imports: [CardModule, ButtonModule, TagModule, AvatarModule],
  templateUrl: './pessoa-card.html',
  styleUrl: './pessoa-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PessoaCardComponent {
  readonly pessoa = input.required<PessoaMonitorada>();
  readonly atualizar = output<string>();
  readonly verDetalhes = output<string>();

  readonly isAtualizando = signal(false);

  readonly iniciais = computed(() => calcularIniciais(this.pessoa().name));

  readonly cpfFormatado = computed(() => {
    const cpf = this.pessoa().cpf;
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  });

  readonly hasRoles = computed(() => {
    const roles = this.pessoa().roles;
    return roles && roles.length > 0;
  });

  readonly ariaLabel = computed(() => {
    const pessoa = this.pessoa();
    const monitoramento = pessoa.monitoringActive ? 'monitorada' : 'não monitorada';
    return `Pessoa: ${pessoa.name}, CPF: ${this.cpfFormatado()}, Mãe: ${pessoa.motherName || 'não informado'}, Status: ${monitoramento}`;
  });

  readonly severidadeRisco = computed(() => {
    const nivel = this.pessoa().threatLevel;
    switch (nivel) {
      case 'CRITICO':
        return 'danger';
      case 'ALTO':
        return 'warn';
      case 'MEDIO':
        return 'info';
      case 'BAIXO':
        return 'success';
      default:
        return 'secondary';
    }
  });

  onAtualizar(): void {
    this.isAtualizando.set(true);

    // Simular atualização (1s conforme requisito 40.5)
    setTimeout(() => {
      this.isAtualizando.set(false);
      this.atualizar.emit(this.pessoa().id);
    }, 1000);
  }

  onVerDetalhes(): void {
    this.verDetalhes.emit(this.pessoa().id);
  }
}
