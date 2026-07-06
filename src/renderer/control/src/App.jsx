import { useApp, AppProvider }   from './context/AppContext.jsx'
import { Topbar }                from './components/layout/Topbar.jsx'
import { Sidebar }               from './components/layout/Sidebar.jsx'
import { TransportBar }          from './components/layout/TransportBar.jsx'
import { Inspector }             from './components/inspector/Inspector.jsx'
import { ControlPage }           from './pages/ControlPage.jsx'
import { ScripturePage }         from './pages/ScripturePage.jsx'
import { SongsPage }             from './pages/SongsPage.jsx'
import { PresentationsPage }     from './pages/PresentationsPage.jsx'
import { MultimediaPage }        from './pages/MultimediaPage.jsx'
import { StagePage }             from './pages/StagePage.jsx'
import { SettingsPage }          from './pages/SettingsPage.jsx'

function MainContent({ hideControls }) {
  const { activePage } = useApp()
  const showInspector = activePage !== 'Ajustes'

  return (
    <div className="flex flex-1 overflow-hidden">
      {!hideControls && <Sidebar />}
      {activePage === 'Escrituras'     && <ScripturePage />}
      {activePage === 'Canciones'      && <SongsPage />}
      {activePage === 'Presentaciones' && <PresentationsPage />}
      {activePage === 'Multimedia'     && <MultimediaPage />}
      {activePage === 'Escenario'      && <StagePage />}
      {activePage === 'Ajustes'        && <SettingsPage />}
      {!['Escrituras','Canciones','Presentaciones','Multimedia','Escenario','Ajustes'].includes(activePage) && <ControlPage />}
      {showInspector && <Inspector />}
    </div>
  )
}

function AppShell() {
  const { isLive, autoHideControls, displays } = useApp()
  // El auto-hide solo aplica en modo 1 monitor (control y proyección comparten pantalla)
  const hideControls = isLive && autoHideControls && displays.length <= 1

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {!hideControls && <Topbar />}
      <MainContent hideControls={hideControls} />
      {!hideControls && <TransportBar />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}