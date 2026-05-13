"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Shield,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Settings,
  ClipboardList,
  Building,
  UsersRound,
  Mail,
  Users,
  X,
  Check,
  Heart
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapButton } from "@/components/snap/snap-button"
import { SnapModal, SnapModalHeader, SnapModalContent, SnapModalFooter } from "@/components/snap/snap-modal"
import { SnapPagination } from "@/components/snap/snap-pagination"
import { SnapSelect } from "@/components/snap/snap-select"

/**
 * TELA: Papéis (Listagem)
 * Vertical: Administração (#333540)
 * 
 * TEMPLATE PADRÃO OURO - Copiado de Grupos/Usuários
 * - SnapHeader com breadcrumb
 * - Sidebar: top 90px, marginLeft 32px, height calc(100vh - 230px)
 * - Main: marginLeft 128px (32 + 64 + 32), py-8 pr-8
 */

const VERTICAL_COLOR = "#333540" // Deep Gray Blue - Administração

// Ícone de Link (corrente)
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// Ícone de Share
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

// Dados mockados para a tabela de papéis
const mockPapeis = [
  { 
    id: "1",
    nome: "platform-admin", 
    tipo: "Plataforma",
    permissoes: 30,
    versao: 1,
    criadoEm: "5/12/26, 6:37 PM"
  },
  { 
    id: "2",
    nome: "org-admin", 
    tipo: "Serviço",
    permissoes: 80,
    versao: 1,
    criadoEm: "5/12/26, 6:37 PM"
  },
  { 
    id: "3",
    nome: "investigator", 
    tipo: "Serviço",
    permissoes: 24,
    versao: 1,
    criadoEm: "5/12/26, 6:37 PM"
  },
  { 
    id: "4",
    nome: "viewer", 
    tipo: "Serviço",
    permissoes: 7,
    versao: 1,
    criadoEm: "5/12/26, 6:37 PM"
  },
]

// Organizações disponíveis
const organizacoesDisponiveis = [
  "SNAP (Minha Organização)",
  "Organização Alpha",
  "Organização Beta"
]

