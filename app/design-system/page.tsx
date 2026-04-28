"use client"

import { useState } from "react"
import { Check, Copy, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Design System Data
const colors = {
  "Backgrounds": [
    { name: "background", value: "#111114", token: "--background", description: "Fundo principal da aplicação" },
    { name: "card", value: "#2a2b35", token: "--card", description: "Fundo de cards e containers" },
    { name: "card-elevated", value: "#313131", token: "--card-elevated", description: "Card com elevação" },
    { name: "card-hover", value: "#363640", token: "--card-hover", description: "Estado hover de cards" },
    { name: "popover", value: "#24242b", token: "--popover", description: "Fundo de popovers e dropdowns" },
    { name: "muted", value: "#2d2e36", token: "--muted", description: "Elementos com menor destaque" },
    { name: "accent", value: "#474852", token: "--accent", description: "Elementos de destaque secundário" },
  ],
  "Primary (Brand)": [
    { name: "primary", value: "#9b4d72", token: "--primary", description: "Cor principal da marca (rosa/magenta)" },
    { name: "primary-dark", value: "#72284b", token: "--primary-dark", description: "Variante escura do primary" },
    { name: "primary-foreground", value: "#ffffff", token: "--primary-foreground", description: "Texto sobre primary" },
  ],
  "Secondary": [
    { name: "secondary", value: "#3b3d4a", token: "--secondary", description: "Cor secundária" },
    { name: "secondary-foreground", value: "#ffffff", token: "--secondary-foreground", description: "Texto sobre secondary" },
  ],
  "Status": [
    { name: "success", value: "#4ade80", token: "--success", description: "Sucesso, confirmação" },
    { name: "warning", value: "#f59e0c", token: "--warning", description: "Avisos, atenção" },
    { name: "info", value: "#60a5fa", token: "--info", description: "Informações" },
    { name: "destructive", value: "#f87171", token: "--destructive", description: "Erros, ações destrutivas" },
  ],
  "Text Hierarchy": [
    { name: "text-primary", value: "#ffffff", token: "--text-primary", description: "Texto principal" },
    { name: "text-secondary", value: "#a0adb5", token: "--text-secondary", description: "Texto secundário" },
    { name: "text-muted", value: "#7c868c", token: "--text-muted", description: "Texto com menor destaque" },
    { name: "text-subtle", value: "#657984", token: "--text-subtle", description: "Texto sutil" },
  ],
  "Borders": [
    { name: "border", value: "#363640", token: "--border", description: "Borda padrão" },
    { name: "border-subtle", value: "#474852", token: "--border-subtle", description: "Borda sutil" },
    { name: "input", value: "#2d2e36", token: "--input", description: "Fundo de inputs" },
    { name: "ring", value: "#9b4d72", token: "--ring", description: "Anel de foco" },
  ],
  "Charts": [
    { name: "chart-1", value: "#9b4d72", token: "--chart-1", description: "Gráfico cor 1 (Primary)" },
    { name: "chart-2", value: "#60a5fa", token: "--chart-2", description: "Gráfico cor 2 (Azul)" },
    { name: "chart-3", value: "#4ade80", token: "--chart-3", description: "Gráfico cor 3 (Verde)" },
    { name: "chart-4", value: "#f59e0c", token: "--chart-4", description: "Gráfico cor 4 (Laranja)" },
    { name: "chart-5", value: "#facc13", token: "--chart-5", description: "Gráfico cor 5 (Amarelo)" },
  ],
  "Sidebar": [
    { name: "sidebar", value: "#000000", token: "--sidebar", description: "Fundo da sidebar" },
    { name: "sidebar-foreground", value: "#ffffff", token: "--sidebar-foreground", description: "Texto da sidebar" },
    { name: "sidebar-primary", value: "#9b4d72", token: "--sidebar-primary", description: "Primary da sidebar" },
    { name: "sidebar-accent", value: "#24242b", token: "--sidebar-accent", description: "Accent da sidebar" },
    { name: "sidebar-border", value: "#363640", token: "--sidebar-border", description: "Borda da sidebar" },
  ],
}

const typography = {
  families: [
    { name: "Inter Tight", class: "font-sans", sample: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789", description: "Fonte principal para textos de corpo, labels e UI geral." },
    { name: "Cygnito Mono (Títulos)", class: "font-title", sample: "SNAP AI DASHBOARD TÍTULOS MODAIS", description: "Fonte de títulos usada em headings, barras de título de modais e elementos de destaque." },
    { name: "Cygnito Mono (Código)", class: "font-mono", sample: "const snap = { ai: true }; // Código", description: "Mesma fonte para código e dados técnicos." },
  ],
  scale: [
    { name: "xs", class: "text-xs", size: "12px", lineHeight: "16px" },
    { name: "sm", class: "text-sm", size: "14px", lineHeight: "20px" },
    { name: "base", class: "text-base", size: "16px", lineHeight: "24px" },
    { name: "lg", class: "text-lg", size: "18px", lineHeight: "28px" },
    { name: "xl", class: "text-xl", size: "20px", lineHeight: "28px" },
    { name: "2xl", class: "text-2xl", size: "24px", lineHeight: "32px" },
    { name: "3xl", class: "text-3xl", size: "30px", lineHeight: "36px" },
    { name: "4xl", class: "text-4xl", size: "36px", lineHeight: "40px" },
  ],
  weights: [
    { name: "Normal", class: "font-normal", weight: "400" },
    { name: "Medium", class: "font-medium", weight: "500" },
    { name: "Semibold", class: "font-semibold", weight: "600" },
    { name: "Bold", class: "font-bold", weight: "700" },
  ],
}

const spacing = [
  { name: "0", value: "0px", class: "p-0" },
  { name: "0.5", value: "2px", class: "p-0.5" },
  { name: "1", value: "4px", class: "p-1" },
  { name: "2", value: "8px", class: "p-2" },
  { name: "3", value: "12px", class: "p-3" },
  { name: "4", value: "16px", class: "p-4" },
  { name: "5", value: "20px", class: "p-5" },
  { name: "6", value: "24px", class: "p-6" },
  { name: "8", value: "32px", class: "p-8" },
  { name: "10", value: "40px", class: "p-10" },
  { name: "12", value: "48px", class: "p-12" },
  { name: "16", value: "64px", class: "p-16" },
]

const radii = [
  { name: "sm", value: "calc(0.5rem - 4px)", class: "rounded-sm", token: "--radius-sm" },
  { name: "md", value: "calc(0.5rem - 2px)", class: "rounded-md", token: "--radius-md" },
  { name: "lg", value: "0.5rem", class: "rounded-lg", token: "--radius-lg" },
  { name: "xl", value: "calc(0.5rem + 4px)", class: "rounded-xl", token: "--radius-xl" },
  { name: "2xl", value: "1rem", class: "rounded-2xl", token: "rounded-2xl" },
  { name: "full", value: "9999px", class: "rounded-full", token: "rounded-full" },
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
              <h1 className="text-xl font-semibold text-foreground">SNAP Design System</h1>
              <p className="text-sm text-text-muted">Documentação de tokens e componentes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview */}
        <div className="mb-12 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl tracking-wider">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">SNAP Design System</h2>
              <p className="text-text-secondary">Sistema de Monitoramento de Pessoas</p>
            </div>
          </div>
          <p className="text-text-secondary leading-relaxed">
            Este documento define os tokens de design, paleta de cores, tipografia e padrões visuais utilizados
            no ecossistema SNAP. O design foi criado para ambientes de baixa luminosidade com foco em
            legibilidade e hierarquia visual clara.
          </p>
        </div>

        {/* Colors */}
        <Section title="Cores">
          <div className="space-y-8">
            {Object.entries(colors).map(([category, colorList]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid gap-2">
                  {colorList.map((color) => (
                    <ColorSwatch key={color.name} {...color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Tipografia">
          {/* Font Families */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
              Famílias Tipográficas
            </h3>
            <div className="space-y-4">
              {typography.families.map((font) => (
                <div key={font.name} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">{font.name}</span>
                    <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">
                      {font.class}
                    </code>
                  </div>
                  <p className={`text-lg text-text-secondary ${font.class}`}>{font.sample}</p>
                  <p className="text-xs text-text-muted mt-2">{font.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Type Scale */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
              Escala Tipográfica
            </h3>
            <div className="space-y-3">
              {typography.scale.map((size) => (
                <div key={size.name} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                  <div className="w-20 shrink-0">
                    <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-text-muted font-mono">
                      {size.class}
                    </code>
                  </div>
                  <div className="flex-1">
                    <span className={`text-foreground ${size.class}`}>SNAP AI Assistant</span>
                  </div>
                  <div className="text-xs text-text-muted shrink-0">
                    {size.size} / {size.lineHeight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Font Weights */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
              Pesos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {typography.weights.map((weight) => (
                <div key={weight.name} className="p-4 rounded-xl border border-border bg-card text-center">
                  <span className={`text-xl text-foreground ${weight.class}`}>Aa</span>
                  <div className="mt-2">
                    <span className="text-sm text-foreground block">{weight.name}</span>
                    <code className="text-xs text-text-muted font-mono">{weight.weight}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Espaçamento">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {spacing.map((space) => (
              <div key={space.name} className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-center mb-3">
                  <div
                    className="bg-primary/30 border border-primary rounded"
                    style={{ width: space.value, height: space.value, minWidth: '8px', minHeight: '8px' }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground block">{space.name}</span>
                  <code className="text-xs text-text-muted font-mono">{space.value}</code>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {radii.map((radius) => (
              <div key={radius.name} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-center mb-3">
                  <div
                    className={`w-16 h-16 bg-primary ${radius.class}`}
                  />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground block">{radius.name}</span>
                  <code className="text-xs text-text-muted font-mono">{radius.class}</code>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section title="Sombras e Elevação">
          <p className="text-text-secondary mb-4">
            O SNAP utiliza um tema escuro onde a elevação é indicada principalmente por mudanças sutis de cor de fundo,
            não por sombras tradicionais.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-background border border-border">
              <span className="text-sm font-medium text-foreground block mb-2">Background</span>
              <code className="text-xs text-text-muted font-mono">bg-background</code>
              <p className="text-xs text-text-muted mt-2">Nível base da aplicação</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <span className="text-sm font-medium text-foreground block mb-2">Card</span>
              <code className="text-xs text-text-muted font-mono">bg-card</code>
              <p className="text-xs text-text-muted mt-2">Containers e cards</p>
            </div>
            <div className="p-6 rounded-xl bg-card-elevated border border-border">
              <span className="text-sm font-medium text-foreground block mb-2">Card Elevated</span>
              <code className="text-xs text-text-muted font-mono">bg-card-elevated</code>
              <p className="text-xs text-text-muted mt-2">Elementos com maior destaque</p>
            </div>
          </div>
        </Section>

        {/* Components Preview */}
        <Section title="Componentes">
          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
                Botões
              </h3>
              <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-card">
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-dark transition-colors">
                  Primary
                </button>
                <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-accent transition-colors">
                  Secondary
                </button>
                <button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity">
                  Destructive
                </button>
                <button className="px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors">
                  Outline
                </button>
                <button className="px-4 py-2 rounded-lg text-text-secondary font-medium hover:text-foreground hover:bg-muted transition-colors">
                  Ghost
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
                Inputs
              </h3>
              <div className="p-4 rounded-xl border border-border bg-card space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Label</label>
                  <input
                    type="text"
                    placeholder="Placeholder..."
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Textarea</label>
                  <textarea
                    placeholder="Digite sua mensagem..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
                Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors cursor-pointer">
                  <h4 className="text-sm font-medium text-foreground mb-1">Card Padrão</h4>
                  <p className="text-xs text-text-muted">
                    Card com hover state para elementos interativos.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card-elevated">
                  <h4 className="text-sm font-medium text-foreground mb-1">Card Elevado</h4>
                  <p className="text-xs text-text-muted">
                    Card com maior destaque visual.
                  </p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wide">
                Badges
              </h3>
              <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-border bg-card">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  Primary
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                  Sucesso
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning">
                  Aviso
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                  Erro
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/20 text-info">
                  Info
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* Usage Guidelines */}
        <Section title="Diretrizes de Uso">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="text-sm font-medium text-foreground mb-2">Hierarquia de Texto</h4>
              <ul className="text-xs text-text-muted space-y-1.5">
                <li>• Use <code className="px-1 py-0.5 rounded bg-muted">text-foreground</code> para títulos</li>
                <li>• Use <code className="px-1 py-0.5 rounded bg-muted">text-text-secondary</code> para corpo</li>
                <li>• Use <code className="px-1 py-0.5 rounded bg-muted">text-text-muted</code> para labels</li>
                <li>• Use <code className="px-1 py-0.5 rounded bg-muted">text-text-subtle</code> para metadados</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="text-sm font-medium text-foreground mb-2">Cores de Status</h4>
              <ul className="text-xs text-text-muted space-y-1.5">
                <li>• <span className="text-success">Verde</span> para sucesso e confirmações</li>
                <li>• <span className="text-warning">Amarelo</span> para avisos e atenção</li>
                <li>• <span className="text-destructive">Vermelho</span> para erros e alertas críticos</li>
                <li>• <span className="text-info">Azul</span> para informações neutras</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="text-sm font-medium text-foreground mb-2">Espaçamento</h4>
              <ul className="text-xs text-text-muted space-y-1.5">
                <li>• Use múltiplos de 4px para consistência</li>
                <li>• Padding interno de cards: 16px (p-4)</li>
                <li>• Gap entre elementos: 8-12px (gap-2, gap-3)</li>
                <li>• Margem entre seções: 24-32px (mb-6, mb-8)</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="text-sm font-medium text-foreground mb-2">Bordas e Cantos</h4>
              <ul className="text-xs text-text-muted space-y-1.5">
                <li>• Cards e containers: rounded-xl (12px)</li>
                <li>• Botões e inputs: rounded-lg (8px)</li>
                <li>• Badges: rounded-full</li>
                <li>• Use border-border para todas as bordas</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* CSS Variables */}
        <Section title="Variáveis CSS">
          <div className="p-4 rounded-xl border border-border bg-card overflow-x-auto">
            <pre className="text-xs text-text-secondary font-mono leading-relaxed">
{`:root {
  /* Backgrounds */
  --background: #111114;
  --card: #2a2b35;
  --card-elevated: #313131;
  --card-hover: #363640;
  --popover: #24242b;
  --muted: #2d2e36;
  --accent: #474852;

  /* Primary Brand */
  --primary: #9b4d72;
  --primary-dark: #72284b;
  --primary-foreground: #ffffff;

  /* Secondary */
  --secondary: #3b3d4a;
  --secondary-foreground: #ffffff;

  /* Status */
  --success: #4ade80;
  --warning: #f59e0c;
  --info: #60a5fa;
  --destructive: #f87171;

  /* Text Hierarchy */
  --text-primary: #ffffff;
  --text-secondary: #a0adb5;
  --text-muted: #7c868c;
  --text-subtle: #657984;

  /* Borders */
  --border: #363640;
  --border-subtle: #474852;
  --input: #2d2e36;
  --ring: #9b4d72;

  /* Radius */
  --radius: 0.5rem;
}`}
            </pre>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-text-muted">
            SNAP Design System v1.0 — Documentação gerada automaticamente
          </p>
        </div>
      </footer>
    </div>
  )
}
