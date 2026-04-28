"use client"

import { useState } from "react"
import { Check, Copy, ArrowLeft, User, MapPin, Car, Building, AlertTriangle, Info, Sparkles } from "lucide-react"
import Link from "next/link"

// Design System Data - Consolidado das referências Figma
const colors = {
  "Backgrounds": [
    { name: "background", value: "#0A0A0A", token: "--background", description: "Fundo principal da aplicação" },
    { name: "card", value: "#1A1A1A", token: "--card", description: "Fundo de cards e containers" },
    { name: "card-elevated", value: "#242424", token: "--card-elevated", description: "Card com elevação" },
    { name: "card-hover", value: "#2A2A2A", token: "--card-hover", description: "Estado hover de cards" },
    { name: "popover", value: "#1A1A1A", token: "--popover", description: "Fundo de popovers, modais e dropdowns" },
    { name: "input", value: "#000000", token: "--input", description: "Fundo de inputs e textareas (preto puro)" },
  ],
  "Primary (Brand)": [
    { name: "primary", value: "#E91E63", token: "--primary", description: "Cor principal da marca (rosa/magenta)" },
    { name: "primary-dark", value: "#C2185B", token: "--primary-dark", description: "Variante escura do primary" },
    { name: "primary-foreground", value: "#ffffff", token: "--primary-foreground", description: "Texto sobre primary" },
  ],
  "Status": [
    { name: "success", value: "#4CAF50", token: "--success", description: "Sucesso, confirmação, vincular" },
    { name: "success-dark", value: "#1B5E20", token: "--success-dark", description: "Background de toast de sucesso" },
    { name: "warning", value: "#FFC107", token: "--warning", description: "Avisos, atenção, prioridade" },
    { name: "warning-dark", value: "#D4A017", token: "--warning-dark", description: "Variante escura (prioridade alta)" },
    { name: "info", value: "#00BCD4", token: "--info", description: "Informações, ações de navegação (ciano)" },
    { name: "error", value: "#F44336", token: "--error", description: "Erros, risco crítico" },
  ],
  "Entity Colors": [
    { name: "entity-person", value: "#E91E63", token: "--entity-person", description: "Links e ícones de Pessoa" },
    { name: "entity-address", value: "#D4A017", token: "--entity-address", description: "Links e ícones de Endereço" },
    { name: "entity-vehicle", value: "#00BCD4", token: "--entity-vehicle", description: "Links e ícones de Veículo" },
    { name: "entity-company", value: "#00BCD4", token: "--entity-company", description: "Links e ícones de Empresa" },
  ],
  "Risk Levels": [
    { name: "risk-critical", value: "#F44336", token: "--risk-critical", description: "Risco Crítico" },
    { name: "risk-high", value: "#FF9800", token: "--risk-high", description: "Risco Alto" },
    { name: "risk-medium", value: "#FFC107", token: "--risk-medium", description: "Risco Médio" },
    { name: "risk-low", value: "#4CAF50", token: "--risk-low", description: "Risco Baixo" },
  ],
  "Tags": [
    { name: "tag-preso", value: "#E91E63", token: "--tag-preso", description: "Tag: Preso" },
    { name: "tag-visitante", value: "#00BCD4", token: "--tag-visitante", description: "Tag: Visitante" },
    { name: "tag-advogado", value: "#4CAF50", token: "--tag-advogado", description: "Tag: Advogado" },
    { name: "tag-familiar", value: "#FFC107", token: "--tag-familiar", description: "Tag: Familiar" },
    { name: "tag-ex-preso", value: "#FF9800", token: "--tag-ex-preso", description: "Tag: Ex-preso" },
  ],
  "Text Hierarchy": [
    { name: "text-primary", value: "#ffffff", token: "--text-primary", description: "Texto principal" },
    { name: "text-secondary", value: "#A0A0A0", token: "--text-secondary", description: "Texto secundário" },
    { name: "text-muted", value: "#888888", token: "--text-muted", description: "Texto com menor destaque" },
    { name: "text-subtle", value: "#666666", token: "--text-subtle", description: "Texto sutil, placeholders" },
  ],
  "Borders": [
    { name: "border", value: "#2A2A2A", token: "--border", description: "Borda padrão" },
    { name: "border-subtle", value: "#333333", token: "--border-subtle", description: "Borda sutil" },
    { name: "ring", value: "#E91E63", token: "--ring", description: "Anel de foco" },
  ],
}

