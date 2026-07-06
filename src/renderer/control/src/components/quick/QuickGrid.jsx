import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { FieldLabel } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

export function QuickGrid() {
  const { library, project, projectionClickMode } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const clickTimers = useRef({})
  const items = library.slice(0, 6)

  const handleClick = (item) => {
    if (projectionClickMode === 'single') {
      setSelectedId(item.id)
      project(item.content)
      return
    }
    if (clickTimers.current[item.id] !== undefined) {
      clearTimeout(clickTimers.current[item.id])
      delete clickTimers.current[item.id]
      project(item.content)
    } else {
      setSelectedId(item.id)
      clickTimers.current[item.id] = setTimeout(() => { delete clickTimers.current[item.id] }, 240)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="animate-fade-up-3">
      <FieldLabel className="mb-2">Acceso rápido</FieldLabel>
      <div className="grid grid-cols-3 gap-2">
        {items.map(item => (
          <button
            key={item.id}
            className={cn('quick-card', selectedId === item.id && 'ring-2 ring-primary-500/60 border-primary-500/50')}
            onClick={() => handleClick(item)}
          >
            <p className="text-[12px] font-bold text-ink-1 truncate mb-0.5">
              {item.title}
            </p>
            <p className="text-[11px] text-ink-4 truncate">
              {item.content.split('\n')[0].substring(0, 36)}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
