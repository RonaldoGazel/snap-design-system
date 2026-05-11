import { Injectable, signal } from '@angular/core';

export interface TarefaBackground {
  fonte: 'sipen' | 'snap';
  tooltipVisivel: boolean;
  tooltipSaindo: boolean;
  primeiraExibicao: boolean;
}

@Injectable({ providedIn: 'root' })
export class TarefaBackgroundService {
  readonly tarefa = signal<TarefaBackground | null>(null);

  iniciar(fonte: 'sipen' | 'snap'): void {
    this.tarefa.set({ fonte, tooltipVisivel: true, tooltipSaindo: false, primeiraExibicao: true });

    // Fecha automaticamente após 3s e libera o hover
    setTimeout(() => {
      this._fecharComFade();
      setTimeout(() => {
        const t = this.tarefa();
        if (t)
          this.tarefa.set({
            ...t,
            tooltipVisivel: false,
            tooltipSaindo: false,
            primeiraExibicao: false,
          });
      }, 300);
    }, 3000);
  }

  mostrarTooltip(): void {
    const t = this.tarefa();
    if (t && !t.primeiraExibicao) {
      this.tarefa.set({ ...t, tooltipVisivel: true, tooltipSaindo: false });
    }
  }

  ocultarTooltip(): void {
    const t = this.tarefa();
    if (!t || !t.tooltipVisivel || t.primeiraExibicao) return;
    this._fecharComFade();
    setTimeout(() => {
      const atual = this.tarefa();
      if (atual) this.tarefa.set({ ...atual, tooltipVisivel: false, tooltipSaindo: false });
    }, 300);
  }

  private _fecharComFade(): void {
    const t = this.tarefa();
    if (t) this.tarefa.set({ ...t, tooltipSaindo: true });
  }
}
