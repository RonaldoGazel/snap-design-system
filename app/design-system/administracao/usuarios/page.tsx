"use client"

import { useState } from "react"
import { 
  Plus, 
  Eye,
  Pencil,
  Trash2, 
  Key,
  Ban,
  Lock,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Users,
  FileText,
  Settings,
  Search,
  ClipboardList,
  UserPlus,
  Building,
  UsersRound,
  Mail,
  Home,
  X,
  ChevronLeft,
  Copy,
  Clock,
  User,
  EyeOff
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapButton } from "@/components/snap/snap-button"
import { SnapModal, SnapModalHeader, SnapModalContent, SnapModalFooter } from "@/components/snap/snap-modal"
import { SnapSelect } from "@/components/snap/snap-select"
import { Check } from "lucide-react"

/**
 * TELA: Usuários (Listagem + Detalhe)
 * Vertical: Administração (#333540)
 * 
 * PADRÃO OURO seguido:
 * - Header com logo SNAP + breadcrumb + linha colorida
 * - Sidebar colapsada (64px) com ícones específicos
 * - Padding de 32px (p-8) na área de conteúdo
 * - Tabela seguindo regras do design system
 * - Paginação com "Página anterior" e "Próxima página"
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

// Dados mockados para a tabela
const mockUsers = [
  { 
    id: "1",
    nome: "admin", 
    email: "admin@snap.local", 
    status: "Ativo",
    nivelAcesso: 1,
    idAuthExterna: "ac499693-acad-4db8-b894-f100670accb6",
    organizacao: "96c84e31-0f15-4f1f-aa06-810679572b1e",
    versaoIdentidade: 1,
    criadoEm: "May 7, 2026, 2:17:14 PM",
    atualizadoEm: "May 7, 2026, 2:19:31 PM",
    grupos: ["Diretoria Geral"],
    permissoes: [
      "*: admin", "*: admin_safe_mode", "*: approve", "*: assign", 
      "*: bulk_approve", "*: bulk_reassign", "*: bulk_transition", "*: cancel",
      "*: claim", "*: comment", "*: create", "*: delete", "*: edit", "*: execute",
      "*: export", "*: external_dispatch", "*: formalize", "*: manage", "*: publish",
      "*: read", "*: reassign", "*: receive", "*: reject", "*: release", "*: request",
      "*: revoke", "*: transition", "*: update", "*: write",
      "platform_audit_log: read"
    ]
  },
  { 
    id: "2",
    nome: "Maria Santos", 
    email: "maria.santos@snap.local", 
    status: "Ativo",
    nivelAcesso: 2,
    idAuthExterna: "bc599693-bcad-5db8-c894-g200670bccb7",
    organizacao: "96c84e31-0f15-4f1f-aa06-810679572b1e",
    versaoIdentidade: 1,
    criadoEm: "May 5, 2026, 10:30:00 AM",
    atualizadoEm: "May 6, 2026, 09:15:22 AM",
    grupos: ["Analistas"],
    permissoes: ["*: read", "*: comment", "*: create"]
  },
  { 
    id: "3",
    nome: "Pedro Costa", 
    email: "pedro.costa@snap.local", 
    status: "Inativo",
    nivelAcesso: 3,
    idAuthExterna: "cd699693-cdad-6db8-d894-h300670cccb8",
    organizacao: "96c84e31-0f15-4f1f-aa06-810679572b1e",
    versaoIdentidade: 2,
    criadoEm: "Apr 20, 2026, 3:45:00 PM",
    atualizadoEm: "May 1, 2026, 11:00:00 AM",
    grupos: ["Operadores"],
    permissoes: ["*: read"]
  },
  { 
    id: "4",
    nome: "Ana Oliveira", 
    email: "ana.oliveira@snap.local", 
    status: "Bloqueado",
    nivelAcesso: 2,
    idAuthExterna: "de799693-dead-7db8-e894-i400670dccb9",
    organizacao: "96c84e31-0f15-4f1f-aa06-810679572b1e",
    versaoIdentidade: 1,
    criadoEm: "Mar 15, 2026, 9:00:00 AM",
    atualizadoEm: "May 3, 2026, 2:30:00 PM",
    grupos: ["Supervisores"],
    permissoes: ["*: read", "*: approve", "*: reject"]
  },
  { 
    id: "5",
    nome: "Carlos Ferreira", 
    email: "carlos.ferreira@snap.local", 
    status: "Ativo",
    nivelAcesso: 1,
    idAuthExterna: "ef899693-efad-8db8-f894-j500670eccba",
    organizacao: "96c84e31-0f15-4f1f-aa06-810679572b1e",
    versaoIdentidade: 1,
    criadoEm: "Feb 10, 2026, 11:00:00 AM",
    atualizadoEm: "May 2, 2026, 4:30:00 PM",
    grupos: ["Analistas"],
    permissoes: ["*: read", "*: comment"]
  },
]

type User = typeof mockUsers[0]

// Badge de Status
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Ativo": { bg: "bg-success", text: "text-white" },
    "Inativo": { bg: "bg-muted", text: "text-text-muted" },
    "Bloqueado": { bg: "bg-error", text: "text-white" },
  }
  const style = config[status] || config["Inativo"]
  
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-sans font-medium ${style.bg} ${style.text}`}>
      {status}
    </span>
  )
}

// Badge de Permissão
function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium border border-border text-text-secondary bg-transparent">
      {permission}
    </span>
  )
}

// Badge de Grupo
function GroupBadge({ group }: { group: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium border border-border text-foreground bg-transparent">
      {group}
    </span>
  )
}

export default function UsuariosPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const [statusSelectOpen, setStatusSelectOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Estado do select de grupos (visão)
  const [grupoSelecionado, setGrupoSelecionado] = useState('Visão plataforma')
  const [grupoSelectOpen, setGrupoSelectOpen] = useState(false)
  const gruposDisponiveis = ['Visão plataforma', 'Administradores', 'Analistas', 'Operadores', 'Convidados']
  
  // Estados da sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarContentVisible, setSidebarContentVisible] = useState(false)
  const [inteligenciaExpanded, setInteligenciaExpanded] = useState(true)
  const [administracaoExpanded, setAdministracaoExpanded] = useState(true)
  
  // Estados dos modais
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    email: '',
    nomeExibicao: '',
    nivelAcesso: 'restricted'
  })
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({
    nomeUsuario: '',
    nomeExibicao: '',
    email: '',
    senha: '',
    nivelAcesso: 'public',
    papel: '',
    grupo: ''
  })

  // Delay para mostrar conteúdo após sidebar expandir
  const handleSidebarOpen = () => {
    setSidebarOpen(true)
    setTimeout(() => setSidebarContentVisible(true), 200)
  }
  
  const handleSidebarClose = () => {
    setSidebarContentVisible(false)
    setTimeout(() => setSidebarOpen(false), 50)
  }

  const filteredUsers = mockUsers.filter(user => 
    statusFilter === "" || user.status === statusFilter
  )

  // ============================================
  // TELA DE LISTAGEM
  // ============================================
  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header - Usando componente SnapHeader */}
        <SnapHeader 
          vertical="administracao"
          breadcrumb={[{ label: "Usuários" }]}
        />

        {/* ============================================
            LAYOUT: SIDEBAR + CONTEÚDO
            Medidas:
            - Sidebar fechada: 64px / aberta: 280px
            - Margem esquerda: 32px, fundo arredondado
            - Gap sidebar → conteúdo: 51px
            - Sidebar aberta: position absolute (overlay), drop-shadow
            - Hover para abrir/fechar
            - Ícones idle: #717171, página atual: cor da vertical
            ============================================ */}
        <div className="flex flex-1">
          {/* Sidebar - Posição fixa, hover para expandir */}
          <aside 
            onMouseEnter={handleSidebarOpen}
            onMouseLeave={handleSidebarClose}
            className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-card dark:bg-[#0C0C0C]"
            style={{ 
              marginLeft: '32px',
              width: sidebarOpen ? '280px' : '64px',
              minWidth: sidebarOpen ? '280px' : '64px',
              height: 'calc(100vh - 140px)',
              boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.25)' : 'none'
            }}
          >
            {/* Sidebar Fechada */}
            {!sidebarOpen && (
              <>
                <nav className="flex-1 flex flex-col items-center gap-2">
                  {/* Inteligência - idle */}
                  <button className="p-3 rounded-lg hover:opacity-80 transition-opacity text-muted-foreground">
                    <Shield className="w-5 h-5" />
                  </button>
                  {/* Administração - PÁGINA ATUAL = cor da vertical */}
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

            {/* Sidebar Aberta - conteúdo aparece após expansão */}
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
                      {/* Usuários - PÁGINA ATUAL = fundo da cor da vertical */}
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: VERTICAL_COLOR }}>
                        <Users className="w-4 h-4 text-white" />
                        <span className="font-sans text-sm text-white">Usuários</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <UsersRound className="w-4 h-4 text-muted-foreground" />
                        <span className="font-sans text-sm text-muted-foreground">Grupos</span>
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

                {/* Spacer */}
                <div className="flex-1" />

                {/* Linha separadora */}
                <div className="mx-3 my-2 border-t border-border" />

                {/* Configurações */}
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

          {/* Área de Conteúdo - margem fixa (sidebar sempre no lugar, conteúdo não move) */}
          <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 51}px` }}>
            {/* Header: Título + Filtros + Botão */}
            <div className="flex items-center justify-between mb-6">
              {/* Título com ícone + Select de Grupo */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8" style={{ color: VERTICAL_COLOR }} />
                  <h1 className="font-title text-2xl text-foreground">USUÁRIOS</h1>
                </div>
                
                {/* Select de Grupo/Visão - dropdown flutuante (z-50) */}
                <div className="relative">
                  <button
                    onClick={() => setGrupoSelectOpen(!grupoSelectOpen)}
                    className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-card hover:bg-card-hover transition-colors min-w-[180px]"
                  >
                    <span className="font-sans text-sm text-text-secondary">
                      {grupoSelecionado}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${grupoSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {grupoSelectOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                      {gruposDisponiveis.map((grupo) => (
                        <button
                          key={grupo}
                          onClick={() => { setGrupoSelecionado(grupo); setGrupoSelectOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm font-sans hover:bg-muted transition-colors ${
                            grupoSelecionado === grupo ? 'text-foreground bg-muted' : 'text-text-muted'
                          }`}
                        >
                          {grupo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filtros e Ação */}
              <div className="flex items-center gap-4">
                {/* Select de Status */}
                <div className="relative">
                  <button
                    onClick={() => setStatusSelectOpen(!statusSelectOpen)}
                    className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-card hover:bg-card-hover transition-colors min-w-[120px]"
                  >
                    <span className="font-sans text-sm text-text-secondary">
                      {statusFilter === "" ? "Status" : statusFilter}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${statusSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {statusSelectOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      {["", "Ativo", "Inativo", "Bloqueado"].map((option) => (
                        <button
                          key={option || "todos"}
                          onClick={() => { setStatusFilter(option); setStatusSelectOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm font-sans hover:bg-muted transition-colors ${
                            statusFilter === option ? 'text-foreground bg-muted' : 'text-text-muted'
                          }`}
                        >
                          {option === "" ? "Todos" : option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão Novo Usuário */}
                <SnapButton 
                  variant="primary" 
                  size="default"
                  icon={<Plus className="w-4 h-4" />}
                  className="!bg-[#333540] hover:!bg-[#252730]"
                  onClick={() => {
                    setCreateUserForm({
                      nomeUsuario: '',
                      nomeExibicao: '',
                      email: '',
                      senha: '',
                      nivelAcesso: 'public',
                      papel: '',
                      grupo: ''
                    })
                    setShowCreateUserModal(true)
                  }}
                >
                  Novo usuário
                </SnapButton>
              </div>
            </div>

            {/* Tabela - com borda arredondada */}
            <div className="rounded-xl border border-border overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Nome</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Email</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Status</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Nível de Acesso</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-sm font-sans">Criado em</th>
                    <th className="text-right py-3 px-4 text-text-muted font-medium text-sm font-sans">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b border-border last:border-b-0 hover:bg-card-hover transition-colors cursor-pointer"
                      style={{ height: "48px" }}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-3 px-4 text-foreground text-sm font-sans">{user.nome}</td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{user.email}</td>
                      <td className="py-3 px-4"><StatusBadge status={user.status} /></td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{user.nivelAcesso}</td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-sans">{user.criadoEm}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Eye className="w-4 h-4 text-text-muted" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Pencil className="w-4 h-4 text-text-muted" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Trash2 className="w-4 h-4" style={{ color: VERTICAL_COLOR }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação - Exatamente igual ao padrão do Design System */}
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-foreground font-sans">
                <ArrowLeft className="w-4 h-4" />
                Página anterior
              </button>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 text-sm text-text-muted font-sans">1</span>
                <span className="px-2 text-text-muted">...</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">3</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">4</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">5</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">6</span>
                <span className="px-3 py-1 text-sm text-foreground font-bold font-sans bg-muted rounded">7</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">8</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">9</span>
                <span className="px-2 text-text-muted">...</span>
                <span className="px-3 py-1 text-sm text-text-muted font-sans">25</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-foreground font-sans">
                Próxima página
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </main>
        </div>

        {/* Modal Criar Usuário - Layout 2 Colunas com Seções */}
        <SnapModal open={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} size="xl">
          <SnapModalHeader 
            icon={<UserPlus className="w-5 h-5" />}
            title="Criar Usuário" 
            onClose={() => setShowCreateUserModal(false)} 
          />
          <SnapModalContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Coluna Esquerda - Identificação */}
              <div className="border border-border rounded-lg p-4">
                {/* Header da Seção */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <User className="w-4 h-4 text-text-muted" />
                  <span className="font-sans text-xs font-medium text-text-muted uppercase tracking-wider">Identificação</span>
                </div>
                
                {/* Campo Nome de Usuário */}
                <div className="mb-4">
                  <label className="block text-sm font-sans text-text-muted mb-2">Nome de Usuário <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={createUserForm.nomeUsuario}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, nomeUsuario: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
                    placeholder="Digite o nome de usuário"
                  />
                </div>
                
                {/* Campo Nome de Exibição */}
                <div className="mb-4">
                  <label className="block text-sm font-sans text-text-muted mb-2">Nome de Exibição <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={createUserForm.nomeExibicao}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, nomeExibicao: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
                    placeholder="Digite o nome de exibição"
                  />
                </div>
                
                {/* Campo Email */}
                <div>
                  <label className="block text-sm font-sans text-text-muted mb-2">Email <span className="text-error">*</span></label>
                  <input
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
                    placeholder="Digite o email"
                  />
                </div>
              </div>
              
              {/* Coluna Direita - Segurança + Acesso */}
              <div className="flex flex-col gap-6">
                {/* Seção Segurança */}
                <div className="border border-border rounded-lg p-4">
                  {/* Header da Seção */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <Lock className="w-4 h-4 text-text-muted" />
                    <span className="font-sans text-xs font-medium text-text-muted uppercase tracking-wider">Segurança</span>
                  </div>
                  
                  {/* Campo Senha */}
                  <div>
                    <label className="block text-sm font-sans text-text-muted mb-2">Senha <span className="text-error">*</span></label>
                    <div className="relative">
                      <input
                        type="password"
                        value={createUserForm.senha}
                        onChange={(e) => setCreateUserForm(prev => ({ ...prev, senha: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
                        placeholder="Digite a senha"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Seção Acesso */}
                <div className="border border-border rounded-lg p-4 flex-1">
                  {/* Header da Seção */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <Shield className="w-4 h-4 text-text-muted" />
                    <span className="font-sans text-xs font-medium text-text-muted uppercase tracking-wider">Acesso</span>
                  </div>
                  
                  {/* Nível de Acesso e Papel - lado a lado */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <SnapSelect
                      label="Nível de Acesso"
                      value={createUserForm.nivelAcesso}
                      onChange={(value) => setCreateUserForm(prev => ({ ...prev, nivelAcesso: value }))}
                      options={[
                        { value: 'public', label: 'Público' },
                        { value: 'restricted', label: 'Restrito' },
                        { value: 'elevated', label: 'Elevado' },
                        { value: 'admin', label: 'Administrador' }
                      ]}
                    />
                    <SnapSelect
                      label={<>Papel <span className="text-error">*</span></>}
                      value={createUserForm.papel}
                      onChange={(value) => setCreateUserForm(prev => ({ ...prev, papel: value }))}
                      placeholder="Selecione um papel"
                      options={[
                        { value: 'analista', label: 'Analista' },
                        { value: 'operador', label: 'Operador' },
                        { value: 'supervisor', label: 'Supervisor' },
                        { value: 'admin', label: 'Administrador' }
                      ]}
                    />
                  </div>
                  
                  {/* Grupo */}
                  <SnapSelect
                    label={<>Grupo <span className="text-error">*</span></>}
                    value={createUserForm.grupo}
                    onChange={(value) => setCreateUserForm(prev => ({ ...prev, grupo: value }))}
                    placeholder="Selecione um grupo"
                    options={[
                      { value: 'diretoria', label: 'Diretoria Geral' },
                      { value: 'analistas', label: 'Analistas' },
                      { value: 'operacoes', label: 'Operações' },
                      { value: 'suporte', label: 'Suporte' }
                    ]}
                  />
                </div>
              </div>
            </div>
            
            {/* Botões */}
            <SnapModalFooter withTopMargin>
              <SnapButton
                variant="solid"
                size="modal"
                icon={<Check className="w-4 h-4" />}
                className="bg-foreground text-background hover:opacity-90"
              >
                Criar
              </SnapButton>
              <SnapButton
                variant="outline"
                size="modal"
                icon={<X className="w-4 h-4" />}
                onClick={() => setShowCreateUserModal(false)}
              >
                Cancelar
              </SnapButton>
            </SnapModalFooter>
          </SnapModalContent>
        </SnapModal>
      </div>
    )
  }

  // ============================================
  // TELA DE DETALHE DO USUÁRIO
  // ============================================
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Usando componente SnapHeader */}
      <SnapHeader 
        vertical="administracao"
        breadcrumb={[
          { label: "Usuários", href: "#", onClick: () => setSelectedUser(null) },
          { label: selectedUser.nome }
        ]}
      />

      {/* Layout - Mesma estrutura da listagem */}
      <div className="flex flex-1">
        {/* Sidebar - Reutiliza a mesma sidebar da listagem */}
        <aside 
          onMouseEnter={handleSidebarOpen}
          onMouseLeave={handleSidebarClose}
          className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-card dark:bg-[#0C0C0C]"
          style={{ 
            marginLeft: '32px',
            width: sidebarOpen ? '280px' : '64px',
            minWidth: sidebarOpen ? '280px' : '64px',
            height: 'calc(100vh - 140px)',
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
                    {/* Usuários - PÁGINA ATUAL = fundo da cor da vertical */}
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg" 
                      style={{ backgroundColor: VERTICAL_COLOR }}
                      onClick={() => setSelectedUser(null)}
                    >
                      <Users className="w-4 h-4 text-white" />
                      <span className="font-sans text-sm text-white">Usuários</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                      <UsersRound className="w-4 h-4 text-muted-foreground" />
                      <span className="font-sans text-sm text-muted-foreground">Grupos</span>
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

              {/* Spacer */}
              <div className="flex-1" />

              {/* Linha separadora */}
              <div className="mx-3 my-2 border-t border-border" />

              {/* Configurações */}
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

        {/* Conteúdo - Mesmo padding e margem da listagem (py-8 = 32px top/bottom) */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 51}px` }}>
          {/* Voltar + Título - mt-[3px] compensa a diferença visual do botão circular vs ícone */}
          <div className="flex items-center justify-between mb-6 mt-[3px]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Voltar para lista de usuários"
                >
                  <ChevronLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <h1 className="font-title text-2xl text-foreground">DETALHE DO USUÁRIO</h1>
              </div>
            </div>
          </div>

          {/* Card de Dados - Design com Avatar */}
          <div className="bg-card dark:bg-[#141414] rounded-xl border border-border mb-6">
            {/* Linha 1: Avatar + Dados COM separadores verticais */}
            <div className="flex items-center p-6">
              {/* Avatar circular - maior */}
              <div className="w-[88px] h-[88px] rounded-full bg-muted dark:bg-[#0a0a0a] border border-border flex items-center justify-center flex-shrink-0">
                <span className="font-title text-2xl text-foreground">
                  {selectedUser.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              
              {/* SEM separador entre avatar e Nome/Email - apenas ml para espaçamento */}
              
              {/* Nome + Email */}
              <div className="w-[160px] ml-6">
                <label className="block text-sm font-sans text-text-muted mb-1">Nome de Exibição</label>
                <span className="block font-sans text-base text-foreground font-semibold mb-3">{selectedUser.nome}</span>
                <label className="block text-sm font-sans text-text-muted mb-1">Email</label>
                <span className="block font-sans text-base text-foreground">{selectedUser.email}</span>
              </div>
              
              {/* Separador */}
              <div className="w-px h-16 bg-border mx-6" />
              
              {/* Status - botão largo */}
              <div className="w-[100px]">
                <label className="block text-sm font-sans text-text-muted mb-2">Status</label>
                <span className={`inline-flex items-center justify-center w-full px-4 py-1.5 rounded-full text-sm font-sans font-medium ${
                  selectedUser.status === 'Ativo' 
                    ? 'bg-[#22c55e] text-white' 
                    : 'bg-[#ef4444] text-white'
                }`}>
                  {selectedUser.status === 'Ativo' && <span className="w-2 h-2 bg-white rounded-full mr-2" />}
                  {selectedUser.status}
                </span>
              </div>
              
              {/* Separador */}
              <div className="w-px h-16 bg-border mx-6" />
              
              {/* Nível de Acesso */}
              <div className="w-[120px]">
                <label className="block text-sm font-sans text-text-muted mb-1">Nível de Acesso</label>
                <span className="block font-sans text-2xl text-foreground">{selectedUser.nivelAcesso}</span>
              </div>
              
              {/* Separador */}
              <div className="w-px h-16 bg-border mx-6" />
              
              {/* Versão da Identidade */}
              <div className="w-[140px]">
                <label className="block text-sm font-sans text-text-muted mb-1">Versão da Identidade</label>
                <span className="block font-sans text-2xl text-foreground">{selectedUser.versaoIdentidade}</span>
              </div>
              
              {/* Separador */}
              <div className="w-px h-16 bg-border mx-6" />
              
              {/* ID Auth Externa */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">ID de Autenticação Externa</label>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-base text-foreground">{selectedUser.idAuthExterna}</span>
                  <button 
                    className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                    title="Copiar ID"
                    onClick={() => navigator.clipboard.writeText(selectedUser.idAuthExterna)}
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Divisor horizontal */}
            <div className="border-t border-border" />
            
            {/* Linha 2: Organização | Criado em | Atualizado em - COM separadores verticais */}
            <div className="flex items-start p-6">
              {/* Organização */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Organização</label>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-base text-foreground">{selectedUser.organizacao}</span>
                  <button 
                    className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                    title="Copiar Organização"
                    onClick={() => navigator.clipboard.writeText(selectedUser.organizacao)}
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
              
              {/* Separador vertical */}
              <div className="w-px h-12 bg-border mx-6" />
              
              {/* Criado em */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Criado em</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-sans text-base text-foreground">{selectedUser.criadoEm}</span>
                </div>
              </div>
              
              {/* Separador vertical */}
              <div className="w-px h-12 bg-border mx-6" />
              
              {/* Atualizado em */}
              <div className="flex-1">
                <label className="block text-sm font-sans text-text-muted mb-1">Atualizado em</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-sans text-base text-foreground">{selectedUser.atualizadoEm}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <SnapButton 
                variant="outline" 
                size="default" 
                icon={<Pencil className="w-4 h-4" />} 
                className="border-success text-success hover:bg-success/10"
                onClick={() => {
                  setEditForm({
                    email: selectedUser.email,
                    nomeExibicao: selectedUser.nome,
                    nivelAcesso: 'restricted'
                  })
                  setShowEditModal(true)
                }}
              >Editar</SnapButton>
              <SnapButton 
                variant="outline" 
                size="default" 
                icon={<Key className="w-4 h-4" />} 
                className="border-info text-info hover:bg-info/10"
                onClick={() => {
                  setNewPassword('')
                  setShowResetPasswordModal(true)
                }}
              >Redefinir Senha</SnapButton>
              <SnapButton 
                variant="outline" 
                size="default" 
                icon={<Ban className="w-4 h-4" />} 
                className="border-warning text-warning hover:bg-warning/10"
                onClick={() => setShowDeactivateModal(true)}
              >Desativar</SnapButton>
              <SnapButton 
                variant="outline" 
                size="default" 
                icon={<Lock className="w-4 h-4" />} 
                className="border-[#d4789b] text-[#d4789b] hover:bg-[#d4789b]/10"
                onClick={() => setShowBlockModal(true)}
              >Bloquear</SnapButton>
              <SnapButton 
                variant="solid" 
                size="default" 
                icon={<Trash2 className="w-4 h-4" />} 
                className="bg-error text-white hover:opacity-90"
                onClick={() => setShowDeleteModal(true)}
              >Excluir</SnapButton>
            </div>
            {/* Mostrar Rastreio - alinhado à direita */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-foreground hover:border-border-subtle transition-colors font-sans text-sm">
              <Search className="w-4 h-4" />
              Mostrar rastreio
            </button>
          </div>

          {/* Grupos */}
          <div className="mb-8">
            <h2 className="font-title text-lg text-foreground mb-4">GRUPOS</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.grupos.map((grupo, i) => <GroupBadge key={i} group={grupo} />)}
            </div>
          </div>

          {/* Permissões Efetivas */}
          <div className="mb-8">
            <h2 className="font-title text-lg text-foreground mb-4">PERMISSÕES EFETIVAS</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.permissoes.map((perm, i) => <PermissionBadge key={i} permission={perm} />)}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Editar Detalhes */}
      <SnapModal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <SnapModalHeader 
          icon={<Pencil className="w-5 h-5" />}
          title="Editar detalhes" 
          onClose={() => setShowEditModal(false)} 
        />
        <SnapModalContent>
          {/* Campo Email */}
          <div className="mb-4">
            <label className="block text-sm font-sans text-text-muted mb-2">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
              placeholder="Digite o email"
            />
          </div>
          
          {/* Campo Nome de Exibição */}
          <div className="mb-4">
            <label className="block text-sm font-sans text-text-muted mb-2">Nome de Exibição</label>
            <input
              type="text"
              value={editForm.nomeExibicao}
              onChange={(e) => setEditForm(prev => ({ ...prev, nomeExibicao: e.target.value }))}
              className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
              placeholder="Digite o nome de exibição"
            />
          </div>
          
          {/* Campo Nível de Acesso */}
          <div className="mb-6">
            <SnapSelect
              label="Nível de Acesso"
              value={editForm.nivelAcesso}
              onChange={(value) => setEditForm(prev => ({ ...prev, nivelAcesso: value }))}
              options={[
                { value: 'restricted', label: 'Restrito' },
                { value: 'standard', label: 'Padrão' },
                { value: 'elevated', label: 'Elevado' },
                { value: 'admin', label: 'Administrador' }
              ]}
            />
          </div>
          
          {/* Botões */}
          <SnapModalFooter withTopMargin>
            <SnapButton
              variant="solid"
              size="modal"
              icon={<Check className="w-4 h-4" />}
              className="bg-foreground text-background hover:opacity-90"
            >
              Salvar
            </SnapButton>
            <SnapButton
              variant="outline"
              size="modal"
              icon={<X className="w-4 h-4" />}
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </SnapButton>
          </SnapModalFooter>
        </SnapModalContent>
      </SnapModal>

      {/* Modal Redefinir Senha */}
      <SnapModal open={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)}>
        <SnapModalHeader 
          icon={<Key className="w-5 h-5" />}
          title="Redefinir Senha" 
          onClose={() => setShowResetPasswordModal(false)} 
        />
        <SnapModalContent>
          {/* Campo Nova Senha */}
          <div className="mb-4">
            <label className="block text-sm font-sans text-text-muted mb-2">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-muted dark:bg-[#000000] border border-border rounded-lg text-foreground text-sm font-sans focus:outline-none focus:border-foreground/50 placeholder:text-text-muted"
              placeholder="Digite a nova senha"
            />
          </div>
          
          {/* Aviso de auditoria */}
          <p className="text-sm font-sans text-text-muted mb-6">
            Esta ação será registrada no log de auditoria
          </p>
          
          {/* Botões */}
          <SnapModalFooter>
            <SnapButton
              variant="solid"
              size="modal"
              icon={<Check className="w-4 h-4" />}
              className="bg-foreground text-background hover:opacity-90"
            >
              Redefinir
            </SnapButton>
            <SnapButton
              variant="outline"
              size="modal"
              icon={<X className="w-4 h-4" />}
              onClick={() => setShowResetPasswordModal(false)}
            >
              Cancelar
            </SnapButton>
          </SnapModalFooter>
        </SnapModalContent>
      </SnapModal>

      {/* Modal Desativar Usuário */}
      <SnapModal open={showDeactivateModal} onClose={() => setShowDeactivateModal(false)}>
        <SnapModalHeader 
          icon={<Ban className="w-5 h-5" />}
          title="Desativar usuário" 
          onClose={() => setShowDeactivateModal(false)} 
        />
        <SnapModalContent>
          {/* Pergunta de confirmação */}
          <p className="text-base font-sans text-foreground mb-4">
            Tem certeza que deseja desativar este usuário?
          </p>
          
          {/* Aviso de auditoria */}
          <p className="text-sm font-sans text-text-muted mb-6">
            Esta ação será registrada no log de auditoria
          </p>
          
          {/* Botões */}
          <SnapModalFooter>
            <SnapButton
              variant="solid"
              size="modal"
              icon={<Ban className="w-4 h-4" />}
              className="bg-warning text-black hover:opacity-90"
            >
              Desativar
            </SnapButton>
            <SnapButton
              variant="outline"
              size="modal"
              icon={<X className="w-4 h-4" />}
              onClick={() => setShowDeactivateModal(false)}
            >
              Cancelar
            </SnapButton>
          </SnapModalFooter>
        </SnapModalContent>
      </SnapModal>

      {/* Modal Bloquear Usuário */}
      <SnapModal open={showBlockModal} onClose={() => setShowBlockModal(false)}>
        <SnapModalHeader 
          icon={<Lock className="w-5 h-5" />}
          title="Bloquear usuário" 
          onClose={() => setShowBlockModal(false)} 
        />
        <SnapModalContent>
          {/* Pergunta de confirmação */}
          <p className="text-base font-sans text-foreground mb-4">
            Tem certeza que deseja bloquear este usuário?
          </p>
          
          {/* Aviso de auditoria */}
          <p className="text-sm font-sans text-text-muted mb-6">
            Esta ação será registrada no log de auditoria
          </p>
          
          {/* Botões */}
          <SnapModalFooter>
            <SnapButton
              variant="solid"
              size="modal"
              icon={<Lock className="w-4 h-4" />}
              className="bg-[#d4789b] text-white hover:opacity-90"
            >
              Bloquear
            </SnapButton>
            <SnapButton
              variant="outline"
              size="modal"
              icon={<X className="w-4 h-4" />}
              onClick={() => setShowBlockModal(false)}
            >
              Cancelar
            </SnapButton>
          </SnapModalFooter>
        </SnapModalContent>
      </SnapModal>

      {/* Modal Excluir Usuário */}
      <SnapModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <SnapModalHeader 
          icon={<Trash2 className="w-5 h-5" />}
          title="Excluir usuário" 
          onClose={() => setShowDeleteModal(false)} 
        />
        <SnapModalContent>
          {/* Pergunta de confirmação */}
          <p className="text-base font-sans text-foreground mb-4">
            Tem certeza que deseja excluir este usuário?
          </p>
          
          {/* Aviso de ação irreversível */}
          <p className="text-sm font-sans text-text-muted mb-6">
            Esta ação é irreversível. O usuário será removido permanentemente. Esta ação será registrada no log de auditoria.
          </p>
          
          {/* Botões */}
          <SnapModalFooter>
            <SnapButton
              variant="solid"
              size="modal"
              icon={<Trash2 className="w-4 h-4" />}
              className="bg-error text-white hover:opacity-90"
            >
              Excluir
            </SnapButton>
            <SnapButton
              variant="outline"
              size="modal"
              icon={<X className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </SnapButton>
          </SnapModalFooter>
        </SnapModalContent>
      </SnapModal>

    </div>
  )
}
