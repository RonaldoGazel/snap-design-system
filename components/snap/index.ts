/**
 * SNAP Design System Components
 * 
 * Componentes reutilizáveis que encapsulam todas as regras do design system SNAP.
 * 
 * Verticais do Ecossistema SNAP:
 * - Investigação: Coral (#FE473C)
 * - Inteligência: Bordô (#72284B) <- Vertical ativa
 * - Cooperação: Grey Ahead (#889EA3)
 * - Infraestrutura: Petroleum Blue (#287266)
 * - Administração: Deep Gray Blue (#333540)
 * 
 * Para usar em outro projeto (ex: Kiro):
 * 1. Copie a pasta /components/snap/
 * 2. Copie o arquivo /lib/snap-tokens.ts
 * 3. Certifique-se de ter as dependências: class-variance-authority, lucide-react
 * 4. Configure as fontes Cygnito Mono e Inter Tight no seu projeto
 * 5. Para mudar a vertical ativa, edite activeVertical em snap-tokens.ts
 */

// Tokens e Verticais
export {
  verticals,
  activeVertical,
  colors,
  typography,
  spacing,
  borders,
  components,
  animations,
  wcag,
  snapTokens,
  type SnapTokens,
  type Vertical,
} from "@/lib/snap-tokens"

// Badge
export { 
  SnapBadge, 
  RiskBadge, 
  StatusBadge, 
  CategoryTag,
  type SnapBadgeProps,
} from "./snap-badge"

// Button
export { 
  SnapButton, 
  SnapButtonGroup,
  snapButtonVariants,
  type SnapButtonProps,
} from "./snap-button"

// Card
export {
  SnapCard,
  SnapCardHeader,
  SnapCardTitle,
  SnapCardSeparator,
  SnapCardContent,
  SnapCardHighlight,
  SnapCardField,
  SnapCardFields,
  SnapCardFooter,
} from "./snap-card"

// Modal
export {
  SnapModal,
  SnapModalOverlay,
  SnapModalHeader,
  SnapModalContent,
  SnapModalFooter,
  SnapModalInline,
} from "./snap-modal"

// Tabs
export {
  SnapTabs,
  SnapTabsList,
  SnapTabsTrigger,
  SnapTabsContent,
} from "./snap-tabs"

// Select
export { SnapSelect } from "./snap-select"

// Entity Links
export {
  SnapEntityLink,
  PessoaLink,
  EnderecoLink,
  VeiculoLink,
  EmpresaLink,
} from "./snap-entity-link"
