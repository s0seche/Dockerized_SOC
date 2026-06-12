import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import SocOverview from './pages/SocOverview'
import Alerts from './pages/Alerts'
import DetectionRules from './pages/DetectionRules'
import TheHive from './pages/TheHive'
import ConnectorsHealth from './pages/ConnectorsHealth'
import Dashboards from './pages/Dashboards'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<SocOverview />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/rules" element={<DetectionRules />} />
            <Route path="/thehive" element={<TheHive />} />
            <Route path="/connectors" element={<ConnectorsHealth />} />
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
