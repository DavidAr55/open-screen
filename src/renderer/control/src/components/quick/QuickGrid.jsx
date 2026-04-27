import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { SectionLabel } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

export function QuickGrid() {
  const { library, project, liveBg, projectionClickMode } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const clickTimers = useRef({})
  const items = library.slice(0, 6)

  const handleClick = (item) => {
    if (projectionClickMode === 'single') {
      setSelectedId(item.id)
      project(item.content, liveBg)
      return
    }
    if (clickTimers.current[item.id] !== undefined) {
      clearTimeout(clickTimers.current[item.id])
      delete clickTimers.current[item.id]
      project(item.content, liveBg)
    } else {
      setSelectedId(item.id)
      clickTimers.current[item.id] = setTimeout(() => { delete clickTimers.current[item.id] }, 240)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="animate-fade-up-3">
      <SectionLabel className="mb-2">Acceso rápido</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {items.map(item => (
          <button
            key={item.id}
            className={cn('quick-card', selectedId === item.id && 'ring-2 ring-brand-500')}
            onClick={() => handleClick(item)}
          >
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate mb-0.5">
              {item.title}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600 truncate">
              {item.content.split('\n')[0].substring(0, 36)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
