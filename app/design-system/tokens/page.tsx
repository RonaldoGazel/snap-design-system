"use client"

import { useState } from "react"
import { SnapHeader } from "@/components/snap/snap-header"
import { SnapSidebar } from "@/components/snap/snap-sidebar"
import { Sun, Moon } from "lucide-react"

/**
 * Pagina de Tokens - Dark/Light Mode
 * 
 * Nivel 1: Design System > Tokens
 * Documenta todos os tokens semanticos que alternam entre dark e light mode
 */

// Tokens semanticos com valores dark/light
const semanticTokens = [
  { name: "--background", dark: "#0a0a0a", light: "#ECEEEF", tailwind: "bg-background", uso: "Fundo da pagina" },
  { name: "--foreground", dark: "#ffffff", light: "#000000", tailwind: "text-foreground", uso: "Texto principal" },
  { name: "--card", dark: "#1a1a1a", light: "#ffffff", tailwind: "bg-card", uso: "Fundo de cards" },
  { name: "--card-foreground", dark: "#ffffff", light: "#000000", tailwind: "text-card-foreground", uso: "Texto em cards" },
  { name: "--card-elevated", dark: "#242424", light: "#ffffff", tailwind: "bg-card-elevated", uso: "Card elevado" },
  { name: "--card-hover", dark: "#2a2a2a", light: "#eef1f3", tailwind: "bg-card-hover", uso: "Card hover" },
  { name: "--popover", dark: "#1a1a1a", light: "#ffffff", tailwind: "bg-popover", uso: "Fundo popovers" },
  { name: "--popover-foreground", dark: "#ffffff", light: "#000000", tailwind: "text-popover-foreground", uso: "Texto popovers" },
  { name: "--input", dark: "#000000", light: "#ffffff", tailwind: "bg-input", uso: "Fundo inputs" },
  { name: "--secondary", dark: "#2a2a2a", light: "#e8ebed", tailwind: "bg-secondary", uso: "Fundo secundario" },
  { name: "--secondary-foreground", dark: "#ffffff", light: "#000000", tailwind: "text-secondary-foreground", uso: "Texto secundario" },
  { name: "--muted", dark: "#1a1a1a", light: "#eef1f3", tailwind: "bg-muted", uso: "Fundo muted" },
  { name: "--muted-foreground", dark: "#888888", light: "#5a5a5a", tailwind: "text-muted-foreground", uso: "Texto muted" },
  { name: "--accent", dark: "#2a2a2a", light: "#e8ebed", tailwind: "bg-accent", uso: "Fundo accent" },
  { name: "--accent-foreground", dark: "#ffffff", light: "#000000", tailwind: "text-accent-foreground", uso: "Texto accent" },
  { name: "--border", dark: "#2a2a2a", light: "#d0d5d9", tailwind: "border-border", uso: "Bordas" },
  { name: "--border-subtle", dark: "#333333", light: "#e0e5e8", tailwind: "border-border-subtle", uso: "Bordas sutis" },
]

const textTokens = [
  { name: "--text-primary", dark: "#ffffff", light: "#000000", tailwind: "text-text-primary", uso: "Texto primario" },
  { name: "--text-secondary", dark: "#a0a0a0", light: "#4a4a4a", tailwind: "text-text-secondary", uso: "Texto secundario" },
  { name: "--text-muted", dark: "#888888", light: "#6a6a6a", tailwind: "text-text-muted", uso: "Texto muted" },
  { name: "--text-subtle", dark: "#666666", light: "#8a8a8a", tailwind: "text-text-subtle", uso: "Texto sutil" },
]

