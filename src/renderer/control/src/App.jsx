import { useApp, AppProvider } from './context/AppContext.jsx'
import { Topbar }        from './components/layout/Topbar.jsx'
import { Sidebar }       from './components/layout/Sidebar.jsx'
import { LivePanel }     from './components/live/LivePanel.jsx'
import { ControlPage }   from './pages/ControlPage.jsx'
import { ScripturePage } from './pages/ScripturePage.jsx'
import { SongsPage }     from './pages/SongsPage.jsx'

function MainContent() {
  const { activePage } = useApp()

  const showLivePanel = activePage === 'Control'

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      {activePage === 'Escrituras' && <ScripturePage />}
      {activePage === 'Canciones'  && <SongsPage />}
      {activePage !== 'Escrituras' && activePage !== 'Canciones' && <ControlPage />}
      {showLivePanel && <LivePanel />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Topbar />
        <MainContent />
      </div>
    </AppProvider>
  )
}