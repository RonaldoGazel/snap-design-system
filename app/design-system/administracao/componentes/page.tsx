"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight,
  Shield, 
  Lock, 
  FileText, 
  Link2, 
  Share2,
  Settings,
  Users,
  Bell,
  Sun
} from "lucide-react"
import { SnapLogo } from "@/components/snap/snap-logo"
import { SnapThemeToggle } from "@/components/snap/snap-theme-toggle"
import { SnapButton } from "@/components/snap/snap-button"

/**
 * DOCUMENTAÇÃO DE COMPONENTES - Módulo Administração
 * 
 * Esta página documenta todos os componentes e regras visuais
 * utilizados nas telas do módulo de Administração.
 */

const VERTICAL_COLOR = "#333540" // Deep Gray Blue - Administração

export default function ComponentesDocPage() {
  // Estados para demonstrações interativas
  const [sidebarDemoOpen, setSidebarDemoOpen] = useState(false)
  const [sidebarContentVisible, setSidebarContentVisible] = useState(false)
  const [inteligenciaExpanded, setInteligenciaExpanded] = useState(true)
  const [administracaoExpanded, setAdministracaoExpanded] = useState(true)
  
  const [selectDemoOpen, setSelectDemoOpen] = useState(false)
  const [selectDemoValue, setSelectDemoValue] = useState('Visão plataforma')
  const selectOptions = ['Visão plataforma', 'Administradores', 'Analistas', 'Operadores']

  // Handlers da sidebar
  const handleSidebarOpen = () => {
    setSidebarDemoOpen(true)
    setTimeout(() => setSidebarContentVisible(true), 200)
  }
  
  const handleSidebarClose = () => {
    setSidebarContentVisible(false)
    setTimeout(() => setSidebarDemoOpen(false), 50)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/design-system/administracao" 
              className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-sans text-sm">Administração</span>
            </Link>
            <div className="w-px h-6 bg-border" />
            <SnapLogo variant="snap" height={24} />
          </div>
          <SnapThemeToggle />
        </div>
      </header>

      {/* Barra da vertical */}
      <div className="h-1 bg-[#333540]" />

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="mb-12">
          <h1 className="text-3xl font-title mb-4">DOCUMENTAÇÃO DE COMPONENTES</h1>
          <p className="text-text-secondary font-sans max-w-2xl">
            Referência visual e regras para todos os componentes utilizados no módulo de Administração.
            Use esta página como guia ao criar novas telas.
          </p>
        </div>

        {/* Índice */}
        <nav className="mb-12 p-6 rounded-xl border border-border bg-card">
          <h2 className="font-sans font-semibold text-foreground mb-4">Índice</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
            <li><a href="#sidebar" className="text-text-secondary hover:text-foreground">1. Sidebar</a></li>
            <li><a href="#selects" className="text-text-secondary hover:text-foreground">2. Selects</a></li>
            <li><a href="#botoes" className="text-text-secondary hover:text-foreground">3. Botões</a></li>
            <li><a href="#badges" className="text-text-secondary hover:text-foreground">4. Badges</a></li>
            <li><a href="#tabela" className="text-text-secondary hover:text-foreground">5. Tabela</a></li>
            <li><a href="#header" className="text-text-secondary hover:text-foreground">6. Header</a></li>
            <li><a href="#cores" className="text-text-secondary hover:text-foreground">7. Cores</a></li>
            <li><a href="#tipografia" className="text-text-secondary hover:text-foreground">8. Tipografia</a></li>
          </ul>
        </nav>

        {/* ============================================ */}
        {/* SEÇÃO: SIDEBAR */}
        {/* ============================================ */}
        <section id="sidebar" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">1. SIDEBAR</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regras */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Regras</h3>
              <div className="space-y-4 text-sm font-sans text-text-secondary">
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Dimensões:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Largura fechada: 64px</li>
                    <li>Largura aberta: 280px</li>
                    <li>Margem esquerda da tela: 32px</li>
                    <li>Gap até conteúdo: 51px</li>
                    <li>Border-radius: 12px</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Comportamento:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Abre/fecha com hover (não clique)</li>
                    <li>Sidebar aberta é overlay (position absolute)</li>
                    <li>Conteúdo da página NÃO move</li>
                    <li>Delay de 200ms para mostrar texto após expandir</li>
                    <li>Drop-shadow quando aberta</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Cores dos ícones:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Idle/default: #717171 (cinza médio)</li>
                    <li>Página atual: cor da vertical (#333540)</li>
                    <li>Item selecionado: fundo cor da vertical + texto branco</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Alinhamento de ícones:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Ícones sempre alinhados via flexbox (items-center)</li>
                    <li>Container usa flex + items-center + justify-center (fechado)</li>
                    <li>Container usa flex + items-center + gap-3 (aberto)</li>
                    <li>Ícones têm shrink-0 para não comprimir</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo Interativa */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Demo Interativa</h3>
              <p className="text-sm font-sans text-text-muted mb-4">Passe o mouse sobre a sidebar para expandir:</p>
              
              <div className="relative h-[400px] rounded-xl border border-border bg-background overflow-hidden">
                {/* Sidebar Demo */}
                <aside
                  onMouseEnter={handleSidebarOpen}
                  onMouseLeave={handleSidebarClose}
                  style={{ 
                    width: sidebarDemoOpen ? '240px' : '64px',
                    boxShadow: sidebarDemoOpen ? '4px 0 24px rgba(0, 0, 0, 0.5)' : 'none',
                  }}
                  className="flex flex-col py-4 transition-all duration-300 absolute z-50 border border-border rounded-xl bg-[#f0f0f0] dark:bg-[#0C0C0C] left-4 top-4 bottom-4"
                >
                  {/* Itens da Sidebar */}
                  <div className="flex-1 space-y-1 px-2">
                    {/* Item: Inteligência (vertical) */}
                    <div>
                      <button
                        onClick={() => setInteligenciaExpanded(!inteligenciaExpanded)}
                        className="w-full flex items-center rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className={`flex items-center ${sidebarDemoOpen ? 'justify-start gap-3' : 'justify-center w-full'}`}>
                          <Shield className="w-5 h-5 shrink-0" style={{ color: '#72284B' }} />
                          {sidebarDemoOpen && sidebarContentVisible && (
                            <>
                              <span className="font-sans text-sm text-text-secondary flex-1 text-left">Inteligência</span>
                              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${inteligenciaExpanded ? '' : '-rotate-90'}`} />
                            </>
                          )}
                        </div>
                      </button>
                      
                      {/* Subitens */}
                      {inteligenciaExpanded && sidebarDemoOpen && sidebarContentVisible && (
                        <div className="ml-4 mt-1 space-y-1">
                          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <FileText className="w-4 h-4 text-[#717171] shrink-0" />
                            <span className="font-sans text-sm text-text-muted">Processos</span>
                          </button>
                          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <Link2 className="w-4 h-4 text-[#717171] shrink-0" />
                            <span className="font-sans text-sm text-text-muted">Vínculos</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Item: Administração (vertical) */}
                    <div>
                      <button
                        onClick={() => setAdministracaoExpanded(!administracaoExpanded)}
                        className="w-full flex items-center rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className={`flex items-center ${sidebarDemoOpen ? 'justify-start gap-3' : 'justify-center w-full'}`}>
                          <Lock className="w-5 h-5 shrink-0" style={{ color: VERTICAL_COLOR }} />
                          {sidebarDemoOpen && sidebarContentVisible && (
                            <>
                              <span className="font-sans text-sm text-text-secondary flex-1 text-left">Administração</span>
                              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${administracaoExpanded ? '' : '-rotate-90'}`} />
                            </>
                          )}
                        </div>
                      </button>
                      
                      {/* Subitens */}
                      {administracaoExpanded && sidebarDemoOpen && sidebarContentVisible && (
                        <div className="ml-4 mt-1 space-y-1">
                          <button 
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2"
                            style={{ backgroundColor: VERTICAL_COLOR }}
                          >
                            <Users className="w-4 h-4 text-white shrink-0" />
                            <span className="font-sans text-sm text-white">Usuários</span>
                          </button>
                          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <Share2 className="w-4 h-4 text-[#717171] shrink-0" />
                            <span className="font-sans text-sm text-text-muted">Grupos</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configurações (bottom) */}
                  <div className="px-2 mt-auto">
                    <button className="w-full flex items-center rounded-lg px-3 py-2 hover:bg-muted">
                      <div className={`flex items-center ${sidebarDemoOpen ? 'justify-start gap-3' : 'justify-center w-full'}`}>
                        <Settings className="w-5 h-5 text-[#717171] shrink-0" />
                        {sidebarDemoOpen && sidebarContentVisible && (
                          <span className="font-sans text-sm text-text-muted">Configurações</span>
                        )}
                      </div>
                    </button>
                  </div>
                </aside>

                {/* Conteúdo fake */}
                <div className="absolute left-24 top-4 right-4 bottom-4 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <span className="text-text-muted font-sans text-sm">Área de conteúdo (não move)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SEÇÃO: SELECTS */}
        {/* ============================================ */}
        <section id="selects" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">2. SELECTS</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regras */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Regras</h3>
              <div className="space-y-4 text-sm font-sans text-text-secondary">
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Layout do botão:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><code className="bg-background px-1 rounded">flex items-center justify-between</code></li>
                    <li>NUNCA usar <code className="bg-background px-1 rounded">gap-2</code></li>
                    <li>Texto à esquerda, setinha à DIREITA do container</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Dimensões:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Border-radius: 8px (rounded-lg)</li>
                    <li>Padding: px-4 py-2</li>
                    <li>Definir min-w-[Xpx] para largura mínima</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Chevron:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Usar ChevronDown</li>
                    <li>Rotação de 180° quando aberto</li>
                    <li>Cor: text-text-muted</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Dropdown flutuante (fora de modais):</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Container: <code className="bg-background px-1 rounded">relative</code></li>
                    <li>Dropdown: <code className="bg-background px-1 rounded">absolute top-full left-0 mt-1 z-50</code></li>
                    <li>Flutua SOBRE o conteúdo sem empurrar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo Interativa */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Demo Interativa</h3>
              <p className="text-sm font-sans text-text-muted mb-4">Clique no select para abrir o dropdown:</p>
              
              <div className="p-6 rounded-xl border border-border bg-card">
                {/* Select Demo */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setSelectDemoOpen(!selectDemoOpen)}
                    className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-card hover:bg-card-hover transition-colors min-w-[180px]"
                  >
                    <span className="font-sans text-sm text-text-secondary">
                      {selectDemoValue}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${selectDemoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {selectDemoOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                      {selectOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSelectDemoValue(option); setSelectDemoOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm font-sans hover:bg-muted transition-colors ${
                            selectDemoValue === option ? 'text-foreground bg-muted' : 'text-text-muted'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Código */}
                <div className="mt-6 p-4 rounded-lg bg-muted overflow-x-auto">
                  <pre className="text-xs font-mono text-text-secondary">
{`<div className="relative">
  <button className="flex items-center justify-between px-4 py-2 
    rounded-lg border border-border bg-card min-w-[180px]">
    <span>{value}</span>
    <ChevronDown className={\`rotate-\${open ? '180' : '0'}\`} />
  </button>
  
  {open && (
    <div className="absolute top-full left-0 mt-1 w-full 
      bg-card border border-border rounded-lg z-50">
      {/* options */}
    </div>
  )}
</div>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SEÇÃO: BOTÕES */}
        {/* ============================================ */}
        <section id="botoes" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">3. BOTÕES</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regras */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Regras</h3>
              <div className="space-y-4 text-sm font-sans text-text-secondary">
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Texto:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Capitalização normal (ex: &quot;Cancelar&quot;, &quot;Novo usuário&quot;)</li>
                    <li>NUNCA usar UPPERCASE</li>
                    <li>Fonte: font-sans + font-bold</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Layout interno:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>justify-between (ícone ESQUERDA, texto à DIREITA)</li>
                    <li>Gap ícone-texto: 12px mínimo (gap-3)</li>
                    <li>Botão cresce para acomodar conteúdo</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Tamanhos:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>modal: min-w-[130px]</li>
                    <li>card: min-w-[110px]</li>
                    <li>default: min-w-[130px]</li>
                    <li>sm: min-w-[110px]</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Border-radius:</strong> 6px (rounded-[6px])
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Gap entre botões:</strong> 16px (gap-4)
                </div>
              </div>
            </div>

            {/* Demo */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Exemplos</h3>
              
              <div className="space-y-6">
                {/* Primary */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xs font-sans text-text-muted mb-3">Primary (cor da vertical)</p>
                  <SnapButton variant="primary" verticalColor={VERTICAL_COLOR}>
                    Novo usuário
                  </SnapButton>
                </div>

                {/* Secondary */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xs font-sans text-text-muted mb-3">Secondary</p>
                  <SnapButton variant="secondary">
                    Cancelar
                  </SnapButton>
                </div>

                {/* Par de botões */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-xs font-sans text-text-muted mb-3">Par de botões (gap-4)</p>
                  <div className="flex items-center gap-4">
                    <SnapButton variant="secondary">
                      Cancelar
                    </SnapButton>
                    <SnapButton variant="primary" verticalColor={VERTICAL_COLOR}>
                      Confirmar
                    </SnapButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SEÇÃO: BADGES */}
        {/* ============================================ */}
        <section id="badges" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">4. BADGES / LABELS</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regras */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Regras</h3>
              <div className="space-y-4 text-sm font-sans text-text-secondary">
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">Visual:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Border-radius: rounded-full (pill)</li>
                    <li>Padding: px-3 py-1</li>
                    <li>Font-size: text-xs (12px)</li>
                    <li>Fonte: font-sans (NUNCA Cygnito)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Exemplos</h3>
              
              <div className="p-4 rounded-lg border border-border bg-card flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-sans bg-success text-white">Ativo</span>
                <span className="px-3 py-1 rounded-full text-xs font-sans bg-muted text-text-muted">Inativo</span>
                <span className="px-3 py-1 rounded-full text-xs font-sans bg-destructive text-white">Bloqueado</span>
                <span className="px-3 py-1 rounded-full text-xs font-sans bg-[#333540] text-white">Em desenvolvimento</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SEÇÃO: CORES */}
        {/* ============================================ */}
        <section id="cores" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">7. CORES DAS VERTICAIS</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="w-full h-16 rounded-lg mb-3" style={{ backgroundColor: '#FE473C' }} />
              <p className="font-sans text-sm font-semibold">Investigação</p>
              <p className="font-mono text-xs text-text-muted">#FE473C</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="w-full h-16 rounded-lg mb-3" style={{ backgroundColor: '#72284B' }} />
              <p className="font-sans text-sm font-semibold">Inteligência</p>
              <p className="font-mono text-xs text-text-muted">#72284B</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="w-full h-16 rounded-lg mb-3" style={{ backgroundColor: '#889EA3' }} />
              <p className="font-sans text-sm font-semibold">Cooperação</p>
              <p className="font-mono text-xs text-text-muted">#889EA3</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="w-full h-16 rounded-lg mb-3" style={{ backgroundColor: '#287266' }} />
              <p className="font-sans text-sm font-semibold">Infraestrutura</p>
              <p className="font-mono text-xs text-text-muted">#287266</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card text-center">
              <div className="w-full h-16 rounded-lg mb-3 border border-border" style={{ backgroundColor: '#333540' }} />
              <p className="font-sans text-sm font-semibold">Administração</p>
              <p className="font-mono text-xs text-text-muted">#333540</p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SEÇÃO: TIPOGRAFIA */}
        {/* ============================================ */}
        <section id="tipografia" className="mb-16">
          <h2 className="text-2xl font-title mb-6 pb-2 border-b border-border">8. TIPOGRAFIA</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regras */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Regras</h3>
              <div className="space-y-4 text-sm font-sans text-text-secondary">
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">font-title (Cygnito):</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Títulos de página (h1)</li>
                    <li>Apenas tamanhos &gt;= 18px</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <strong className="text-foreground">font-sans (Geist):</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Todo o resto: labels, botões, corpo, badges</li>
                    <li>Tamanhos &lt; 18px SEMPRE usam font-sans</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo */}
            <div>
              <h3 className="font-sans font-semibold text-foreground mb-4">Exemplos</h3>
              
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
                <div>
                  <p className="text-xs font-sans text-text-muted mb-1">font-title (Cygnito) - Títulos</p>
                  <h1 className="font-title text-2xl">USUÁRIOS</h1>
                </div>
                <div>
                  <p className="text-xs font-sans text-text-muted mb-1">font-sans (Geist) - Labels e corpo</p>
                  <p className="font-sans text-sm">Este é um texto de exemplo com font-sans</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-text-muted mb-1">font-sans + font-bold - Botões</p>
                  <span className="font-sans font-bold text-sm">Novo usuário</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Link para tela de exemplo */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-sans font-semibold text-foreground mb-2">Ver exemplo completo</h2>
          <p className="font-sans text-sm text-text-secondary mb-4">
            A tela de Usuários implementa todos esses componentes e regras.
          </p>
          <Link href="/design-system/administracao/usuarios">
            <SnapButton variant="primary" verticalColor={VERTICAL_COLOR}>
              Ver tela de Usuários
            </SnapButton>
          </Link>
        </div>
      </main>
    </div>
  )
}
