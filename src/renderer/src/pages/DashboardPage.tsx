import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, CheckCircle2, TrendingUp, LoaderCircle, XCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    activeWorkflows: 0,
    issuesDetected: 0,
    chartData: [] as any[]
  });
  const [recentMissions, setRecentMissions] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        // @ts-ignore
        const data = await window.api.getMissionStats();
        if (data) setStats(data);
        // @ts-ignore
        const missions = await window.api.getMissions();
        if (missions) {
          setRecentMissions(
            [...missions]
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
          );
        }
      } catch (e) {
        console.error('Failed to load mission stats', e);
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(() => {
    // Advanced Animations Setup
    const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });

    // Hero Reveal with clipPath
    tl.fromTo(".reveal-text",
      { y: 60, opacity: 0, clipPath: "inset(100% 0 0 0)" },
      { y: 0, opacity: 1, clipPath: "inset(0% 0 0 0)", duration: 1.5, stagger: 0.1 }
    );

    // KPI Cards Grid Stagger
    tl.fromTo(".kpi-card",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.1, ease: "power3.out" },
      "-=1.2"
    );

    // Chart Area Reveal
    tl.fromTo(".chart-section",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" },
      "-=1"
    );

    // ScrollTrigger Parallax on Chart Area
    gsap.to(".chart-section", {
      y: -20,
      ease: "none",
      scrollTrigger: {
        trigger: ".dashboard-scroll-area",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Magnetic Button Effect on KPI Cards
    const cards = gsap.utils.toArray<HTMLElement>('.kpi-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8, scale: 1.02, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
      });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="dashboard-scroll-area w-full h-full p-8 md:p-12 relative z-10 flex flex-col font-motif text-white overflow-y-auto overflow-x-hidden">

      <header className="mb-16 dashboard-header shrink-0 pt-4">
        <h1 className="reveal-text text-5xl md:text-6xl font-nasa tracking-wider text-white drop-shadow-lg">
          WORKFLOW ANALYTICS
        </h1>
        <p className="reveal-text text-white/60 mt-4 text-xl tracking-wide max-w-2xl">
          Mission execution history across all connected workspaces.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 shrink-0">

        {/* Success Rate */}
        <div className="kpi-card glassContainer border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-green-500/20"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <CheckCircle2 size={24} className="text-green-500" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Success Rate</span>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-bold font-nasa tracking-wider text-green-400">{stats.successRate}%</span>
            <div className="mt-2 text-sm text-white/40">Of completed + errored missions</div>
          </div>
        </div>

        {/* Total Runs */}
        <div className="kpi-card glassContainer border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-white/10"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <TrendingUp size={24} className="text-white" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Total Missions</span>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-bold font-nasa tracking-wider text-white">{stats.totalRuns}</span>
            <div className="mt-2 text-sm text-white/40">All-time mission count</div>
          </div>
        </div>

        {/* Active Workflows */}
        <div className="kpi-card glassContainer border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-white/10"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Activity size={24} className="text-white" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Active Missions</span>
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-bold font-nasa tracking-wider text-white">{stats.activeWorkflows}</span>
            <div className="mt-2 text-sm text-white/40">Currently running</div>
          </div>
        </div>

        {/* Issues */}
        <div className="kpi-card glassContainer border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-all ${stats.issuesDetected > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-green-500/10 group-hover:bg-green-500/20'}`}></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <ShieldCheck size={24} className={stats.issuesDetected > 0 ? 'text-red-500' : 'text-green-500'} />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Errored Missions</span>
          </div>
          <div className="relative z-10">
            <span className={`text-5xl font-bold font-nasa tracking-wider ${stats.issuesDetected > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.issuesDetected}</span>
            <div className="mt-2 text-sm text-white/40">Missions that ended in error</div>
          </div>
        </div>
      </div>

      {/* Current Activity */}
      <div className="chart-section flex-1 glassContainer border border-white/10 rounded-3xl p-8 shadow-2xl w-full min-h-[400px]">
        <div className="mb-6">
          <h3 className="text-2xl font-nasa text-white mb-2">CURRENT ACTIVITY</h3>
          <p className="text-white/40 text-sm">What's running now, and how the last few missions landed. Full history lives in the sidebar.</p>
        </div>

        {recentMissions.length === 0 ? (
          <div className="p-8 text-center text-white/40 border border-white/10 rounded-2xl bg-white/5">
            No missions executed yet.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Running missions - prominent */}
            {recentMissions.filter((m) => m.status === 'RUNNING').length > 0 && (
              <div className="flex flex-col gap-3">
                {recentMissions.filter((m) => m.status === 'RUNNING').map((mission) => (
                  <Link
                    key={mission.id}
                    to={`/mission/${mission.id}`}
                    className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between hover:bg-blue-500/15 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <LoaderCircle size={18} className="text-blue-400 animate-spin shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-medium truncate">{mission.userPrompt}</span>
                        <span className="text-white/40 font-mono text-xs mt-1">{mission.projectId} • started {new Date(mission.date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <span className="text-blue-300 text-xs font-mono uppercase tracking-widest shrink-0 ml-4">Running</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Recently finished - compact status chips */}
            <div className="flex flex-col gap-3">
              <span className="text-white/40 text-xs uppercase tracking-widest font-motif">Recently finished</span>
              <div className="flex flex-wrap gap-2">
                {recentMissions.filter((m) => m.status !== 'RUNNING').slice(0, 8).map((mission) => (
                  <Link
                    key={mission.id}
                    to={`/mission/${mission.id}`}
                    title={mission.userPrompt}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all max-w-[260px] ${
                      mission.status === 'COMPLETED'
                        ? 'bg-green-500/5 border-green-500/25 hover:bg-green-500/10'
                        : 'bg-red-500/5 border-red-500/25 hover:bg-red-500/10'
                    }`}
                  >
                    {mission.status === 'COMPLETED' ? (
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-500 shrink-0" />
                    )}
                    <span className="text-white/70 truncate">{mission.userPrompt}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