const sidebarTokens = [
  { name: "--sidebar", dark: "#000000", light: "#ffffff", tailwind: "bg-sidebar", uso: "Fundo sidebar" },
  { name: "--sidebar-foreground", dark: "#ffffff", light: "#000000", tailwind: "text-sidebar-foreground", uso: "Texto sidebar" },
  { name: "--sidebar-accent", dark: "#1a1a1a", light: "#eef1f3", tailwind: "bg-sidebar-accent", uso: "Sidebar accent" },
  { name: "--sidebar-border", dark: "#2a2a2a", light: "#d0d5d9", tailwind: "border-sidebar-border", uso: "Borda sidebar" },
]

const fixedTokens = [
  { name: "--primary", value: "#72284b", tailwind: "bg-primary", uso: "Cor da vertical ativa (Inteligencia)" },
  { name: "--success", value: "#3f9f76", tailwind: "bg-success", uso: "Status sucesso" },
  { name: "--warning", value: "#ffc563", tailwind: "bg-warning", uso: "Status warning" },
  { name: "--error", value: "#fe473c", tailwind: "bg-error", uso: "Status erro" },
  { name: "--destructive", value: "#fe473c", tailwind: "bg-destructive", uso: "Acoes destrutivas" },
]

const verticalTokens = [
  { name: "Investigacao", value: "#FE473C", tailwind: "text-[#FE473C]" },
  { name: "Inteligencia", value: "#72284B", tailwind: "text-[#72284B]" },
  { name: "Cooperacao", value: "#889EA3", tailwind: "text-[#889EA3]" },
  { name: "Infraestrutura", value: "#287266", tailwind: "text-[#287266]" },
  { name: "Administracao", value: "#333540", tailwind: "text-[#333540]" },
]

function ColorSwatch({ color, label }: { color: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="w-12 h-12 rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: color }}
      />
      {label && <span className="font-mono text-xs text-text-muted">{label}</span>}
    </div>
  )
}

