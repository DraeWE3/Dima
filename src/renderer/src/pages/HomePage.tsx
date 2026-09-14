import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Activity, Shield, CheckCircle, ArrowLeft, Terminal, LoaderCircle } from 'lucide-react';
import logo from '../assets/dima-logo.webp';

export function HomePage() {
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  const [allMissions, setAllMissions] = useState<any[]>([]);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.5 } });
    tl.from(".hero-logo", { y: -50, opacity: 0, duration: 1 })
      .from(".hero-title", { y: 30, opacity: 0 }, "-=0.7")
      .from(".dashboard-grid", { y: 30, opacity: 0, stagger: 0.1 }, "-=1");
  }, { scope: containerRef });

  // MCP Dashboard auto-detection & polling
  useEffect(() => {
    const discoverInterval = setInterval(async () => {
      try {
        // @ts-ignore
        const missions = await window.api.getMissions();
        if (missions) {
          setAllMissions(missions);
          // If we are currently in the dashboard view, and a NEW mission just started running, jump to it!
          const latest = missions[0];
          if (latest && latest.status === 'RUNNING') {
             setActiveMissionId((current) => {
               if (current === null) {
                 setMissionData(latest);
                 return latest.id;
               }
               return current;
             });
          }
        }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(discoverInterval);
  }, []);

  // Fast polling for active mission
  useEffect(() => {
    let interval: any;
    if (activeMissionId) {
      interval = setInterval(async () => {
        try {
          // @ts-ignore
          const data = await window.api.getMission(activeMissionId);
          setMissionData(data);
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMissionId]);

  useEffect(() => {
    async function loadScreenshot() {
      if (!missionData?.logs) return;
      const logWithImg = missionData.logs.find((l: any) => l.screenshot);
      if (logWithImg) {
        // @ts-ignore
        const img = await window.api.getScreenshot(logWithImg.screenshot);
        setScreenshotBase64(img);
      } else {
        setScreenshotBase64(null);
      }
    }
    loadScreenshot();
  }, [missionData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [missionData?.logs?.length]);

  const stats = {
    total: allMissions.length,
    passed: allMissions.filter(m => m.status === 'COMPLETED').length,
    security: allMissions.filter(m => m.userPrompt.includes('Security')).length,
    passRate: allMissions.length > 0 ? Math.round((allMissions.filter(m => m.status === 'COMPLETED').length / (allMissions.filter(m => m.status === 'COMPLETED' || m.status === 'ERROR').length || 1)) * 100) : 0
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col p-8 relative z-10 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <img src={logo} alt="DIMA Logo" className="hero-logo w-12 h-12 object-contain drop-shadow-2xl" />
          <h1 className="hero-title text-3xl font-nasa tracking-[0.1em] text-white drop-shadow-lg uppercase">DIMA MCP</h1>
        </div>
        <div className="flex items-center gap-3 glassContainer px-4 py-2 rounded-full border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
          <span className="text-white/80 font-motif text-sm tracking-wide">Server Online • Listening for Antigravity</span>
        </div>
      </div>

      {!activeMissionId ? (
        // DASHBOARD VIEW
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-8 overflow-y-auto pb-8 dashboard-grid">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-2 hover:border-[#df71ff]/30 transition-colors">
              <div className="flex items-center gap-3 text-white/60 mb-2">
                <Activity size={20} className="text-[#df71ff]" />
                <span className="font-motif text-sm uppercase tracking-wider">Total Tests</span>
              </div>
              <span className="text-5xl font-light text-white">{stats.total}</span>
            </div>
            
            <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-2 hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 text-white/60 mb-2">
                <CheckCircle size={20} className="text-green-500" />
                <span className="font-motif text-sm uppercase tracking-wider">Pass Rate</span>
              </div>
              <span className="text-5xl font-light text-white">{stats.passRate}%</span>
            </div>

            <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-2 hover:border-red-500/30 transition-colors">
              <div className="flex items-center gap-3 text-white/60 mb-2">
                <Shield size={20} className="text-red-500" />
                <span className="font-motif text-sm uppercase tracking-wider">Security Audits</span>
              </div>
              <span className="text-5xl font-light text-white">{stats.security}</span>
            </div>
          </div>

          {/* Recent Missions */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-nasa tracking-widest text-white/80">RECENT MISSIONS</h2>
            <div className="grid grid-cols-1 gap-4">
              {allMissions.length === 0 ? (
                <div className="glassContainer p-8 rounded-2xl border border-white/10 text-center text-white/50 font-motif">
                  No missions executed yet. Trigger a test from Antigravity to see it here!
                </div>
              ) : (
                allMissions.map((mission) => (
                  <button 
                    key={mission.id}
                    onClick={() => {
                      setActiveMissionId(mission.id);
                      setMissionData(mission);
                    }}
                    className="glassContainer p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:bg-white/5 hover:border-[#7a5af8]/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl bg-black/40 border ${
                        mission.status === 'COMPLETED' ? 'border-green-500/30 text-green-500' :
                        mission.status === 'ERROR' ? 'border-red-500/30 text-red-500' :
                        'border-blue-500/30 text-blue-500'
                      }`}>
                        {mission.status === 'COMPLETED' ? <CheckCircle size={20} /> :
                         mission.status === 'ERROR' ? <Terminal size={20} /> :
                         <LoaderCircle size={20} className="animate-spin" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-lg">{mission.userPrompt}</span>
                        <span className="text-white/40 font-mono text-xs mt-1">{mission.projectId} • {new Date(mission.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-white/30 group-hover:text-white/80 transition-colors">
                      View Logs &rarr;
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
        </div>
      ) : (
        // ACTIVE MISSION VIEW
        <div className="flex-1 w-full overflow-hidden max-w-7xl mx-auto flex flex-col relative">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                setActiveMissionId(null);
                setScreenshotBase64(null);
              }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-motif text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div className="text-white/40 font-mono text-sm">
              {missionData?.projectId} • {missionData?.status}
            </div>
          </div>

          <div className={`flex-1 w-full flex gap-6 overflow-hidden ${screenshotBase64 ? 'flex-row' : 'flex-col'}`}>
            {/* Logs Column */}
            <div className="flex-1 glassContainer border border-white/10 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto min-w-[50%]" ref={scrollRef}>
              {missionData?.logs?.map((log: any, i: number) => (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] flex gap-3 flex-row items-start">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 mt-1">
                      <img src={logo} alt="Agent" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 rounded-tl-sm">
                      <pre className="whitespace-pre-wrap font-motif text-sm leading-relaxed font-light text-white/90">{log.content}</pre>
                    </div>
                  </div>
                </div>
              ))}
              
              {missionData?.status === "RUNNING" && (
                <div className="flex items-center gap-3 text-white/50 text-sm italic font-motif p-2">
                  <LoaderCircle size={16} className="animate-spin text-[#df71ff]" />
                  MCP Server is executing tasks...
                </div>
              )}
            </div>

            {/* Screenshot Column */}
            {screenshotBase64 && (
              <div className="flex-1 glassContainer border border-white/10 rounded-2xl overflow-hidden flex flex-col bg-[#1e1e1e] shadow-2xl">
                {/* Browser Mockup Header */}
                <div className="h-10 bg-[#2d2d2d] border-b border-black flex items-center px-4 gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 px-4 py-1 bg-[#1e1e1e] rounded-md text-white/50 text-xs font-mono flex-1 text-center truncate">
                    Playwright Capture • {missionData?.projectId}
                  </div>
                </div>
                {/* Screenshot Image */}
                <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-black/20">
                   <img src={screenshotBase64} alt="Test Screenshot" className="max-w-full h-auto rounded-lg shadow-2xl object-contain object-top border border-white/10" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}