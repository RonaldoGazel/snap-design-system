"use client"

import { useState } from "react"
import Link from "next/link"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapSidebar } from "@/components/snap/snap-sidebar"
import { 
  Palette, 
  Component, 
  Shield, 
  Lock, 
  Users, 
  Handshake, 
  Server, 
  Search,
  ChevronRight,
  FileText,
  Network
} from "lucide-react"

/**
 * Design System - Pagina Principal (Nivel 1)
 * 
 * Estrutura:
 * - Nivel 1: Design System (esta pagina) - Tokens, Componentes
 * - Nivel 2: Verticais (Administracao, Inteligencia, etc.)
 * - Nivel 3: Paginas das Verticais (Usuarios, Grupos, etc.)
 */

const sections = [
  {
    title: "Fundamentos",
    items: [
      {
        name: "Tokens Dark/Light",
        description: "Cores semanticas que alternam entre dark e light mode",
        href: "/design-system/tokens",
        icon: Palette,
        color: "#72284B"
      },
      {
        name: "Componentes",
        description: "Botoes, Modais, Selects, Badges e outros componentes base",
        href: "/design-system/componentes",
        icon: Component,
        color: "#287266"
      },
    ]
  },
  {
    title: "Verticais do Ecossistema SNAP",
    items: [
      {
        name: "Investigacao",
        description: "Modulo de investigacao criminal",
        href: "/design-system/investigacao",
        icon: Search,
        color: "#FE473C"
      },
      {
        name: "Inteligencia",
        description: "Modulo de inteligencia e analise",
        href: "/design-system/inteligencia",
        icon: Shield,
        color: "#72284B"
      },
      {
        name: "Cooperacao",
        description: "Modulo de cooperacao entre orgaos",
        href: "/design-system/cooperacao",
        icon: Handshake,
        color: "#889EA3"
      },
      {
        name: "Infraestrutura",
        description: "Modulo de infraestrutura e redes",
        href: "/design-system/infraestrutura",
        icon: Server,
        color: "#287266"
      },
      {
        name: "Administracao",
        description: "Usuarios, Grupos, Papeis, Convites, Auditoria",
        href: "/design-system/administracao",
        icon: Lock,
        color: "#333540"
      },
    ]
  },
  {
    title: "Areas Agnosticas",
    items: [
      {
        name: "SNAP Graph",
        description: "Visualizacao de grafos e relacionamentos",
        href: "/design-system/snap-graph",
        icon: Network,
        color: "#696969"
      },
    ]
  }
]

export default function DesignSystemPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Design System" }
        ]}
        userName="Designer"
        userRole="Admin"
        userInitials="DS"
        notificationCount={0}
      />

      <div className="flex">
        {/* Sidebar */}
        <SnapSidebar
          vertical="administracao"
          currentPage="design-system"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Conteudo - margem fixa: 32 + 64 + 32 = 128px */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* Titulo */}
          <div className="mb-8">
            <h1 className="font-title text-2xl text-foreground mb-2">SNAP DESIGN SYSTEM</h1>
            <p className="font-sans text-sm text-text-muted">
              Documentacao visual e componentes do ecossistema SNAP
            </p>
          </div>

          {/* Secoes */}
          {sections.map((section) => (
            <section key={section.title} className="mb-12">
              <h2 className="font-title text-lg text-foreground mb-6">{section.title.toUpperCase()}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link 
                      key={item.name}
                      href={item.href}
                      className="group bg-card border border-border rounded-lg p-6 hover:border-border-subtle hover:bg-card-hover transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <Icon 
                            className="w-6 h-6" 
                            style={{ color: item.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-sans text-base font-semibold text-foreground group-hover:text-foreground">
                              {item.name}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="font-sans text-sm text-text-muted mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Template de Layout */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-6">TEMPLATE DE LAYOUT</h2>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-sans text-sm font-semibold text-foreground mb-4">Medidas Padrao (em pixels)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted rounded-lg p-4">
                  <span className="font-mono text-2xl text-foreground">32</span>
                  <p className="font-sans text-xs text-text-muted mt-1">Sidebar marginLeft</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <span className="font-mono text-2xl text-foreground">64</span>
                  <p className="font-sans text-xs text-text-muted mt-1">Sidebar width</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <span className="font-mono text-2xl text-foreground">32</span>
                  <p className="font-sans text-xs text-text-muted mt-1">Gap conteudo</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <span className="font-mono text-2xl text-foreground font-bold">128</span>
                  <p className="font-sans text-xs text-text-muted mt-1">Main marginLeft</p>
                </div>
              </div>

              <h3 className="font-sans text-sm font-semibold text-foreground mb-4">Codigo do Template</h3>
              <pre className="bg-[#000000] border border-border rounded-lg p-4 overflow-x-auto">
                <code className="font-mono text-xs text-text-secondary">
{`// Sidebar Style
style={{
  top: '90px',
  marginLeft: '32px',
  width: sidebarOpen ? '280px' : '64px',
  height: 'calc(100vh - 230px)',
}}

// Main Content
<main className="flex-1 py-8 pr-8" style={{ marginLeft: \`\${32 + 64 + 32}px\` }}>`}
                </code>
              </pre>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