export default function PapeisPage() {
  const router = useRouter()
  
  // Estado da sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarContentVisible, setSidebarContentVisible] = useState(false)
  const [inteligenciaExpanded, setInteligenciaExpanded] = useState(false)
  const [administracaoExpanded, setAdministracaoExpanded] = useState(true)
  
  // Estado do seletor de organização
  const [orgSelectOpen, setOrgSelectOpen] = useState(false)
  const [orgSelecionada, setOrgSelecionada] = useState("SNAP (Minha Organização)")
  
  // Estado do modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [novoPapelNome, setNovoPapelNome] = useState("")
  const [novoPapelTipo, setNovoPapelTipo] = useState("servico")

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // Handlers da sidebar
  const handleSidebarOpen = () => {
    setSidebarOpen(true)
    setTimeout(() => setSidebarContentVisible(true), 100)
  }

  const handleSidebarClose = () => {
    setSidebarContentVisible(false)
    setTimeout(() => setSidebarOpen(false), 100)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ============================================
          HEADER: SnapHeader padrão
          - Logo SNAP alinhado com conteúdo (marginLeft: 128px)
          - Breadcrumb abaixo da faixa colorida
          ============================================ */}
      <SnapHeader
        vertical="administracao"
        breadcrumb={[{ label: "Papéis" }]}
        userName="Analista de Contrainteligência"
        userRole="Administrador"
        userInitials="VD"
        notificationCount={35}
      />

      {/* ============================================
          LAYOUT: SIDEBAR + CONTEÚDO
          Medidas EXATAS copiadas de Usuários:
          - Sidebar: top 90px, marginLeft 32px, width 64px/280px
          - Height: calc(100vh - 230px)
          - Main: marginLeft 128px (32 + 64 + 32)
          ============================================ */}
      <div className="flex flex-1">
        {/* ============================================
            SIDEBAR: Navegação lateral
            - Position absolute para não empurrar conteúdo
            - Expande ao hover, colapsa ao sair
            ============================================ */}
        <nav
          onMouseEnter={handleSidebarOpen}
          onMouseLeave={handleSidebarClose}
          className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-card dark:bg-[#101010]"
          style={{ 
            top: '90px',
            marginLeft: '32px',
            width: sidebarOpen ? '280px' : '64px',
            minWidth: sidebarOpen ? '280px' : '64px',
            height: 'calc(100vh - 230px)',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.25)' : 'none'
          }}
        >
          {/* Itens fixos do topo */}
          <Link 
            href="/design-system/inteligencia"
            className="flex items-center gap-4 text-text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            style={{ paddingLeft: '20px', height: '48px' }}
          >
            <UsersRound className="w-6 h-6 shrink-0" />
            {sidebarContentVisible && <span className="font-sans text-sm">Grafo</span>}
          </Link>
          
          <Link
            href="/design-system/inteligencia"
            className="flex items-center gap-4 text-text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            style={{ paddingLeft: '20px', height: '48px' }}
          >
            <Heart className="w-6 h-6 shrink-0" />
            {sidebarContentVisible && <span className="font-sans text-sm">Favoritos</span>}
          </Link>

          <Link
            href="/design-system/inteligencia"
            className="flex items-center gap-4 text-text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            style={{ paddingLeft: '20px', height: '48px' }}
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {sidebarContentVisible && <span className="font-sans text-sm">Busca</span>}
          </Link>

          {/* Área de seções expansíveis - com scroll */}
          <div className="flex-1 overflow-y-auto mt-4">
            {/* Seção Inteligência */}
            <div>
              <button
                onClick={() => setInteligenciaExpanded(!inteligenciaExpanded)}
                className="flex items-center justify-between w-full text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                style={{ paddingLeft: '20px', paddingRight: '16px', height: '48px' }}
              >
                <div className="flex items-center gap-4">
                  <Shield className="w-6 h-6 shrink-0" style={{ color: '#72284B' }} />
                  {sidebarContentVisible && (
                    <span className="font-sans text-sm font-medium" style={{ color: '#72284B' }}>
                      Inteligência
                    </span>
                  )}
                </div>
                {sidebarContentVisible && (
                  inteligenciaExpanded ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {inteligenciaExpanded && sidebarContentVisible && (
                <div className="ml-[52px] border-l border-border">
                  <Link 
                    href="/design-system/inteligencia"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Relatórios
                  </Link>
                  <Link 
                    href="/design-system/inteligencia"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Análises
                  </Link>
                </div>
              )}
            </div>

            {/* Seção Administração */}
            <div>
              <button
                onClick={() => setAdministracaoExpanded(!administracaoExpanded)}
                className="flex items-center justify-between w-full text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
                style={{ paddingLeft: '20px', paddingRight: '16px', height: '48px' }}
              >
                <div className="flex items-center gap-4">
                  <Lock className="w-6 h-6 shrink-0" style={{ color: VERTICAL_COLOR }} />
                  {sidebarContentVisible && (
                    <span className="font-sans text-sm font-medium" style={{ color: VERTICAL_COLOR }}>
                      Administração
                    </span>
                  )}
                </div>
                {sidebarContentVisible && (
                  administracaoExpanded ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {administracaoExpanded && sidebarContentVisible && (
                <div className="ml-[52px] border-l border-border">
                  <Link 
                    href="/design-system/administracao/usuarios"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Usuários
                  </Link>
                  <Link 
                    href="/design-system/administracao/grupos"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <UsersRound className="w-4 h-4" />
                    Grupos
                  </Link>
                  <Link 
                    href="/design-system/administracao/papeis"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-foreground font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Papéis
                  </Link>
                  <Link 
                    href="/design-system/administracao"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Convites
                  </Link>
                  <Link 
                    href="/design-system/administracao"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Auditoria
                  </Link>
                  <Link 
                    href="/design-system/administracao"
                    className="flex items-center gap-3 py-2 pl-4 text-sm font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    <Building className="w-4 h-4" />
                    Organizações
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Item fixo do rodapé */}
          <div className="mt-auto pt-4 border-t border-border">
            <Link
              href="/design-system"
              className="flex items-center gap-4 text-text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              style={{ paddingLeft: '20px', height: '48px' }}
            >
              <Settings className="w-6 h-6 shrink-0" />
              {sidebarContentVisible && <span className="font-sans text-sm">Configurações</span>}
            </Link>
          </div>
        </nav>

        {/* ============================================
            CONTEÚDO PRINCIPAL
            marginLeft: 128px = 32px (margem) + 64px (sidebar) + 32px (gap)
            ============================================ */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* ============================================
              SELETOR DE ORGANIZAÇÃO (abaixo do breadcrumb)
              ============================================ */}
          <div className="mb-6">
            <SnapSelect
              value={orgSelecionada}
              onValueChange={setOrgSelecionada}
              options={organizacoesDisponiveis.map(org => ({ value: org, label: org }))}
              placeholder="Selecione uma organização"
              className="w-[300px]"
            />
          </div>

          {/* ============================================
              CABEÇALHO: Ícone + Título + Botão
              Medidas do PADRÃO OURO (Usuários):
              - Ícone: w-8 h-8, cor da vertical
              - Gap ícone/título: gap-3
              - Título: font-title text-2xl UPPERCASE
              - SEM underline
              ============================================ */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8" style={{ color: VERTICAL_COLOR }} />
              <h1 className="font-title text-2xl text-foreground">PAPÉIS</h1>
            </div>
            
            <SnapButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              className="!bg-[#333540] hover:!bg-[#252730]"
              onClick={() => setShowCreateModal(true)}
            >
              Criar Papel
            </SnapButton>
          </div>

          {/* ============================================
              TABELA DE PAPÉIS
              Padrão: table semântico, altura 48px, sem bg no header
              Colunas: NOME, TIPO, PERMISSÕES, VERSÃO, CRIADO EM
              ============================================ */}
          <div className="rounded-xl border border-border overflow-hidden mb-6">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b border-border" style={{ height: "48px" }}>
                  <th 
                    className="text-left px-4 text-text-muted font-medium text-sm font-sans uppercase" 
                    style={{ height: "48px", verticalAlign: "middle" }}
                  >
                    Nome
                  </th>
                  <th 
                    className="text-left px-4 text-text-muted font-medium text-sm font-sans uppercase" 
                    style={{ height: "48px", verticalAlign: "middle" }}
                  >
                    Tipo
                  </th>
                  <th 
                    className="text-left px-4 text-text-muted font-medium text-sm font-sans uppercase" 
                    style={{ height: "48px", verticalAlign: "middle" }}
                  >
                    Permissões
                  </th>
                  <th 
                    className="text-left px-4 text-text-muted font-medium text-sm font-sans uppercase" 
                    style={{ height: "48px", verticalAlign: "middle" }}
                  >
                    Versão
                  </th>
                  <th 
                    className="text-left px-4 text-text-muted font-medium text-sm font-sans uppercase" 
                    style={{ height: "48px", verticalAlign: "middle" }}
                  >
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPapeis.map((papel) => (
                  <tr 
                    key={papel.id} 
                    className="border-b border-border last:border-b-0 hover:bg-card-hover transition-colors cursor-pointer"
                    style={{ height: "48px" }}
                    onClick={() => router.push(`/design-system/administracao/papeis/${papel.id}`)}
                  >
                    <td 
                      className="px-4 text-foreground text-sm font-sans" 
                      style={{ height: "48px", verticalAlign: "middle" }}
                    >
                      {papel.nome}
                    </td>
                    <td 
                      className="px-4 text-text-secondary text-sm font-sans" 
                      style={{ height: "48px", verticalAlign: "middle" }}
                    >
                      {papel.tipo}
                    </td>
                    <td 
                      className="px-4 text-text-secondary text-sm font-sans" 
                      style={{ height: "48px", verticalAlign: "middle" }}
                    >
                      {papel.permissoes}
                    </td>
                    <td 
                      className="px-4 text-text-secondary text-sm font-sans" 
                      style={{ height: "48px", verticalAlign: "middle" }}
                    >
                      {papel.versao}
                    </td>
                    <td 
                      className="px-4 text-text-secondary text-sm font-sans" 
                      style={{ height: "48px", verticalAlign: "middle" }}
                    >
                      {papel.criadoEm}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================
              PAGINAÇÃO
              ============================================ */}
          <SnapPagination 
            currentPage={currentPage} 
            totalPages={1}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </main>
      </div>

      {/* ============================================
          MODAL CRIAR PAPEL
          Estrutura: SnapModalFooter FORA do SnapModalContent
          ============================================ */}
      <SnapModal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <SnapModalHeader 
          icon={<Heart className="w-5 h-5" style={{ color: VERTICAL_COLOR }} />}
          title="Criar Papel" 
          onClose={() => setShowCreateModal(false)} 
        />
        <SnapModalContent>
          {/* Nome do Papel */}
          <div className="mb-4">
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Nome do Papel <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={novoPapelNome}
              onChange={(e) => setNovoPapelNome(e.target.value)}
              placeholder="Digite o nome do papel"
              className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground font-sans text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tipo do Papel */}
          <div className="mb-4">
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Tipo <span className="text-error">*</span>
            </label>
            <SnapSelect
              value={novoPapelTipo}
              onValueChange={setNovoPapelTipo}
              options={[
                { value: "plataforma", label: "Plataforma" },
                { value: "servico", label: "Serviço" }
              ]}
              placeholder="Selecione o tipo"
            />
          </div>
        </SnapModalContent>
        <SnapModalFooter>
          <SnapButton
            variant="ghost"
            size="modal"
            icon={<X className="w-4 h-4" />}
            onClick={() => setShowCreateModal(false)}
          >
            Cancelar
          </SnapButton>
          <SnapButton
            variant="primary"
            size="modal"
            icon={<Check className="w-4 h-4" />}
            className="!bg-[#333540] hover:!bg-[#252730]"
            onClick={() => setShowCreateModal(false)}
          >
            Criar
          </SnapButton>
        </SnapModalFooter>
      </SnapModal>
    </div>
  )
}
