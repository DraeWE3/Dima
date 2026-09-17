import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Rocket, LayoutDashboard, Settings, LoaderCircle, History as HistoryIcon, Clock } from 'lucide-react';
import logo from '../assets/dima-logo.webp';

function formatMissionTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { missionId: activeMissionId } = useParams();
  const [missions, setMissions] = useState<any[]>([]);
  const onMissionArea = location.pathname === '/' || location.pathname.startsWith('/mission');

  useEffect(() => {
    async function load() {
      try {
        // @ts-ignore
        const data = await window.api.getMissions();
        if (data) {
          setMissions(
            [...data]
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 15)
          );
        }
      } catch (e) {}
    }
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="w-72 h-full flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl p-5 relative z-50 shadow-2xl shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 mb-8 px-2 shrink-0">
        <img src={logo} alt="Dima Logo" className="w-9 h-9 object-contain drop-shadow-lg" />
        <span className="font-nasa text-2xl tracking-widest text-white drop-shadow-md">DIMA</span>
      </div>

      {/* Primary Navigation */}
      <div className="flex flex-col gap-2 shrink-0 font-motif text-base tracking-wide">
        <NavItem to="/" icon={<Rocket size={18} />} label="Mission" forceActive={onMissionArea} />
        <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
      </div>

      {/* Significant spacing separator from Dashboard button */}
      <div className="mt-12 pt-6 border-t border-white/10 flex flex-col flex-1 min-h-0">
        {/* History Header with Count */}
        <div className="flex items-center justify-between px-2 mb-3.5 shrink-0">
          <div className="flex items-center gap-2 text-white/50 text-xs font-motif uppercase tracking-wider font-semibold">
            <HistoryIcon size={14} className="text-[#df71ff]" />
            <span>History</span>
          </div>
          {missions.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-white/10 text-white/60">
              {missions.length}
            </span>
          )}
        </div>

        {/* History Mission Cards */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1">
          {missions.length === 0 ? (
            <div className="p-4 text-center text-white/30 text-xs font-motif rounded-xl border border-white/5 bg-white/[0.02]">
              No missions recorded yet.
            </div>
          ) : (
            missions.map((m) => {
              const isSelected = activeMissionId === m.id;
              const isDone = m.status === 'COMPLETED';
              const isErr = m.status === 'ERROR';

              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/mission/${m.id}`)}
                  className={`group w-full flex flex-col gap-2 p-3 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? 'bg-white/10 border-[#df71ff]/40 shadow-lg shadow-purple-950/30 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isDone ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          PASS
                        </span>
                      ) : isErr ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          FAIL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                          <LoaderCircle size={10} className="animate-spin text-blue-400" />
                          RUN
                        </span>
                      )}
                      <span className="text-[11px] text-white/40 font-mono truncate max-w-[90px]">
                        {m.projectId || 'mission'}
                      </span>
                    </div>

                    {m.date && (
                      <span className="text-[10px] font-mono text-white/30 shrink-0 flex items-center gap-1">
                        <Clock size={10} className="text-white/20" />
                        {formatMissionTime(m.date)}
                      </span>
                    )}
                  </div>

                  {/* Objective Prompt Text */}
                  <p className="text-xs font-motif text-white/80 line-clamp-2 leading-relaxed tracking-wide group-hover:text-white break-words">
                    {m.userPrompt || 'Untitled mission'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Settings Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 shrink-0">
        <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
      </div>
    </nav>
  );
}

function NavItem({ to, icon, label, forceActive }: { to: string; icon: React.ReactNode; label: string; forceActive?: boolean }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 font-medium ${
          isActive || forceActive
            ? "bg-gradient-to-r from-[#df71ff]/40 to-[#7a5af8]/40 border border-white/20 text-white shadow-lg shadow-[#7a5af8]/20"
            : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
