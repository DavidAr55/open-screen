import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useApp }     from '../../context/AppContext.jsx'
import { Input, FieldLabel, Divider, Spinner, Button } from '@shared/components/ui/index.jsx'
import { ContextMenu } from '@shared/components/ContextMenu.jsx'
import { cn } from '@shared/utils/cn.js'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const ProjectIcon = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const TrashIcon   = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const UpIcon      = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
const DownIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
const CopyIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const DragIcon    = () => <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/></svg>
const PlusIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
const GearIcon    = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>

// Estilo de tinte por tipo — mismas familias que SEARCH_TYPES (buscador global)
const TYPE_BADGES = {
  text:         { label: 'Texto',         color: 'bg-surface-3 text-ink-3' },
  song:         { label: 'Canción',       color: 'bg-purple-500/10 text-purple-500' },
  verse:        { label: 'Versículo',     color: 'bg-red-500/10 text-red-500' },
  announcement: { label: 'Anuncio',       color: 'bg-amber-500/10 text-amber-500' },
  presentation: { label: 'Presentación',  color: 'bg-blue-500/10 text-blue-500' },
  media:        { label: 'Multimedia',    color: 'bg-emerald-500/10 text-emerald-500' },
}

const TYPE_LABELS = {
  all: 'Todos', text: 'Texto', song: 'Canciones',
  verse: 'Versículos', announcement: 'Anuncios',
  presentation: 'Presentaciones', media: 'Multimedia',
}

// Tipos que enlazan a un ítem real en otra página (guardan `ref`) — al hacer
// clic navegan a esa vista con el ítem preseleccionado, en vez de proyectar
// el texto plano guardado en `content`.
const NAVIGABLE_TYPES = {
  verse:        (ref) => ({ page: 'Escrituras',     selection: { type: 'verse', payload: ref } }),
  song:         (ref) => ({ page: 'Canciones',      selection: { type: 'song', payload: { songId: ref.songId } } }),
  presentation: (ref) => ({ page: 'Presentaciones', selection: { type: 'presentation', payload: { presId: ref.presId } } }),
  media:        (ref) => ({ page: 'Multimedia',     selection: { type: 'media', payload: { mediaId: ref.mediaId, mediaType: ref.mediaType } } }),
}

