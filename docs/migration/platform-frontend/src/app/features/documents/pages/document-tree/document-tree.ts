// @ts-nocheck — Legacy file pending migration to new document models
import { Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { TreeModule, TreeNodeSelectEvent } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';

import { Document } from '../../../../shared/models/document.model';
import { DocumentType } from '../../../../shared/models/enums';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-document-tree',
  standalone: true,
  imports: [TreeModule, ButtonModule, TagModule],
  templateUrl: './document-tree.html',
  styleUrl: './document-tree.css',
})
export class DocumentTreeComponent implements OnChanges {
  private readonly documentService = inject(DocumentService);

  processId = input.required<string>();
  canCreate = input(false);
  documentSelected = output<Document>();
  createRequested = output<string | undefined>(); // parentId

  nodes = signal<TreeNode[]>([]);
  selectedNode = signal<TreeNode | null>(null);
  loading = signal(false);

  readonly typeIcons: Record<string, string> = {
    [DocumentType.CAPA]: 'pi pi-file',
    [DocumentType.DESPACHO]: 'pi pi-file-edit',
    [DocumentType.RELATORIO]: 'pi pi-chart-bar',
    [DocumentType.OFICIO]: 'pi pi-envelope',
    [DocumentType.ANEXO]: 'pi pi-paperclip',
  };

  ngOnChanges(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.documentService.getDocuments(this.processId()).subscribe((res) => {
      if (res.success && res.data) {
        this.nodes.set(this.buildTree(res.data));
      }
      this.loading.set(false);
    });
  }

  loadAndSelect(documentId: string): void {
    this.loading.set(true);
    this.documentService.getDocuments(this.processId()).subscribe((res) => {
      if (res.success && res.data) {
        const nodes = this.buildTree(res.data);
        this.nodes.set(nodes);
        const target = this.findNode(nodes, documentId);
        if (target) {
          this.selectedNode.set(target);
          this.documentSelected.emit(target['data'] as Document);
        }
      }
      this.loading.set(false);
    });
  }

  private findNode(nodes: TreeNode[], key: string): TreeNode | null {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = this.findNode(node.children, key);
        if (found) return found;
      }
    }
    return null;
  }

  onNodeSelect(event: TreeNodeSelectEvent): void {
    if (event.node['data']) {
      this.documentSelected.emit(event.node['data'] as Document);
    }
  }

  private buildTree(docs: Document[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const doc of docs) {
      map.set(doc.id, {
        key: doc.id,
        label: doc.title,
        icon: this.typeIcons[doc.type] ?? 'pi pi-file',
        data: doc,
        children: [],
        expanded: true,
      });
    }

    for (const doc of docs) {
      const node = map.get(doc.id)!;
      if (doc.parent_id && map.has(doc.parent_id)) {
        map.get(doc.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
