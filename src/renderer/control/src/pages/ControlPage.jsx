import { SlideEditor } from '../components/editor/SlideEditor.jsx'
import { QuickGrid }   from '../components/quick/QuickGrid.jsx'

export function ControlPage() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      <SlideEditor />
      <QuickGrid />
    </main>
  )
}