const typography = {
  families: [
    { 
      name: "Inter Tight", 
      class: "font-sans", 
      sample: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789", 
      description: "Fonte principal para textos de corpo, labels, botões e UI geral.",
      usage: ["Corpo de texto", "Labels de formulário", "Botões", "Tags/Badges", "Texto < 18px"]
    },
    { 
      name: "Cygnito Mono (Títulos)", 
      class: "font-title", 
      sample: "snap ai dashboard processos documentos", 
      description: "REGRAS: (1) Sempre em UPPERCASE (2) Apenas em tamanhos >= 18px. Fica ruim reduzida.",
      usage: ["Títulos de seção", "Títulos de modal/dialog", "Títulos de cards (Pessoa, Endereço)", "Números grandes/estatísticas"]
    },
  ],
  scale: [
    { name: "xs", class: "text-xs", size: "12px", lineHeight: "16px", font: "Inter Tight" },
    { name: "sm", class: "text-sm", size: "14px", lineHeight: "20px", font: "Inter Tight" },
    { name: "base", class: "text-base", size: "16px", lineHeight: "24px", font: "Inter Tight" },
    { name: "lg", class: "text-lg", size: "18px", lineHeight: "28px", font: "Cygnito Mono (mínimo)" },
    { name: "xl", class: "text-xl", size: "20px", lineHeight: "28px", font: "Cygnito Mono" },
    { name: "2xl", class: "text-2xl", size: "24px", lineHeight: "32px", font: "Cygnito Mono" },
    { name: "3xl", class: "text-3xl", size: "30px", lineHeight: "36px", font: "Cygnito Mono" },
  ],
}

const spacing = {
  cardPadding: "16px",
  cardGap: "16px",
  rowHeight: "40-48px",
  tabPadding: "16px horizontal",
  modalPadding: "24px",
}

const radii = [
  { name: "Cards", value: "12px", class: "rounded-xl", usage: "Cards, containers, modais" },
  { name: "Inputs", value: "8px", class: "rounded-lg", usage: "Inputs, textareas, selects, botões" },
  { name: "Tags", value: "4-6px", class: "rounded-md", usage: "Tags, badges, pills" },
  { name: "Avatar", value: "50%", class: "rounded-full", usage: "Avatares, ícones circulares" },
]

const buttonPatterns = [
  { context: "Criar/Vincular entidade", negative: "Cancelar/Ignorar (outline cinza)", positive: "Criar/Vincular (filled verde)" },
  { context: "Confirmação positiva", negative: "Cancelar (outline cinza)", positive: "Confirmar (filled verde)" },
  { context: "Confirmação incerta", negative: "Cancelar (outline cinza)", positive: "Confirmar (outline cinza)" },
  { context: "Ação destrutiva", negative: "-", positive: "Remover (filled rosa)" },
  { context: "Ação de módulo", negative: "-", positive: "Tramitar (filled ciano)" },
]

const components = [
  { name: "Modal", structure: "Ícone + Título Cygnito UPPERCASE + Conteúdo + Botões à direita" },
  { name: "EntityCard", structure: "Ícone + Título UPPERCASE + Descrição cinza + Key-values + Botões Ignorar/Vincular" },
  { name: "Tabs", structure: "Underline rosa como indicador (não pill/background). Pode ter ícones." },
  { name: "DataTable", structure: "Sem bordas entre linhas, altura 40-48px, ações à direita" },
  { name: "Toast Sucesso", structure: "Background verde escuro, ícone check, posição top-right" },
  { name: "DropZone", structure: "Borda tracejada cinza, texto centralizado" },
  { name: "Badge IA", structure: "Ícone sparkle + 'IA' em pill rosa para sugestões de IA" },
]

