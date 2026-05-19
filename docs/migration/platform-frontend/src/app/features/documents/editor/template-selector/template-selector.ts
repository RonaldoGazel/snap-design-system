import { Component, inject, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { EditorTemplate, EditorTemplateService } from '../services/template.service';

@Component({
  selector: 'app-template-selector',
  standalone: true,
  imports: [ButtonModule, CardModule],
  templateUrl: './template-selector.html',
  styleUrl: './template-selector.css',
})
export class TemplateSelectorComponent {
  private readonly templateService = inject(EditorTemplateService);

  templateSelected = output<EditorTemplate>();

  templates = signal(this.templateService.getTemplates());
  selected = signal<EditorTemplate | null>(null);

  select(t: EditorTemplate): void {
    this.selected.set(t);
    this.templateSelected.emit(t);
  }
}
