import { Injectable } from '@angular/core';

import { DocumentType } from '../../pages/models/document.models';

export interface EditorTemplate {
  type: DocumentType;
  label: string;
  description: string;
  content: string;
}

const TEMPLATES: EditorTemplate[] = [
  {
    type: 'CAPA',
    label: 'Capa',
    description: 'Documento de abertura do processo',
    content: `<h2>PROCESSO Nº {{NUP}}</h2>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<p><strong>Responsável:</strong> {{USUARIO_NOME}}</p>
<hr/>
<p>Assunto: </p>`,
  },
  {
    type: 'DESPACHO',
    label: 'Despacho',
    description: 'Decisão administrativa',
    content: `<p><strong>DESPACHO</strong></p>
<p>Processo nº {{NUP}} — {{DATA_ATUAL}}</p>
<p>Ao(À) _______________,</p>
<p></p>
<p>Encaminhe-se para providências.</p>
<p><strong>{{USUARIO_NOME}}</strong></p>`,
  },
  {
    type: 'RELATORIO',
    label: 'Relatório',
    description: 'Relatório de inteligência',
    content: `<h2>RELATÓRIO DE INTELIGÊNCIA</h2>
<p><strong>Processo:</strong> {{NUP}}</p>
<p><strong>Data:</strong> {{DATA_ATUAL}}</p>
<p><strong>Elaborado por:</strong> {{USUARIO_NOME}}</p>
<hr/>
<h3>1. Introdução</h3>
<p></p>
<h3>2. Desenvolvimento</h3>
<p></p>
<h3>3. Conclusão</h3>
<p></p>`,
  },
  {
    type: 'OFICIO',
    label: 'Ofício',
    description: 'Comunicação oficial',
    content: `<p style="text-align:right">{{DATA_ATUAL}}</p>
<p><strong>Ofício nº ___/{{NUP}}</strong></p>
<p>Ao(À) _______________,</p>
<p></p>
<p>Prezado(a) Senhor(a),</p>
<p></p>
<p>Atenciosamente,</p>
<p><strong>{{USUARIO_NOME}}</strong></p>`,
  },
  {
    type: 'ANEXO',
    label: 'Anexo',
    description: 'Documento anexado',
    content: `<p><strong>ANEXO</strong></p>
<p>Processo: {{NUP}} — {{DATA_ATUAL}}</p>
<hr/>
<p></p>`,
  },
];

@Injectable({ providedIn: 'root' })
export class EditorTemplateService {
  getTemplates(): EditorTemplate[] {
    return TEMPLATES;
  }

  getTemplate(type: DocumentType): EditorTemplate | undefined {
    return TEMPLATES.find((t) => t.type === type);
  }

  renderTemplate(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  getDefaultVariables(userName: string, nup: string): Record<string, string> {
    return {
      NUP: nup,
      DATA_ATUAL: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      USUARIO_NOME: userName,
    };
  }
}
