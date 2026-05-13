"use client"

import { useState } from "react"
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
  Check
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapButton } from "@/components/snap/snap-button"
import { SnapModal, SnapModalHeader, SnapModalContent, SnapModalFooter } from "@/components/snap/snap-modal"
import { SnapPagination } from "@/components/snap/snap-pagination"

/**
 * TELA: Grupos (Listagem)
 * Vertical: Administração (#333540)
 * 
 * TEMPLATE PADRÃO OURO - Copiado de Usuários
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

// Dados mockados para a tabela de grupos
const mockGrupos = [
  { 
    id: "1",
    nome: "Diretoria Geral", 
    criadoEm: "5/12/26, 6:38 PM",
    atualizadoEm: "5/12/26, 6:38 PM"
  },
  { 
    id: "2",
    nome: "Analistas", 
    criadoEm: "5/10/26, 2:15 PM",
    atualizadoEm: "5/11/26, 9:30 AM"
  },
  { 
    id: "3",
    nome: "Operadores", 
    criadoEm: "5/08/26, 10:00 AM",
    atualizadoEm: "5/09/26, 4:45 PM"
  },
  { 
    id: "4",
    nome: "Supervisores", 
    criadoEm: "5/05/26, 8:30 AM",
    atualizadoEm: "5/12/26, 11:20 AM"
  },
]

// Organizações disponíveis
const organizacoesDisponiveis = [
  "SNAP (Minha Organização)",
  "Organização Alpha",
  "Organização Beta"
]

export default function GruposPage() {
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
  const [novoGrupoNome, setNovoGrupoNome] = useState("")

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
        breadcrumb={[{ label: "Grupos" }]}
        userName="SNAP"
        userRole="SNAP"
        userInitials="PA"
        notificationCount={3}
      />

      {/* ============================================
          LAYOUT: SIDEBAR + CONTEÚDO
          Medidas EXATAS copiadas de Usuários:
          - Sidebar: top 90px, marginLeft 32px, width 64px/280px
          - Height: calc(100vh - 230px)
          - Main: marginLeft 128px (32 + 64 + 32)
          ============================================ */}
      <div className="flex flex-1">
        {/* Sidebar - Posição fixa, hover para expandir */}
        <aside 
          onMouseEnter={handleSidebarOpen}
          onMouseLeave={handleSidebarClose}
          className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-card dark:bg-[#0C0C0C]"
          style={{ 
            top: '90px',
            marginLeft: '32px',
            width: sidebarOpen ? '280px' : '64px',
            minWidth: sidebarOpen ? '280px' : '64px',
            height: 'calc(100vh - 230px)',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.25)' : 'none'
          }}
        >
          {/* Sidebar Fechada */}
          {!sidebarOpen && (
            <>
              <nav className="flex-1 flex flex-col items-center gap-2">
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <Shield className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: VERTICAL_COLOR }}>
                  <Lock className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                  <ShareIcon className="w-5 h-5" />
                </button>
              </nav>
              <div className="w-8 mx-auto my-2 border-t border-border" />
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity mx-auto text-muted-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Sidebar Aberta */}
          {sidebarOpen && sidebarContentVisible && (
            <div className="flex flex-col h-full animate-in fade-in duration-150">
              {/* Vertical: Inteligência */}
              <div className="mb-2">
                <button 
                  onClick={() => setInteligenciaExpanded(!inteligenciaExpanded)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ paddingLeft: '10px', paddingRight: '16px' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 flex justify-center">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-sans text-sm font-medium text-muted-foreground">Inteligência</span>
                  </div>
                  {inteligenciaExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {inteligenciaExpanded && (
                  <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <UsersRound className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Pessoas</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Documentos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Fluxos de Trabalho</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Vertical: Administração - ATIVA */}
              <div className="mb-2">
                <button 
                  onClick={() => setAdministracaoExpanded(!administracaoExpanded)}
                  className="w-full flex items-center justify-between py-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ paddingLeft: '10px', paddingRight: '16px' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 flex justify-center">
                      <Lock className="w-5 h-5" style={{ color: VERTICAL_COLOR }} />
                    </div>
                    <span className="font-sans text-sm font-medium" style={{ color: VERTICAL_COLOR }}>Administração</span>
                  </div>
                  {administracaoExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {administracaoExpanded && (
                  <div className="mt-1 space-y-1" style={{ paddingLeft: '54px', paddingRight: '12px' }}>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Usuários</span>
                    </button>
                    {/* Grupos - PÁGINA ATUAL = fundo da cor da vertical */}
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: VERTICAL_COLOR }}>
                      <UsersRound className="w-4 h-4 text-white" />
                      <span className="font-sans text-sm text-white">Grupos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Papéis</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Convites</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Auditoria</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Organizações</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1" />
              <div className="mx-3 my-2 border-t border-border" />
              <button 
                className="flex items-center gap-3 py-3 rounded-lg hover:bg-muted transition-colors"
                style={{ paddingLeft: '10px' }}
              >
                <div className="w-11 flex justify-center">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-sans text-sm text-muted-foreground">Configurações</span>
              </button>
            </div>
          )}
        </aside>

        {/* ============================================
            ÁREA DE CONTEÚDO - MIOLO
            marginLeft: 128px (32 + 64 + 32)
            ============================================ */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* Header: Ícone + Título + Select de Organização + Botão Criar */}
          <div className="flex items-center justify-between mb-8">
            {/* Lado esquerdo: Ícone + Título + Select */}
            <div className="flex items-center gap-4">
              <UsersRound className="w-6 h-6" style={{ color: VERTICAL_COLOR }} />
              <h1 className="font-title text-2xl text-foreground">GRUPOS</h1>
              
              {/* Seletor de Organização - ao lado do título */}
              <div className="relative ml-4">
                <button
                  onClick={() => setOrgSelectOpen(!orgSelectOpen)}
                  className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-card hover:bg-card-hover transition-colors min-w-[220px]"
                >
                  <span className="font-sans text-sm text-foreground">
                    {orgSelecionada}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ml-2 ${orgSelectOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {orgSelectOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden min-w-[220px]">
                    {organizacoesDisponiveis.map((org) => (
                      <button
                        key={org}
                        onClick={() => { setOrgSelecionada(org); setOrgSelectOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm font-sans hover:bg-muted transition-colors ${
                          orgSelecionada === org ? 'text-foreground bg-muted' : 'text-text-muted'
                        }`}
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Lado direito: Botão Criar */}
            <SnapButton
              variant="primary"
              size="default"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Criar Grupo
            </SnapButton>
          </div>

          {/* Tabela de Grupos */}
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header da tabela */}
            <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-border bg-muted/30">
              <span className="font-sans text-sm font-medium text-foreground">Nome</span>
              <span className="font-sans text-sm font-medium text-foreground">Criado em</span>
              <span className="font-sans text-sm font-medium text-foreground">Atualizado em</span>
            </div>
            
            {/* Linhas da tabela */}
            {mockGrupos.map((grupo, index) => (
              <div 
                key={grupo.id} 
                className={`grid grid-cols-3 gap-4 px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  index !== mockGrupos.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="font-sans text-sm text-foreground">{grupo.nome}</span>
                <span className="font-sans text-sm text-text-secondary">{grupo.criadoEm}</span>
                <span className="font-sans text-sm text-text-secondary">{grupo.atualizadoEm}</span>
              </div>
            ))}
          </div>

          {/* Paginação - usando componente SnapPagination */}
          <SnapPagination
            currentPage={1}
            totalPages={5}
            onPageChange={(page) => console.log("Página:", page)}
          />
        </main>
      </div>

      {/* ============================================
          MODAL: Criar Grupo
          ============================================ */}
      <SnapModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <SnapModalHeader 
          title="Criar Grupo" 
          onClose={() => setShowCreateModal(false)} 
        />
        <SnapModalContent>
          <div className="space-y-4">
            <div>
              <label className="block font-sans text-sm text-text-secondary mb-2">
                Nome do grupo
              </label>
              <input 
                type="text"
                value={novoGrupoNome}
                onChange={(e) => setNovoGrupoNome(e.target.value)}
                placeholder="Ex: Equipe de Análise"
                className="w-full px-4 py-3 rounded-lg border border-border bg-muted dark:bg-[#000000] font-sans text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>
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
            onClick={() => setShowCreateModal(false)}
          >
            Criar
          </SnapButton>
        </SnapModalFooter>
      </SnapModal>
    </div>
  )
}
