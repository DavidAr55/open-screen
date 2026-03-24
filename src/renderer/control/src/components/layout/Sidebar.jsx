import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useApp }     from '../../context/AppContext.jsx'
import { Input, SectionLabel, Divider, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const ProjectIcon = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const TrashIcon   = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const UpIcon      = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
const DownIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
const CopyIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const DragIcon    = () => <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/></svg>

const TYPE_BADGES = {
  text:         { label: 'Texto',         color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  song:         { label: 'Canción',       color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-500' },
  verse:        { label: 'Versículo',     color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-500' },
  announcement: { label: 'Anuncio',       color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500' },
  presentation: { label: 'Presentación',  color: 'bg-green-50 dark:bg-green-950/30 text-green-600' },
}

const TYPE_LABELS = {
  all: 'Todos', text: 'Texto', song: 'Canciones',
  verse: 'Versículos', announcement: 'Anuncios', presentation: 'Presentaciones',
}

const NAV_ITEMS = [
  { label: 'Control', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { label: 'Canciones', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { label: 'Escrituras', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { label: 'Presentaciones', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
]

// ─── Menú contextual ──────────────────────────────────────────────────────────
function ContextMenu({ x, y, item, selectedIds, onProject, onDelete, onDeleteSelected, onMoveUp, onMoveDown, onDeselectAll, canMoveUp, canMoveDown, onClose }) {
  const ref = useRef(null)
  const multi = selectedIds.size > 1

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  const style = {
    position: 'fixed',
    top:  Math.min(y, window.innerHeight - 280),
    left: Math.min(x, window.innerWidth  - 230),
    zIndex: 9999,
  }

  const Sep = () => <div className="my-1 h-px bg-surface-muted dark:bg-dark-border" />

  const MI = ({ icon, label, onClick, danger, disabled }) => (
    <button disabled={disabled} onClick={() => { onClick(); onClose() }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] font-medium transition-colors text-left',
        'disabled:opacity-35 disabled:pointer-events-none',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-slate-700 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card',
      )}>
      {icon && <span className="opacity-60 flex-shrink-0">{icon}</span>}
      {label}
    </button>
  )

  return (
    <div ref={ref} style={style} className="w-56 py-1.5 rounded-xl bg-white dark:bg-dark-surface border border-surface-muted dark:border-dark-border shadow-card-md">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-muted dark:border-dark-border mb-1">
        {multi ? (
          <p className="text-[11px] font-bold text-brand-500">{selectedIds.size} elementos seleccionados</p>
        ) : (
          <>
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.content.replace(/\n/g,' ').substring(0,45)}</p>
          </>
        )}
      </div>

      <MI icon={<ProjectIcon />} label={multi ? `Proyectar "${item.title}"` : 'Proyectar'} onClick={onProject} />
      <MI icon={<CopyIcon />} label="Copiar texto" onClick={() => navigator.clipboard.writeText(item.content)} />

      {!multi && (
        <>
          <Sep />
          <MI icon={<UpIcon />}   label="Subir"  onClick={onMoveUp}   disabled={!canMoveUp} />
          <MI icon={<DownIcon />} label="Bajar"  onClick={onMoveDown} disabled={!canMoveDown} />
          <Sep />
          <MI icon={<TrashIcon />} label="Eliminar" onClick={onDelete} danger />
        </>
      )}

      {multi && (
        <>
          <Sep />
          <MI icon={<TrashIcon />} label={`Eliminar seleccionados (${selectedIds.size})`} onClick={onDeleteSelected} danger />
          <MI label="Deseleccionar todo" onClick={onDeselectAll} />
        </>
      )}
    </div>
  )
}

// ─── Item individual ──────────────────────────────────────────────────────────
function LibraryItem({ item, index, isSelected, isActive, selectedIds, onSelect, onProject, onContextMenu, onDragStart, onDragOver, onDragEnd, onDrop, isDragging, isDragOver }) {
  const clickTimer = useRef(null)
  const badge = TYPE_BADGES[item.type]

  const handleClick = (e) => {
    e.stopPropagation()
    if (e.ctrlKey || e.metaKey) { onSelect(item, 'toggle'); return }
    if (e.shiftKey) { onSelect(item, 'range'); return }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current); clickTimer.current = null
      onProject(item)
    } else {
      clickTimer.current = setTimeout(() => { clickTimer.current = null; onSelect(item, 'single') }, 210)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (!selectedIds.has(item.id)) onSelect(item, 'single')
    onContextMenu(e, item, index)
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index) }}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title="Clic: seleccionar · Ctrl+clic: multi · Doble clic: proyectar · Clic derecho: opciones"
      className={cn(
        'group relative flex items-start gap-2 px-2 py-2 rounded-lg border cursor-pointer transition-all duration-100 select-none',
        isDragOver  && 'border-brand-400 dark:border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 scale-[1.01]',
        isDragging  && 'opacity-25 scale-95',
        isSelected  && !isDragOver && 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900',
        isActive    && !isSelected && !isDragOver && 'bg-surface-soft dark:bg-dark-card border-surface-muted dark:border-dark-border',
        !isSelected && !isActive   && !isDragOver && 'border-transparent hover:bg-surface-soft dark:hover:bg-dark-card',
      )}
    >
      {/* Drag handle */}
      <span className="mt-0.5 flex-shrink-0 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <DragIcon />
      </span>

      {/* Checkbox */}
      <div className={cn(
        'flex-shrink-0 w-3.5 h-3.5 mt-0.5 rounded border-2 transition-all flex items-center justify-center',
        isSelected
          ? 'bg-brand-600 border-brand-600'
          : 'border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100',
      )}>
        {isSelected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={cn('text-[13px] font-semibold truncate', isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-200')}>
            {item.title}
          </p>
          {badge && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', badge.color)}>{badge.label}</span>}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-600 truncate">{item.content.replace(/\n/g,' ')}</p>
      </div>
    </div>
  )
}

// ─── Sidebar principal ────────────────────────────────────────────────────────
export function Sidebar() {
  const { activePage, setActivePage, library, libLoading, deleteItem, deleteMany, project, liveBg } = useApp()

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeId,   setActiveId]   = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const lastClickedIndex = useRef(null)

  // Drag & drop
  const [dragFromIndex, setDragFromIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Context menu
  const [ctxMenu, setCtxMenu] = useState(null)

  // Orden local (drag & drop persiste en sesión)
  const [localOrder, setLocalOrder] = useState([])

  useEffect(() => {
    setLocalOrder(prev => {
      // Añadir nuevos IDs al final, mantener orden existente
      const existing = new Set(prev)
      const newIds = library.filter(i => !existing.has(i.id)).map(i => i.id)
      const validIds = prev.filter(id => library.some(i => i.id === id))
      return [...validIds, ...newIds]
    })
  }, [library])

  const filteredItems = useMemo(() => {
    const filtered = library.filter(item => {
      const matchSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())
      return matchSearch && (typeFilter === 'all' || item.type === typeFilter)
    })
    const orderMap = new Map(localOrder.map((id, i) => [id, i]))
    return [...filtered].sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))
  }, [library, search, typeFilter, localOrder])

  // ── Selección ─────────────────────────────────────────────────────────────
  const handleSelect = useCallback((item, mode) => {
    setActiveId(item.id)
    if (mode === 'single') {
      setSelectedIds(new Set([item.id]))
      lastClickedIndex.current = filteredItems.findIndex(i => i.id === item.id)
    } else if (mode === 'toggle') {
      setSelectedIds(prev => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n })
      lastClickedIndex.current = filteredItems.findIndex(i => i.id === item.id)
    } else if (mode === 'range') {
      const cur  = filteredItems.findIndex(i => i.id === item.id)
      const from = Math.min(lastClickedIndex.current ?? 0, cur)
      const to   = Math.max(lastClickedIndex.current ?? 0, cur)
      setSelectedIds(new Set(filteredItems.slice(from, to + 1).map(i => i.id)))
    }
  }, [filteredItems])

  // ── Proyectar ──────────────────────────────────────────────────────────────
  const handleProject = useCallback((item) => {
    project(item.content, liveBg)
    setActiveId(item.id)
  }, [project, liveBg])

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    await deleteItem(id)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, [deleteItem])

  const handleDeleteSelected = useCallback(async () => {
    await deleteMany([...selectedIds])
    setSelectedIds(new Set())
  }, [selectedIds, deleteMany])

  // ── Mover ─────────────────────────────────────────────────────────────────
  const moveItem = useCallback((index, dir) => {
    const newOrder = [...localOrder]
    const id       = filteredItems[index]?.id
    const pos      = newOrder.indexOf(id)
    const swap     = dir === 'up' ? pos - 1 : pos + 1
    if (swap < 0 || swap >= newOrder.length) return
    ;[newOrder[pos], newOrder[swap]] = [newOrder[swap], newOrder[pos]]
    setLocalOrder(newOrder)
  }, [localOrder, filteredItems])

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDrop = useCallback((toIndex) => {
    if (dragFromIndex === null || dragFromIndex === toIndex) return
    const newOrder = [...localOrder]
    const fromId   = filteredItems[dragFromIndex]?.id
    const toId     = filteredItems[toIndex]?.id
    const fromPos  = newOrder.indexOf(fromId)
    const toPos    = newOrder.indexOf(toId)
    newOrder.splice(fromPos, 1)
    newOrder.splice(toPos, 0, fromId)
    setLocalOrder(newOrder)
    setDragFromIndex(null)
    setDragOverIndex(null)
  }, [dragFromIndex, localOrder, filteredItems])

  return (
    <aside
      className={cn(
        'w-56 flex-shrink-0 flex flex-col py-4 px-3 overflow-hidden',
        'bg-white dark:bg-dark-surface',
        'border-r border-surface-muted dark:border-dark-border transition-colors duration-300',
      )}
      onClick={() => ctxMenu && setCtxMenu(null)}
    >
      {/* Nav */}
      <nav className="mb-4">
        <SectionLabel className="px-2 mb-2">Menú</SectionLabel>
        {NAV_ITEMS.map(item => (
          <div key={item.label} className={cn('nav-item', activePage === item.label && 'active')}
            onClick={() => setActivePage(item.label)}>
            {item.icon}{item.label}
          </div>
        ))}
      </nav>

      <Divider className="mb-4" />

      {/* Header biblioteca */}
      <div className="flex items-center justify-between px-0.5 mb-2">
        <SectionLabel>Biblioteca</SectionLabel>
        {selectedIds.size > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteSelected() }}
            className="text-[10px] font-semibold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            title={`Eliminar ${selectedIds.size} seleccionados`}
          >
            <TrashIcon /> {selectedIds.size}
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-2">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <Input className="pl-7 text-[13px] py-1.5" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setTypeFilter(key)}
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all',
              typeFilter === key
                ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border-brand-300 dark:border-brand-800'
                : 'border-surface-muted dark:border-dark-border text-slate-400 hover:text-slate-600',
            )}
          >{label}</button>
        ))}
      </div>

      {/* Multi-select hint */}
      {selectedIds.size > 1 && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900">
          <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
            {selectedIds.size} seleccionados · Ctrl+clic para añadir
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-0.5">
        {libLoading ? (
          <div className="flex justify-center py-6"><Spinner size={18} /></div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-[12px] text-slate-400 py-6">
            {search ? 'Sin resultados' : 'Biblioteca vacía'}
          </p>
        ) : filteredItems.map((item, index) => (
          <LibraryItem
            key={item.id} item={item} index={index}
            isSelected={selectedIds.has(item.id)}
            isActive={activeId === item.id}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onProject={handleProject}
            onContextMenu={(e, it, idx) => setCtxMenu({ x: e.clientX, y: e.clientY, item: it, index: idx })}
            onDragStart={(i) => setDragFromIndex(i)}
            onDragOver={(i) => setDragOverIndex(i)}
            onDragEnd={() => { setDragFromIndex(null); setDragOverIndex(null) }}
            onDrop={handleDrop}
            isDragging={dragFromIndex === index}
            isDragOver={dragOverIndex === index && dragFromIndex !== index}
          />
        ))}
      </div>

      {/* Footer */}
      <Divider className="mt-auto mb-2" />
      <div className="nav-item">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Ajustes
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          item={ctxMenu.item}
          selectedIds={selectedIds}
          onProject={() => handleProject(ctxMenu.item)}
          onDelete={() => handleDelete(ctxMenu.item.id)}
          onDeleteSelected={handleDeleteSelected}
          onMoveUp={() => moveItem(ctxMenu.index, 'up')}
          onMoveDown={() => moveItem(ctxMenu.index, 'down')}
          onDeselectAll={() => setSelectedIds(new Set())}
          canMoveUp={ctxMenu.index > 0}
          canMoveDown={ctxMenu.index < filteredItems.length - 1}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </aside>
  )
}