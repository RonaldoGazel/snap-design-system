"use client"

import { useState, useRef, useEffect, createContext, useContext } from "react"
import { cn } from "@/lib/utils"

/**
 * SNAP Tabs Component
 * 
 * Regras:
 * - Underline de 8px de altura
 * - Underline fica ACIMA da linha base (z-10)
 * - Barrinha animada segue a largura REAL de cada tab
 * - Ícone da tab ativa fica na cor primária (#72284b)
 * - Gap entre tabs: 24px
 */

interface TabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
  registerTab: (id: string, element: HTMLButtonElement | null) => void
  tabElements: Map<string, HTMLButtonElement | null>
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error("Tab components must be used within SnapTabs")
  }
  return context
}

// Tabs Root
interface SnapTabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

export function SnapTabs({ 
  defaultValue, 
  children, 
  className,
  onValueChange,
}: SnapTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  const tabElements = useRef(new Map<string, HTMLButtonElement | null>())

  const handleSetActiveTab = (id: string) => {
    setActiveTab(id)
    onValueChange?.(id)
  }

  const registerTab = (id: string, element: HTMLButtonElement | null) => {
    tabElements.current.set(id, element)
  }

  return (
    <TabsContext.Provider 
      value={{ 
        activeTab, 
        setActiveTab: handleSetActiveTab, 
        registerTab,
        tabElements: tabElements.current,
      }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// Tabs List (container das tabs)
interface SnapTabsListProps {
  children: React.ReactNode
  className?: string
}

export function SnapTabsList({ children, className }: SnapTabsListProps) {
  const { activeTab, tabElements } = useTabsContext()
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeElement = tabElements.get(activeTab)
    if (activeElement && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect()
      const tabRect = activeElement.getBoundingClientRect()
      setIndicator({
        left: tabRect.left - listRect.left,
        width: tabRect.width,
      })
    }
  }, [activeTab, tabElements])

  return (
    <div className={cn("relative", className)} ref={listRef}>
      {/* Linha base */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2a2b35] z-0" />
      
      {/* Tabs */}
      <div className="flex gap-6">
        {children}
      </div>
      
      {/* Barrinha animada */}
      <div 
        className="absolute bottom-0 h-[8px] bg-[#72284b] z-10 transition-all duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
        }}
      />
    </div>
  )
}

// Tab Trigger (botão individual)
interface SnapTabsTriggerProps {
  value: string
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function SnapTabsTrigger({ 
  value, 
  children, 
  icon,
  className,
}: SnapTabsTriggerProps) {
  const { activeTab, setActiveTab, registerTab } = useTabsContext()
  const isActive = activeTab === value
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    registerTab(value, ref.current)
  }, [value, registerTab])

  return (
    <button
      ref={ref}
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex items-center gap-2 text-sm font-sans relative pb-5 transition-colors",
        isActive 
          ? "text-white" 
          : "text-[#898c9d] hover:text-[#b1b3c2]",
        className
      )}
    >
      {icon && (
        <span className={isActive ? "text-[#72284b]" : ""}>
          {icon}
        </span>
      )}
      <span className={isActive ? "font-semibold" : ""}>{children}</span>
    </button>
  )
}

// Tab Content
interface SnapTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function SnapTabsContent({ 
  value, 
  children,
  className,
}: SnapTabsContentProps) {
  const { activeTab } = useTabsContext()
  
  if (activeTab !== value) return null
  
  return <div className={className}>{children}</div>
}
