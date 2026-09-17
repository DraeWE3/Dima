import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { BackgroundLoop } from './components/BackgroundLoop';
import { GlassFilterProvider } from './components/GlassFilterProvider';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  // Lifted out of HomePage: "/" and "/mission/:id" are separate <Route>
  // entries, so React Router remounts HomePage when navigating between them,
  // which would otherwise reset the picked workspace on every mission.
  const [workspacePath, setWorkspacePath] = useState('');

  return (
    <HashRouter>
      <div className="flex h-screen w-full relative overflow-hidden bg-black text-white">
        <BackgroundLoop />
        <GlassFilterProvider />
        <NavBar />

        <div className="flex-1 relative z-10 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage workspacePath={workspacePath} setWorkspacePath={setWorkspacePath} />} />
            <Route path="/mission/:missionId" element={<HomePage workspacePath={workspacePath} setWorkspacePath={setWorkspacePath} />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;