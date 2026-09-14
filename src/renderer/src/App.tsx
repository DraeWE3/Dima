import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { BackgroundLoop } from './components/BackgroundLoop';
import { GlassFilterProvider } from './components/GlassFilterProvider';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LogsPage } from './pages/LogsPage';
import { LogDetailPage } from './pages/LogDetailPage';

function App() {
  return (
    <HashRouter>
      <div className="flex h-screen w-full relative overflow-hidden bg-black text-white">
        <BackgroundLoop />
        <GlassFilterProvider />
        <NavBar />
        
        <div className="flex-1 relative z-10 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/logs/:missionId" element={<LogDetailPage />} />
            <Route 
              path="/settings" 
              element={
                <div className="flex items-center justify-center h-full text-white/50 font-motif text-xl">
                  Settings Configuration
                </div>
              } 
            />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;