// ─── Item individual ──────────────────────────────────────────────────────────
function LibraryItem({ item, index, isSelected, isActive, selectedIds, projectionClickMode, onSelect, onProject, onNavigate, onContextMenu, onDragStart, onDragOver, onDragEnd, onDrop, isDragging, isDragOver }) {
  const clickTimer = useRef(null)
  const badge = TYPE_BADGES[item.type]
  const navigable = item.ref && NAVIGABLE_TYPES[item.type]

  const handleClick = (e) => {
    e.stopPropagation()
    if (e.ctrlKey || e.metaKey) { onSelect(item, 'toggle'); return }
    if (e.shiftKey) { onSelect(item, 'range'); return }
    if (navigable) { onNavigate(item); return }
    if (projectionClickMode === 'single') {
      onProject(item)
      return
    }
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
      id={`lib-item-${item.id}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index) }}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={navigable
        ? 'Clic: ir a su sección · Ctrl+clic: multi · Clic derecho: opciones'
        : 'Clic: seleccionar · Ctrl+clic: multi · Doble clic: proyectar · Clic derecho: opciones'}
      className={cn(
        'group relative flex items-start gap-2 px-2 py-2 rounded-btn border cursor-pointer transition-all duration-100 select-none',
        isDragOver  && 'border-primary-400 bg-primary-500/10 scale-[1.01]',
        isDragging  && 'opacity-25 scale-95',
        isSelected  && !isDragOver && 'bg-primary-500/10 border-primary-500/40',
        isActive    && !isSelected && !isDragOver && 'bg-surface-3 border-line-1',
        !isSelected && !isActive   && !isDragOver && 'border-transparent hover:bg-surface-3',
      )}
    >
      {/* Drag handle */}
      <span className="mt-0.5 flex-shrink-0 text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <DragIcon />
      </span>

      {/* Checkbox */}
      <div className={cn(
        'flex-shrink-0 w-3.5 h-3.5 mt-0.5 rounded-[3px] border-2 transition-all flex items-center justify-center',
        isSelected
          ? 'bg-primary-500 border-primary-500'
          : 'border-line-2 opacity-0 group-hover:opacity-100',
      )}>
        {isSelected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={cn('text-[13px] font-semibold truncate', isSelected ? 'text-primary-500' : 'text-ink-1')}>
            {item.title}
          </p>
          {badge && <span className={cn('text-[8.5px] font-mono font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-[3px] flex-shrink-0', badge.color)}>{badge.label}</span>}
        </div>
        <p className="text-[11px] text-ink-4 truncate">{item.content.replace(/\n/g,' ')}</p>
      </div>
    </div>
  )
}

// ─── Sidebar: rail de biblioteca ──────────────────────────────────────────────
export function Sidebar() {
  const { activePage, setActivePage, library, libLoading, deleteItem, deleteMany, project, projectionClickMode,
          pendingSelection, clearPendingSelection, navigateTo, displays } = useApp()

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

  // ── Deep-link del buscador global: resaltar el ítem en la biblioteca ──────
  useEffect(() => {
    if (pendingSelection?.type !== 'library') return
    const itemId = pendingSelection.payload.itemId
    setActiveId(itemId)
    // Limpiar filtros que podrían ocultar el ítem y llevarlo a la vista
    setSearch('')
    setTypeFilter('all')
    requestAnimationFrame(() => {
      document.getElementById(`lib-item-${itemId}`)?.scrollIntoView({ block: 'nearest' })
    })
    clearPendingSelection()
  }, [pendingSelection]) // eslint-disable-line react-hooks/exhaustive-deps

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
    project(item.content)
    setActiveId(item.id)
  }, [project])

  // ── Ir a la sección de origen (versículo/canción/presentación/multimedia) ──
  const handleNavigate = useCallback((item) => {
    const build = item.ref && NAVIGABLE_TYPES[item.type]
    if (!build) return
    setActiveId(item.id)
    const { page, selection } = build(item.ref)
    navigateTo(page, selection)
  }, [navigateTo])

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

  // ── Items del menú contextual (compartido) ─────────────────────────────────
  const multi = selectedIds.size > 1
  const ctxItems = ctxMenu ? [
    { icon: <ProjectIcon />, label: multi ? `Proyectar "${ctxMenu.item.title}"` : 'Proyectar', onClick: () => handleProject(ctxMenu.item) },
    { icon: <CopyIcon />, label: 'Copiar texto', onClick: () => navigator.clipboard.writeText(ctxMenu.item.content) },
    ...(!multi ? [
      'sep',
      { icon: <UpIcon />,   label: 'Subir', onClick: () => moveItem(ctxMenu.index, 'up'),   disabled: ctxMenu.index <= 0 },
      { icon: <DownIcon />, label: 'Bajar', onClick: () => moveItem(ctxMenu.index, 'down'), disabled: ctxMenu.index >= filteredItems.length - 1 },
      'sep',
      { icon: <TrashIcon />, label: 'Eliminar', onClick: () => handleDelete(ctxMenu.item.id), danger: true },
    ] : [
      'sep',
      { icon: <TrashIcon />, label: `Eliminar seleccionados (${selectedIds.size})`, onClick: handleDeleteSelected, danger: true },
      { label: 'Deseleccionar todo', onClick: () => setSelectedIds(new Set()) },
    ]),
  ] : []

  return (
    <aside
      className={cn(
        'w-60 flex-shrink-0 flex flex-col py-3 px-3 overflow-hidden',
        'bg-surface-1 border-r border-line-1 transition-colors duration-300',
      )}
      onClick={() => ctxMenu && setCtxMenu(null)}
    >
      {/* Tarjeta de sesión */}
      <div className="flex items-center gap-2.5 p-2.5 mb-2.5 rounded-panel bg-surface-2 border border-line-1 select-none">
        <div className="w-8 h-8 rounded-panel bg-primary-500/15 text-primary-500 flex items-center justify-center flex-shrink-0">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-ink-1 truncate">Open Screen</p>
          <p className="text-[9.5px] font-mono uppercase tracking-[1px] text-ink-4 truncate">
            {displays.length > 0 ? `${displays.length} ${displays.length === 1 ? 'monitor' : 'monitores'}` : 'Cargando…'}
          </p>
        </div>
      </div>

      {/* CTA nueva diapositiva */}
      <Button
        variant="primary"
        size="sm"
        className="w-full mb-3"
        onClick={() => setActivePage('Control')}
        title="Crear una nueva diapositiva de texto en Control"
      >
        <PlusIcon /> Nueva diapositiva
      </Button>

      {/* Header biblioteca */}
      <div className="flex items-center justify-between px-0.5 mb-2">
        <FieldLabel>Biblioteca</FieldLabel>
        {selectedIds.size > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteSelected() }}
            className="text-[10px] font-semibold text-live-500 hover:text-live-600 flex items-center gap-1 transition-colors"
            title={`Eliminar ${selectedIds.size} seleccionados`}
          >
            <TrashIcon /> {selectedIds.size}
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-2">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-4" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <Input className="pl-7 text-[13px] py-1.5" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setTypeFilter(key)}
            className={cn(
              'text-[9px] font-mono font-semibold uppercase tracking-[0.5px] px-2 py-0.5 rounded-[3px] border transition-all',
              typeFilter === key
                ? 'bg-primary-500/10 text-primary-500 border-primary-500/40'
                : 'border-line-1 text-ink-4 hover:text-ink-2',
            )}
          >{label}</button>
        ))}
      </div>

      {/* Multi-select hint */}
      {selectedIds.size > 1 && (
        <div className="mb-2 px-2 py-1.5 rounded-btn bg-primary-500/10 border border-primary-500/30">
          <p className="text-[10px] text-primary-500 font-semibold">
            {selectedIds.size} seleccionados · Ctrl+clic para añadir
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-0.5">
        {libLoading ? (
          <div className="flex justify-center py-6"><Spinner size={18} /></div>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-[12px] text-ink-4 py-6">
            {search ? 'Sin resultados' : 'Biblioteca vacía'}
          </p>
        ) : filteredItems.map((item, index) => (
          <LibraryItem
            key={item.id} item={item} index={index}
            isSelected={selectedIds.has(item.id)}
            isActive={activeId === item.id}
            selectedIds={selectedIds}
            projectionClickMode={projectionClickMode}
            onSelect={handleSelect}
            onProject={handleProject}
            onNavigate={handleNavigate}
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
      <div className={cn('nav-item', activePage === 'Ajustes' && 'active')} onClick={() => setActivePage('Ajustes')}>
        <GearIcon />
        Ajustes
      </div>

      {/* Context menu compartido */}
      <ContextMenu
        open={!!ctxMenu}
        x={ctxMenu?.x ?? 0}
        y={ctxMenu?.y ?? 0}
        title={multi ? `${selectedIds.size} elementos seleccionados` : ctxMenu?.item.title}
        items={ctxItems}
        onClose={() => setCtxMenu(null)}
      />
    </aside>
  )
}