function ColorSwatch({ name, value, token, description }: { name: string; value: string; token: string; description: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-card-hover transition-colors group">
      <div
        className="w-12 h-12 rounded-lg border border-border shrink-0"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">{value}</code>
        </div>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
        <code className="text-xs text-text-subtle font-mono">{token}</code>
      </div>
      <button
        onClick={() => copyToClipboard(token)}
        className="p-2 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copiar token"
      >
        {copied ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4 text-text-muted" />
        )}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-6 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </Link>
            <div>
              <h1 className="text-xl text-foreground">SNAP DESIGN SYSTEM</h1>
              <p className="text-sm text-text-muted font-sans">Consolidado a partir das referências do Figma</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview */}
        <div className="mb-12 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl tracking-wider font-sans">S</span>
            </div>
            <div>
              <h2 className="text-2xl text-foreground">SNAP DESIGN SYSTEM</h2>
              <p className="text-text-secondary font-sans">Sistema de Monitoramento de Pessoas</p>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed font-sans">
            Este documento define os tokens de design validados a partir de 7 telas de referência do Figma.
            As regras foram extraídas por análise de recorrência para identificar padrões implícitos.
          </p>
        </div>

        {/* Tipografia - Regras Importantes */}
        <Section title="TIPOGRAFIA">
          <div className="p-4 rounded-xl bg-warning-dark/20 border border-warning-dark mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground font-medium font-sans">Regras da Cygnito Mono</p>
                <ul className="text-text-secondary text-sm mt-2 space-y-1 font-sans">
                  <li>1. Sempre em <strong>UPPERCASE</strong> (text-transform: uppercase)</li>
                  <li>2. Apenas em tamanhos <strong>{'>'}= 18px</strong> (text-lg ou maior)</li>
                  <li>3. Fica ruim em tamanhos pequenos - usar Inter Tight nesses casos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {typography.families.map((font) => (
              <div key={font.name} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground font-sans">{font.name}</span>
                  <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">
                    {font.class}
                  </code>
                </div>
                <p className={`text-lg text-text-secondary ${font.class}`}>{font.sample}</p>
                <p className="text-xs text-text-muted mt-2 font-sans">{font.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {font.usage.map((use) => (
                    <span key={use} className="text-xs px-2 py-1 rounded bg-muted text-text-secondary font-sans">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Escala tipográfica */}
          <p className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide font-sans">
            Escala Tipográfica
          </p>
          <div className="space-y-2">
            {typography.scale.map((size) => (
              <div key={size.name} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono w-20">
                  {size.class}
                </code>
                <span className={`flex-1 text-foreground ${size.class} ${size.font.includes('Cygnito') ? 'font-title' : 'font-sans'}`}>
                  {size.font.includes('Cygnito') ? 'SNAP AI' : 'Snap AI'}
                </span>
                <span className="text-xs text-text-muted font-sans">{size.size}</span>
                <span className="text-xs text-text-subtle font-sans">{size.font}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Cores */}
        <Section title="CORES">
          <div className="space-y-8">
            {Object.entries(colors).map(([category, colorList]) => (
              <div key={category}>
                <p className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide font-sans">
                  {category}
                </p>
                <div className="grid gap-2">
                  {colorList.map((color) => (
                    <ColorSwatch key={color.name} {...color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Entity Links */}
        <Section title="LINKS POR TIPO DE ENTIDADE">
          <p className="text-text-secondary mb-4 font-sans">
            No texto de documentos, entidades são destacadas com cores específicas por tipo:
          </p>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-text-secondary font-sans leading-relaxed">
              Nesta data, foi verificada a presença da pessoa de NOME: <span className="text-[#E91E63]">João Bernardo Guimarães Aversa</span>, 
              CPF: <span className="text-[#E91E63]">013.511.976-65</span> na localidade de Belo Horizonte, 
              localizado no ENDEREÇO: <span className="text-[#D4A017]">Rua Major Lopes, NÚMERO: 37, BAIRRO: Barro Preto</span>. 
              O alvo foi visto em um VEÍCULO: <span className="text-[#00BCD4]">Corsa Sedan, PLACA: NPX-3031</span>, 
              nas imediações da empresa de RAZÃO SOCIAL: <span className="text-[#00BCD4]">JB Aversa Participações Ltda</span>.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#E91E63]" />
              <span className="text-sm text-text-secondary font-sans">Pessoa = Rosa</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4A017]" />
              <span className="text-sm text-text-secondary font-sans">Endereço = Amarelo</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#00BCD4]" />
              <span className="text-sm text-text-secondary font-sans">Veículo = Ciano</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#00BCD4]" />
              <span className="text-sm text-text-secondary font-sans">Empresa = Ciano</span>
            </div>
          </div>
        </Section>

        {/* Padrões de Botões */}
        <Section title="PADROES DE BOTOES">
          <p className="text-text-secondary mb-4 font-sans">
            A cor do botão positivo muda conforme o contexto da ação:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Contexto</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Botão Negativo</th>
                  <th className="text-left py-3 px-4 text-text-muted font-medium font-sans">Botão Positivo</th>
                </tr>
              </thead>
              <tbody>
                {buttonPatterns.map((pattern, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-foreground font-sans">{pattern.context}</td>
                    <td className="py-3 px-4 text-text-secondary font-sans">{pattern.negative}</td>
                    <td className="py-3 px-4 text-text-secondary font-sans">{pattern.positive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors font-sans flex items-center gap-2">
              <span className="text-text-muted">x</span> Cancelar
            </button>
            <button className="px-4 py-2 rounded-lg bg-success text-white font-medium hover:opacity-90 transition-opacity font-sans flex items-center gap-2">
              <Check className="w-4 h-4" /> Vincular
            </button>
            <button className="px-4 py-2 rounded-lg bg-success text-white font-medium hover:opacity-90 transition-opacity font-sans flex items-center gap-2">
              <Check className="w-4 h-4" /> Criar
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity font-sans flex items-center gap-2">
              <span className="text-white">x</span> Remover vinculação
            </button>
            <button className="px-4 py-2 rounded-lg bg-info text-white font-medium hover:opacity-90 transition-opacity font-sans flex items-center gap-2">
              Tramitar
            </button>
          </div>
        </Section>

        {/* Componentes */}
        <Section title="ESTRUTURA DE COMPONENTES">
          <div className="space-y-4">
            {components.map((comp) => (
              <div key={comp.name} className="p-4 rounded-xl border border-border bg-card">
                <p className="text-foreground font-medium mb-2 font-sans">{comp.name}</p>
                <p className="text-text-secondary text-sm font-sans">{comp.structure}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Badge IA */}
        <Section title="BADGE IA">
          <p className="text-text-secondary mb-4 font-sans">
            Sugestões geradas por inteligência artificial são indicadas com badge especial:
          </p>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium font-sans">IA</span>
            </div>
            <span className="text-text-secondary font-sans">Sugestão preditiva por IA</span>
          </div>
        </Section>

        {/* Espaçamentos */}
        <Section title="ESPACAMENTOS">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-foreground font-medium mb-2 font-sans">Padding interno de cards</p>
              <code className="text-sm text-text-muted font-mono">{spacing.cardPadding}</code>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-foreground font-medium mb-2 font-sans">Gap entre cards</p>
              <code className="text-sm text-text-muted font-mono">{spacing.cardGap}</code>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-foreground font-medium mb-2 font-sans">Altura de row em tabela</p>
              <code className="text-sm text-text-muted font-mono">{spacing.rowHeight}</code>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-foreground font-medium mb-2 font-sans">Padding interno de modais</p>
              <code className="text-sm text-text-muted font-mono">{spacing.modalPadding}</code>
            </div>
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="BORDER RADIUS">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {radii.map((r) => (
              <div key={r.name} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex justify-center mb-3">
                  <div 
                    className="w-16 h-16 bg-primary" 
                    style={{ borderRadius: r.value }}
                  />
                </div>
                <p className="text-foreground font-medium text-center font-sans">{r.name}</p>
                <p className="text-text-muted text-sm text-center font-sans">{r.value}</p>
                <code className="text-xs text-text-subtle block text-center font-mono mt-1">{r.class}</code>
                <p className="text-xs text-text-muted text-center mt-2 font-sans">{r.usage}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Tabs */}
        <Section title="TABS">
          <p className="text-text-secondary mb-4 font-sans">
            Tabs usam underline como indicador (não pill/background). A cor do underline é a primária (rosa).
          </p>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex gap-6 border-b border-border">
              <button className="pb-3 border-b-2 border-primary text-foreground font-medium font-sans">
                Confeccionar
              </button>
              <button className="pb-3 border-b-2 border-transparent text-text-muted hover:text-text-secondary font-sans">
                Revisar
              </button>
              <button className="pb-3 border-b-2 border-transparent text-text-muted hover:text-text-secondary font-sans">
                Analisar
              </button>
              <button className="pb-3 border-b-2 border-transparent text-text-muted hover:text-text-secondary font-sans">
                Formalizar
              </button>
            </div>
          </div>
        </Section>

        {/* Risk Badges */}
        <Section title="BADGES DE RISCO">
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans">
              <span className="w-2 h-2 rounded-full bg-[#F44336]"></span>
              Risco Crítico
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans">
              <span className="w-2 h-2 rounded-full bg-[#FF9800]"></span>
              Risco Alto
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans">
              <span className="w-2 h-2 rounded-full bg-[#FFC107]"></span>
              Risco Médio
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-sans">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50]"></span>
              Risco Baixo
            </span>
          </div>
        </Section>

        {/* Tags */}
        <Section title="TAGS DE CATEGORIA">
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-md bg-[#E91E63] text-white text-sm font-sans">preso</span>
            <span className="px-3 py-1 rounded-md bg-[#00BCD4] text-white text-sm font-sans">visitante</span>
            <span className="px-3 py-1 rounded-md bg-[#4CAF50] text-white text-sm font-sans">advogado</span>
            <span className="px-3 py-1 rounded-md bg-[#FFC107] text-black text-sm font-sans">familiar</span>
            <span className="px-3 py-1 rounded-md bg-[#FF9800] text-white text-sm font-sans">ex-preso</span>
          </div>
        </Section>

        {/* Referências Analisadas */}
        <Section title="REFERENCIAS ANALISADAS">
          <p className="text-text-secondary mb-4 font-sans">
            Este Design System foi consolidado a partir da análise de 7 telas do Figma:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-text-secondary font-sans">
            <li>Tela &quot;Pessoas&quot; (lista de monitorados com cards)</li>
            <li>Tela &quot;Processos / Documentos&quot; - Conteúdo principal</li>
            <li>Tela &quot;Processos / Documentos&quot; - Aba Anexos (tabela + dropzone)</li>
            <li>Tela &quot;Processos / Documentos&quot; - Toast + EntityCards</li>
            <li>Tela &quot;Processos / Documentos&quot; - Variante de criação</li>
            <li>Modal &quot;Tramitar Processo&quot; (tabs com ícones)</li>
            <li>Modais: Novo Documento, Verificação de Entidade, Busca Inteligente</li>
          </ol>
        </Section>

      </main>
    </div>
  )
}
