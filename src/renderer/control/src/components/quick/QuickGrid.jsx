import { useApp } from '../../context/AppContext.jsx'
import { SectionLabel } from '@shared/components/ui/index.jsx'

export function QuickGrid() {
  const { library, project, liveBg } = useApp()
  const items = library.slice(0, 6)

  if (items.length === 0) return null

  return (
    <div className="animate-fade-up-3">
      <SectionLabel className="mb-2">Acceso rápido</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {items.map(item => (
          <button
            key={item.id}
            className="quick-card"
            onClick={() => project(item.content, liveBg)}
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
