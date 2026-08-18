import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Highlighter, PenLine, Minus, Eraser, MousePointer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActiveTool, HIGHLIGHT_COLORS } from './types'

interface FloatingDockProps {
  activeTool: ActiveTool
  setActiveTool: (tool: ActiveTool) => void
  activeColor: typeof HIGHLIGHT_COLORS[0]
  setActiveColor: (c: typeof HIGHLIGHT_COLORS[0]) => void
  isMobile?: boolean
}

export function FloatingDock({ activeTool, setActiveTool, activeColor, setActiveColor, isMobile = false }: FloatingDockProps) {
  const allTools: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
    { id: 'read',      icon: <MousePointer size={isMobile ? 16 : 18} strokeWidth={2.5} />, label: 'Lecture'   },
    { id: 'highlight', icon: <Highlighter  size={isMobile ? 16 : 18} strokeWidth={2.5} />, label: 'Surligner' },
    { id: 'underline', icon: <Minus        size={isMobile ? 16 : 18} strokeWidth={2.5} />, label: 'Souligner' },
    { id: 'note',      icon: <PenLine      size={isMobile ? 16 : 18} strokeWidth={2.5} />, label: 'Annoter'   },
    { id: 'erase',     icon: <Eraser       size={isMobile ? 16 : 18} strokeWidth={2.5} />, label: 'Gomme'     },
  ]

  const tools = isMobile ? allTools.slice(0, 4) : allTools

  const isColorTool = activeTool === 'highlight' || activeTool === 'underline'

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
          "absolute z-[200] flex flex-col gap-2 md:gap-3 transition-all",
          isMobile 
            ? "left-1/2 -translate-x-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))] items-center" 
            : "right-28 bottom-10 items-end"
      )}
    >
      <div className={cn(
          "flex bg-[#121620]/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] gap-1 md:gap-2",
          isMobile ? "flex-row items-center p-1.5 rounded-2xl" : "flex-col items-center p-2 rounded-[2rem]"
      )}>
        {tools.map(tool => {
          const isActive = activeTool === tool.id
          return (
            <div key={tool.id} className="relative">
              <button
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                className={cn(
                  "relative z-10 flex items-center justify-center rounded-xl transition-colors duration-200",
                  isMobile ? "w-10 h-10" : "w-12 h-12",
                  isActive ? "text-slate-900" : "text-white/50 hover:text-white"
                )}
              >
                {tool.icon}
              </button>
              
              {isActive && (
                <motion.div
                  layoutId="active-tool-indicator"
                  className={cn(
                    "absolute inset-0 rounded-xl",
                    tool.id === 'erase' ? "bg-red-400" : "bg-laha-gold"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
          )
        })}

        {/* Dynamic Color Palette Extension */}
        <AnimatePresence>
          {isColorTool && (
            <motion.div
              initial={isMobile ? { width: 0, opacity: 0, marginLeft: 0 } : { height: 0, opacity: 0, marginTop: 0 }}
              animate={isMobile ? { width: 'auto', opacity: 1, marginLeft: 8 } : { height: 'auto', opacity: 1, marginTop: 8 }}
              exit={isMobile ? { width: 0, opacity: 0, marginLeft: 0 } : { height: 0, opacity: 0, marginTop: 0 }}
              className={cn(
                "flex items-center overflow-hidden",
                isMobile ? "gap-2 pl-2 border-l border-white/10 flex-row" : "flex-col gap-2 pt-2 border-t border-white/10"
              )}
            >
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => setActiveColor(color)}
                  className={cn(
                    "flex-shrink-0 rounded-full border-2 transition-transform",
                    isMobile ? "w-6 h-6" : "w-7 h-7",
                    activeColor.name === color.name ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent opacity-60 hover:opacity-100 hover:scale-110"
                  )}
                  style={{ background: color.border }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
