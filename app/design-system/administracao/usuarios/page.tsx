"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Key,
  Ban,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowLeft,
  Users as UsersIcon
} from "lucide-react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapSidebar, SnapSidebarCollapsed } from "@/components/snap/snap-sidebar"
import { SnapButton } from "@/components/snap/snap-button"
import { verticals } from "@/lib/snap-tokens"

/**
 * TELA: Usuários (Listagem + Detalhe)
 * Vertical: Administração (#333540)
 * 
 * Baseado nas telas provisórias do Figma:
 * - Listagem: tabela com Nome, Email, Status, Nível de Acesso, Criado em
 * - Detalhe: card com dados completos + ações + permissões
 */

// Dados mockados para a tabela
const mockUsers = [
  { 
    id: "dd595bd0-363a-4a8a-bad5-7f2af1af5186",
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
    id: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
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
    id: "b2c3d4e5-6789-01bc-defg-2345678901bc",
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
    id: "c3d4e5f6-7890-12cd-efgh-3456789012cd",
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
]

// Tipo para usuário
type User = typeof mockUsers[0]

// Componente de Badge de Status
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    "Ativo": { bg: "bg-[#3f9f76]", text: "text-white" },
    "Inativo": { bg: "bg-[#6b6e7a]", text: "text-white" },
    "Bloqueado": { bg: "bg-[#fe473c]", text: "text-white" },
  }
  
  const style = config[status] || config["Inativo"]
  
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-sans font-medium ${style.bg} ${style.text}`}>
      {status}
    </span>
  )
}

// Componente de Badge de Permissão
function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium border border-[#4a4d61] text-[#b1b3c2] bg-transparent">
      {permission}
    </span>
  )
}

// Componente de Grupo Badge
function GroupBadge({ group }: { group: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium border border-[#4a4d61] text-white bg-transparent">
      {group}
    </span>
  )
}

export default function UsuariosPage() {
  const router = useRouter()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [pageSize, setPageSize] = useState(50)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const vertical = verticals.administracao

  const handleItemClick = (verticalKey: string, itemId: string, href?: string) => {
    if (href) {
      router.push(href)
    }
  }

  const filteredUsers = mockUsers.filter(user => 
    statusFilter === "" || user.status === statusFilter
  )

  // Tela de Listagem
  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <SnapHeader
          vertical="administracao"
          breadcrumb={[
            { label: "Usuários", icon: <UsersIcon className="w-4 h-4" /> }
          ]}
          organizacao="SNAP"
          organizacaoSigla="SNAP"
          userInitials="PA"
          notificationCount={3}
        />

        {/* Layout principal */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          {sidebarExpanded ? (
            <SnapSidebar
              expanded={true}
              activeVertical="administracao"
              activeItem="usuarios"
              onItemClick={handleItemClick}
              onToggleExpand={() => setSidebarExpanded(false)}
            />
          ) : (
            <SnapSidebarCollapsed
              activeVertical="administracao"
              onVerticalClick={() => setSidebarExpanded(true)}
            />
          )}

          {/* Conteúdo principal */}
          <main className="flex-1 p-8 overflow-auto">
            {/* Título da página */}
            <h1 className="text-2xl font-sans font-bold text-foreground mb-6">
              Usuários
            </h1>

            {/* Barra de filtros e ações */}
            <div className="bg-[#1a1a1e] rounded-xl border border-[#2a2b35] p-4 mb-0">
              <div className="flex items-center justify-between">
                {/* Filtro de Status */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans text-[#898c9d]">Status</label>
                  <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none bg-[#0f0f10] border border-[#2a2b35] rounded-lg px-4 py-2 pr-10 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#333540] min-w-[140px]"
                    >
                      <option value="">Status</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Bloqueado">Bloqueado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898c9d] pointer-events-none" />
                  </div>
                </div>

                {/* Botão Criar Usuário */}
                <SnapButton
                  variant="primary"
                  size="default"
                  icon={<Plus className="w-4 h-4" />}
                  className="bg-[#4a90a4] hover:bg-[#3d7a8c]"
                >
                  Criar Usuário
                </SnapButton>
              </div>
            </div>

            {/* Tabela de usuários */}
            <div className="bg-[#1a1a1e] rounded-b-xl border border-t-0 border-[#2a2b35] overflow-hidden">
              {/* Header da tabela */}
              <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 border-b border-[#2a2b35]">
                <span className="font-sans text-sm font-medium text-foreground">Nome</span>
                <span className="font-sans text-sm font-medium text-foreground">Email</span>
                <span className="font-sans text-sm font-medium text-foreground">Status</span>
                <span className="font-sans text-sm font-medium text-foreground">Nível de Acesso</span>
                <span className="font-sans text-sm font-medium text-foreground">Criado em</span>
              </div>

              {/* Linhas da tabela */}
              {filteredUsers.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 border-b border-[#2a2b35] last:border-b-0 hover:bg-[#222226] transition-colors cursor-pointer"
                >
                  <span className="font-sans text-sm text-foreground">
                    {user.nome}
                  </span>
                  <span className="font-sans text-sm text-[#b1b3c2]">
                    {user.email}
                  </span>
                  <span>
                    <StatusBadge status={user.status} />
                  </span>
                  <span className="font-sans text-sm text-foreground">
                    {user.nivelAcesso}
                  </span>
                  <span className="font-sans text-sm text-[#b1b3c2]">
                    {user.criadoEm}
                  </span>
                </div>
              ))}

              {/* Paginação */}
              <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-[#2a2b35]">
                <button className="p-2 text-[#898c9d] hover:text-foreground transition-colors">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#898c9d] hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#898c9d] hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="p-2 text-[#898c9d] hover:text-foreground transition-colors">
                  <ChevronsRight className="w-4 h-4" />
                </button>
                
                <div className="relative ml-4">
                  <select 
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="appearance-none bg-[#2a2b35] border border-[#3a3b45] rounded-lg px-3 py-1.5 pr-8 font-sans text-sm text-foreground focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#898c9d] pointer-events-none" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Tela de Detalhe do Usuário
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Usuários", href: "/design-system/administracao/usuarios" },
          { label: selectedUser.id }
        ]}
        organizacao="SNAP"
        organizacaoSigla="SNAP"
        userInitials="PA"
        notificationCount={3}
      />

      {/* Layout principal */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebarExpanded ? (
          <SnapSidebar
            expanded={true}
            activeVertical="administracao"
            activeItem="usuarios"
            onItemClick={handleItemClick}
            onToggleExpand={() => setSidebarExpanded(false)}
          />
        ) : (
          <SnapSidebarCollapsed
            activeVertical="administracao"
            onVerticalClick={() => setSidebarExpanded(true)}
          />
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Botão Voltar + Título */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-[#b1b3c2] hover:text-foreground transition-colors font-sans text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <h1 className="text-2xl font-sans font-bold text-foreground">
              Detalhe do Usuário
            </h1>
          </div>

          {/* Card de dados do usuário */}
          <div className="bg-[#1a1a1e] rounded-xl border border-[#2a2b35] p-6 mb-6">
            <div className="grid grid-cols-5 gap-6">
              {/* Coluna 1: Nome de Exibição */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Nome de Exibição</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.nome}</span>
              </div>
              
              {/* Coluna 2: Email */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Email</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.email}</span>
              </div>
              
              {/* Coluna 3: Status */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Status</label>
                <StatusBadge status={selectedUser.status} />
              </div>
              
              {/* Coluna 4: Nível de Acesso */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Nível de Acesso</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.nivelAcesso}</span>
              </div>
              
              {/* Coluna 5: ID de Autenticação Externa */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">ID de Autenticação Externa</label>
                <span className="font-sans text-sm text-foreground break-all">{selectedUser.idAuthExterna}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6">
              {/* Organização */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Organização</label>
                <span className="font-sans text-sm text-foreground break-all">{selectedUser.organizacao}</span>
              </div>
              
              {/* Versão da Identidade */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Versão da Identidade</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.versaoIdentidade}</span>
              </div>
              
              {/* Criado em */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Criado em</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.criadoEm}</span>
              </div>
              
              {/* Atualizado em */}
              <div>
                <label className="block text-xs font-sans text-[#898c9d] mb-1">Atualizado em</label>
                <span className="font-sans text-sm text-foreground">{selectedUser.atualizadoEm}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-4 mb-8">
            <SnapButton
              variant="outline"
              size="default"
              icon={<Edit2 className="w-4 h-4" />}
              className="border-[#3f9f76] text-[#3f9f76] hover:bg-[#3f9f76]/10"
            >
              Editar
            </SnapButton>
            
            <SnapButton
              variant="outline"
              size="default"
              icon={<Key className="w-4 h-4" />}
              className="border-[#4a90a4] text-[#4a90a4] hover:bg-[#4a90a4]/10"
            >
              Redefinir Senha
            </SnapButton>
            
            <SnapButton
              variant="outline"
              size="default"
              icon={<Ban className="w-4 h-4" />}
              className="border-[#ffc563] text-[#ffc563] hover:bg-[#ffc563]/10"
            >
              Desativar
            </SnapButton>
            
            <SnapButton
              variant="outline"
              size="default"
              icon={<Lock className="w-4 h-4" />}
              className="border-[#d4789b] text-[#d4789b] hover:bg-[#d4789b]/10"
            >
              Bloquear
            </SnapButton>
            
            <SnapButton
              variant="outline"
              size="default"
              icon={<Trash2 className="w-4 h-4" />}
              className="border-[#fe473c] text-[#fe473c] hover:bg-[#fe473c]/10"
            >
              Excluir
            </SnapButton>
          </div>

          {/* Seção de Grupos */}
          <div className="mb-8">
            <h2 className="font-sans text-lg font-semibold text-foreground mb-4">Grupos</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.grupos.map((grupo, index) => (
                <GroupBadge key={index} group={grupo} />
              ))}
            </div>
          </div>

          {/* Seção de Permissões Efetivas */}
          <div className="mb-8">
            <h2 className="font-sans text-lg font-semibold text-foreground mb-4">Permissões Efetivas</h2>
            <div className="flex flex-wrap gap-2">
              {selectedUser.permissoes.map((permissao, index) => (
                <PermissionBadge key={index} permission={permissao} />
              ))}
            </div>
          </div>

          {/* Botão Mostrar Rastreio */}
          <div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2b35] text-[#b1b3c2] hover:text-foreground hover:border-[#3a3b45] transition-colors font-sans text-sm">
              <Search className="w-4 h-4" />
              Mostrar rastreio
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
