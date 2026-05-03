# SNAP Design System - Changelog

Histórico de alterações do Design System SNAP para referência do Kiro.

---

## v1.0.0 (03/05/2026)

### Componentes Criados
- `SnapButton` - Botões com variantes (primary, secondary, ghost, destructive)
- `SnapTabs` - Abas com underline de 8px
- `SnapBadge` - Badges para risco e tags
- `SnapSelect` - Select estilo accordion
- `SnapSearch` - Campo de busca
- `EntityNode` - Node de entidade para grafos (256px largura fixa)
- `CategoryLabel` - Labels de categoria com ícone

### Tokens Documentados
- Cores das verticais (Investigação, Inteligência, Cooperação, Infraestrutura, Administração)
- Tipografia (Inter para texto, JetBrains Mono para dados)
- Espaçamentos e border-radius
- Especificações de componentes

### Documentação Visual
- `/design-system` - Página principal do Design System
- `/design-system/snap-graph` - Documentação específica do SNAP Graph

### Use Case Documentado
- **Descoberta de Vínculo Oculto**: Cenário base para protótipo Kiro
  - Entidades: Techbiz, Inspect, Luiz Henrique, Telefone
  - Conexões verticais e ortogonais
  - Highlight de vínculo descoberto (outline branco + linha branca)

---

## Arquivos para o Kiro

```
components/snap/      → Componentes SNAP
lib/snap-tokens.ts    → Design tokens  
lib/utils.ts          → Helper cn()
```

---

## Próximas Versões

_Registrar aqui as alterações futuras antes de enviar ao Kiro._
