import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';

export function LogsPage() {
  const [missions, setMissions] = useState<any[]>([]);

  useEffect(() => {
    async function loadMissions() {
      try {
        // @ts-ignore
        const data = await window.api.getMissions();
        // sort by newest
        setMissions(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error(e);
      }
    }
    loadMissions();
    const interval = setInterval(loadMissions, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-8 relative z-10 flex flex-col font-motif text-white overflow-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-nasa tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#df71ff] to-[#7a5af8]">MISSION LOGS</h1>
        <p className="text-white/60 mt-2 text-lg">History of all autonomous executions</p>
      </header>

      <div className="flex flex-col gap-4 max-w-5xl">
        {missions.length === 0 && (
          <div className="text-white/40 italic p-8 text-center border border-white/10 rounded-2xl bg-white/5">
            No missions recorded yet. Start one from the Mission tab!
          </div>
        )}
        
        {missions.map((mission) => (
          <div key={mission.id} className="glassContainer border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <Terminal className="text-[#df71ff]" size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="font-nasa tracking-widest text-lg">MISSION {mission.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold tracking-wider ${
                    mission.status === "RUNNING" ? "bg-blue-500/20 border-blue-500/50 text-blue-400 animate-pulse" :
                    mission.status === "COMPLETED" ? "bg-green-500/20 border-green-500/50 text-green-400" :
                    "bg-red-500/20 border-red-500/50 text-red-400"
                  }`}>
                    {mission.status}
                  </span>
                </div>
                <span className="text-white/60 text-sm mt-1">{mission.workspacePath}</span>
                <span className="text-white/40 text-xs mt-2 font-mono">
                  {new Date(mission.timestamp).toLocaleString()} • {mission.logs.length} events
                </span>
              </div>
            </div>
            <Link 
              to={`/logs/${mission.id}`}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors font-medium tracking-wide mt-4 md:mt-0 w-full md:w-auto justify-center"
            >
              View Terminal
              <ArrowRight size={18} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}