export default function TokensPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark')

  return (
    <div className="min-h-screen bg-background">
      <SnapHeader
        vertical="administracao"
        breadcrumb={[
          { label: "Design System", href: "/design-system" },
          { label: "Tokens" }
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
          currentPage="tokens"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Conteudo - margem fixa: 32 + 64 + 32 = 128px */}
        <main className="flex-1 py-8 pr-8" style={{ marginLeft: `${32 + 64 + 32}px` }}>
          
          {/* Titulo */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-title text-2xl text-foreground">TOKENS DARK/LIGHT</h1>
            
            {/* Toggle de preview */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  previewMode === 'dark' ? 'bg-muted text-foreground' : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="font-sans text-sm">Dark</span>
              </button>
              <button
                onClick={() => setPreviewMode('light')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  previewMode === 'light' ? 'bg-muted text-foreground' : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="font-sans text-sm">Light</span>
              </button>
            </div>
          </div>

          {/* Tokens Semanticos */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">TOKENS SEMANTICOS</h2>
            <p className="font-sans text-sm text-text-muted mb-6">
              Tokens que alternam automaticamente entre dark e light mode. Use as classes Tailwind para aplicar.
            </p>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Token CSS</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Dark</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Light</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Preview</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Tailwind</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {semanticTokens.map((token, index) => (
                    <tr key={token.name} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                      <td className="font-mono text-sm text-foreground px-4 py-3">{token.name}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.dark}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.light}</td>
                      <td className="px-4 py-3">
                        <ColorSwatch color={previewMode === 'dark' ? token.dark : token.light} />
                      </td>
                      <td className="font-mono text-xs text-[#72284B] px-4 py-3">{token.tailwind}</td>
                      <td className="font-sans text-sm text-text-secondary px-4 py-3">{token.uso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tokens de Texto */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">TOKENS DE TEXTO</h2>
            <p className="font-sans text-sm text-text-muted mb-6">
              Hierarquia de texto com 4 niveis de contraste.
            </p>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Token CSS</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Dark</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Light</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Preview</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Tailwind</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {textTokens.map((token, index) => (
                    <tr key={token.name} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                      <td className="font-mono text-sm text-foreground px-4 py-3">{token.name}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.dark}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.light}</td>
                      <td className="px-4 py-3">
                        <div 
                          className="font-sans text-sm px-3 py-1 rounded"
                          style={{ 
                            color: previewMode === 'dark' ? token.dark : token.light,
                            backgroundColor: previewMode === 'dark' ? '#0a0a0a' : '#ECEEEF'
                          }}
                        >
                          Exemplo de texto
                        </div>
                      </td>
                      <td className="font-mono text-xs text-[#72284B] px-4 py-3">{token.tailwind}</td>
                      <td className="font-sans text-sm text-text-secondary px-4 py-3">{token.uso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tokens da Sidebar */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">TOKENS DA SIDEBAR</h2>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Token CSS</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Dark</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Light</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Preview</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Tailwind</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {sidebarTokens.map((token, index) => (
                    <tr key={token.name} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                      <td className="font-mono text-sm text-foreground px-4 py-3">{token.name}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.dark}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.light}</td>
                      <td className="px-4 py-3">
                        <ColorSwatch color={previewMode === 'dark' ? token.dark : token.light} />
                      </td>
                      <td className="font-mono text-xs text-[#72284B] px-4 py-3">{token.tailwind}</td>
                      <td className="font-sans text-sm text-text-secondary px-4 py-3">{token.uso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tokens Fixos */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">TOKENS FIXOS (NAO MUDAM)</h2>
            <p className="font-sans text-sm text-text-muted mb-6">
              Cores que permanecem iguais em ambos os modos.
            </p>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Token CSS</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Valor</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Preview</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Tailwind</th>
                    <th className="text-left font-sans text-xs font-semibold text-text-muted px-4 py-3">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedTokens.map((token, index) => (
                    <tr key={token.name} className={index % 2 === 0 ? '' : 'bg-muted/20'}>
                      <td className="font-mono text-sm text-foreground px-4 py-3">{token.name}</td>
                      <td className="font-mono text-xs text-text-muted px-4 py-3">{token.value}</td>
                      <td className="px-4 py-3">
                        <ColorSwatch color={token.value} />
                      </td>
                      <td className="font-mono text-xs text-[#72284B] px-4 py-3">{token.tailwind}</td>
                      <td className="font-sans text-sm text-text-secondary px-4 py-3">{token.uso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cores das Verticais */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">CORES DAS VERTICAIS</h2>
            <p className="font-sans text-sm text-text-muted mb-6">
              Cada vertical do ecossistema SNAP possui sua cor identificadora.
            </p>
            
            <div className="flex gap-6 flex-wrap">
              {verticalTokens.map((vertical) => (
                <div key={vertical.name} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-20 h-20 rounded-lg shadow-md"
                    style={{ backgroundColor: vertical.value }}
                  />
                  <span className="font-sans text-sm font-medium text-foreground">{vertical.name}</span>
                  <span className="font-mono text-xs text-text-muted">{vertical.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Guia de Uso */}
          <section className="mb-12">
            <h2 className="font-title text-lg text-foreground mb-4">GUIA DE USO</h2>
            
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Backgrounds</h3>
                <code className="font-mono text-xs text-text-muted bg-muted px-2 py-1 rounded">
                  bg-background | bg-card | bg-muted | bg-input | bg-secondary
                </code>
              </div>
              
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Textos</h3>
                <code className="font-mono text-xs text-text-muted bg-muted px-2 py-1 rounded">
                  text-foreground | text-text-secondary | text-text-muted | text-text-subtle
                </code>
              </div>
              
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Bordas</h3>
                <code className="font-mono text-xs text-text-muted bg-muted px-2 py-1 rounded">
                  border-border | border-border-subtle
                </code>
              </div>
              
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Sidebar</h3>
                <code className="font-mono text-xs text-text-muted bg-muted px-2 py-1 rounded">
                  bg-sidebar | text-sidebar-foreground | bg-sidebar-accent
                </code>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
