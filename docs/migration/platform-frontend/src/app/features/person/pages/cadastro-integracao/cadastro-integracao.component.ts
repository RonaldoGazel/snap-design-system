import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import {
  MOCK_CADASTRO,
  CadastroRapidoForm,
  IdentidadeIncompletaForm,
} from '../../data/cadastro-integracao.data';

@Component({
  selector: 'app-cadastro-integracao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cadastro-integracao.component.html',
  styleUrl: './cadastro-integracao.component.scss',
  imports: [
    FormsModule,
    StepsModule,
    ButtonModule,
    SelectButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    SkeletonModule,
    AvatarModule,
    TooltipModule,
  ],
})
export class CadastroIntegracaoComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly mock = MOCK_CADASTRO;

  // Stepper state
  protected readonly currentStep = signal(0);
  protected readonly transitioning = signal(false);

  protected readonly stepItems = [
    { label: 'CADASTRO' },
    { label: 'SIPEN' },
    { label: 'SNAP' },
    { label: 'CONCILIAÇÃO' },
    { label: 'DEDUPLICAÇÃO' },
  ];

  // Step 1 state
  protected readonly modoCadastro = signal<'rapido' | 'incompleta'>('rapido');
  protected readonly modoOptions = [
    { label: 'Cadastro rápido', value: 'rapido' },
    { label: 'Identidade incompleta', value: 'incompleta' },
  ];
  protected readonly formRapido = signal<CadastroRapidoForm>({ ...MOCK_CADASTRO.cadastroRapido });
  protected readonly formIncompleto = signal<IdentidadeIncompletaForm>({
    ...MOCK_CADASTRO.identidadeIncompleta,
  });

  // Step 2 state
  protected readonly decisaoSipen = signal<'usar' | 'parcial' | 'nao-corresponde'>('usar');

  // Step 5 state
  protected readonly estadoDedup = signal<'fila' | 'comparacao'>('fila');
  protected readonly itemComparando = signal<number | null>(null);

  // Sidebar accumulated data
  protected readonly resumoPessoa = computed(() => {
    const step = this.currentStep();
    const form = this.modoCadastro() === 'rapido' ? this.formRapido() : this.formIncompleto();
    const sipenDados = this.mock.resultadoSipen.dados;
    return {
      nome:
        step >= 1
          ? (sipenDados?.nome ??
            ('nome' in form ? form.nome : 'nomeAproximado' in form ? form.nomeAproximado : ''))
          : 'nome' in form
            ? form.nome
            : '',
      vulgo:
        'vulgo' in form
          ? form.vulgo
          : 'vulgo' in form
            ? (form as IdentidadeIncompletaForm).vulgo
            : '',
      cpf: step >= 2 ? sipenDados?.cpf : 'cpf' in form ? form.cpf : '',
      rg: step >= 2 ? sipenDados?.rg : 'rg' in form ? form.rg : '',
      perfil: 'perfil' in form ? form.perfil : '',
      fonteManual: true,
      fonteSipen: step >= 2,
      fonteSnap: step >= 3,
      status:
        [
          'Registro inicial',
          'Registro inicial',
          'Validado SIPEN',
          'Enriquecido SNAP',
          'Conciliado',
          'Consolidado',
        ][step] ?? 'Registro inicial',
      alertas:
        step >= 3
          ? this.mock.dadosSnap.alertas.slice(0, 2)
          : 'cpf' in form && !form.cpf
            ? ['Sem identificador formal']
            : [],
    };
  });

  // Select options
  protected readonly perfilOptions = [
    { label: 'Preso', value: 'preso' },
    { label: 'Ex-preso', value: 'ex-preso' },
    { label: 'Visitante', value: 'visitante' },
    { label: 'Familiar', value: 'familiar' },
    { label: 'Advogado', value: 'advogado' },
    { label: 'Alvo', value: 'alvo' },
    { label: 'Pessoa relacionada', value: 'pessoa-relacionada' },
    { label: 'Servidor', value: 'servidor' },
    { label: 'Não definido', value: '' },
  ];
  protected readonly sexoOptions = [
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Feminino', value: 'Feminino' },
    { label: 'Não informado', value: '' },
  ];
  protected readonly faixaEtariaOptions = [
    { label: '18-25', value: '18-25' },
    { label: '26-35', value: '26-35' },
    { label: '36-45', value: '36-45' },
    { label: '46-55', value: '46-55' },
    { label: '56+', value: '56+' },
  ];
  protected readonly origemOptions = [
    { label: 'Documento', value: 'Documento' },
    { label: 'Denúncia', value: 'Denúncia' },
    { label: 'Vínculo', value: 'Vínculo' },
    { label: 'Relato interno', value: 'Relato interno' },
    { label: 'Monitoramento', value: 'Monitoramento' },
    { label: 'OSINT', value: 'OSINT' },
  ];
  protected readonly decisaoOptions = [
    { label: 'Manter SIPEN', value: 'sipen' },
    { label: 'Manter SNAP', value: 'snap' },
    { label: 'Manter ambos', value: 'ambos' },
    { label: 'Revisar depois', value: 'revisar' },
  ];

  protected get canSkip(): boolean {
    return this.currentStep() >= 1 && this.currentStep() <= 3;
  }
  protected get isLastStep(): boolean {
    return this.currentStep() === 4;
  }

  protected avancar(): void {
    if (this.isLastStep) {
      this.concluir();
      return;
    }
    this.transitioning.set(true);
    setTimeout(() => {
      this.currentStep.update((s) => s + 1);
      this.transitioning.set(false);
    }, 600);
  }

  protected voltar(): void {
    if (this.currentStep() === 0) {
      this.location.back();
      return;
    }
    this.currentStep.update((s) => s - 1);
  }

  protected pular(): void {
    this.avancar();
  }

  protected concluir(): void {
    this.router.navigate(['/intelligence/person/pessoas/p1'], { queryParams: { id: 'novo-registro' } });
  }

  protected salvarRascunho(): void {
    this.router.navigate(['/intelligence/person/dashboard']);
  }

  protected scoreClass(score: number): string {
    if (score >= 80) return 'hypothesis-card__score--high';
    if (score >= 60) return 'hypothesis-card__score--medium';
    return 'hypothesis-card__score--low';
  }

  protected formatDate(iso: string): string {
    if (iso.includes('/')) return iso;
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  }
}
