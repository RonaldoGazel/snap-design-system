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
  ArrowLeft,
  ArrowRight,
  Users,
  FileText,
  Settings
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapButton } from "@/components/snap/snap-button"

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
            - Sidebar: margem esquerda 32px, fundo arredondado
            - Gap sidebar → conteúdo: 51px
            ============================================ */}
        <div className="flex flex-1">
          {/* Sidebar Colapsada - Tokens:
              - Fundo: #0F0F10 (colors.background.page)
              - Borda: #2A2B35 (colors.border.DEFAULT)
              - Ícones: #FFFFFF (colors.text.primary)
              - Corner radius: 12px (borders.radius.lg)
              - Margem esquerda: 32px
          */}
          <aside 
            className="flex flex-col items-center py-4"
            style={{ 
              marginLeft: '32px', 
              width: '64px', 
              minWidth: '64px',
              backgroundColor: '#0F0F10',
              border: '1px solid #2A2B35',
              borderRadius: '12px'
            }}
          >
            <nav className="flex-1 flex flex-col items-center gap-2">
              {/* Ícone ativo - branco #FFFFFF (Escudo = Inteligência) */}
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#FFFFFF' }}>
                <Shield className="w-5 h-5" />
              </button>
              {/* Ícones inativos - cinza escuro #3B3B3B */}
              {/* Cadeado = Administração */}
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#3B3B3B' }}>
                <Lock className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#3B3B3B' }}>
                <FileText className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#3B3B3B' }}>
                <LinkIcon className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#3B3B3B' }}>
                <ShareIcon className="w-5 h-5" />
              </button>
            </nav>
            <div className="w-8 my-2" style={{ borderTop: '1px solid #2A2B35' }} />
            {/* Engrenagem - cinza escuro #3B3B3B */}
            <button className="p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#3B3B3B' }}>
              <Settings className="w-5 h-5" />
            </button>
          </aside>

          {/* Área de Conteúdo - margem esquerda 51px da sidebar */}
          <main className="flex-1 py-8 pr-8" style={{ marginLeft: '51px' }}>
            {/* Header: Título + Filtros + Botão */}
            <div className="flex items-center justify-between mb-6">
              {/* Título com ícone */}
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" style={{ color: VERTICAL_COLOR }} />
                <h1 className="font-title text-2xl text-foreground">USUÁRIOS</h1>
              </div>

              {/* Filtros e Ação */}
              <div className="flex items-center gap-4">
                {/* Select de Status */}
                <div className="relative">
                  <button
                    onClick={() => setStatusSelectOpen(!statusSelectOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-card-hover transition-colors min-w-[120px]"
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
          { label: "Usuários" },
          { label: selectedUser.nome }
        ]}
      />

      {/* Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-16 min-h-full bg-sidebar flex flex-col items-center py-4 border-r border-sidebar-border">
          <nav className="flex-1 flex flex-col items-center gap-2">
            <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors" style={{ color: VERTICAL_COLOR }}><Search className="w-5 h-5" /></button>
            <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-foreground"><Home className="w-5 h-5" /></button>
            <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"><FileText className="w-5 h-5" /></button>
            <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"><LinkIcon className="w-5 h-5" /></button>
            <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"><ShareIcon className="w-5 h-5" /></button>
          </nav>
          <div className="w-8 border-t border-sidebar-border my-2" />
          <button className="p-3 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"><Settings className="w-5 h-5" /></button>
        </aside>

        {/* Conteúdo - Padding de 32px */}
        <main className="flex-1 p-8">
          {/* Voltar + Título */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors font-sans text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <h1 className="font-title text-2xl text-foreground">DETALHE DO USUÁRIO</h1>
          </div>

          {/* Card de Dados */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="grid grid-cols-5 gap-6">
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Nome de Exibição</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.nome}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Email</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.email}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Status</label>
                <StatusBadge status={selectedUser.status} />
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Nível de Acesso</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.nivelAcesso}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">ID de Autenticação Externa</label>
                <span className="font-sans text-sm text-foreground break-all">{selectedUser.idAuthExterna}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Organização</label>
                <span className="font-sans text-sm text-foreground break-all">{selectedUser.organizacao}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Versão da Identidade</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.versaoIdentidade}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Criado em</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.criadoEm}</span>
              </div>
              <div>
                <label className="block text-xs font-sans text-text-muted mb-1">Atualizado em</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.atualizadoEm}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-4 mb-8">
            <SnapButton variant="outline" size="default" icon={<Pencil className="w-4 h-4" />} className="border-success text-success hover:bg-success/10">Editar</SnapButton>
            <SnapButton variant="outline" size="default" icon={<Key className="w-4 h-4" />} className="border-info text-info hover:bg-info/10">Redefinir Senha</SnapButton>
            <SnapButton variant="outline" size="default" icon={<Ban className="w-4 h-4" />} className="border-warning text-warning hover:bg-warning/10">Desativar</SnapButton>
            <SnapButton variant="outline" size="default" icon={<Lock className="w-4 h-4" />} className="border-[#d4789b] text-[#d4789b] hover:bg-[#d4789b]/10">Bloquear</SnapButton>
            <SnapButton variant="outline" size="default" icon={<Trash2 className="w-4 h-4" />} className="border-error text-error hover:bg-error/10">Excluir</SnapButton>
          </div>

          {/* Grupos */}
          <div className="mb-8">
            <h2 className="font-sans text-lg font-semibold text-foreground mb-4">Grupos</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.grupos.map((grupo, i) => <GroupBadge key={i} group={grupo} />)}
            </div>
          </div>

          {/* Permissões Efetivas */}
          <div className="mb-8">
            <h2 className="font-sans text-lg font-semibold text-foreground mb-4">Permissões Efetivas</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.permissoes.map((perm, i) => <PermissionBadge key={i} permission={perm} />)}
            </div>
          </div>

          {/* Mostrar Rastreio */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-foreground hover:border-border-subtle transition-colors font-sans text-sm">
            <Search className="w-4 h-4" />
            Mostrar rastreio
          </button>
        </main>
      </div>
    </div>
  )
}
