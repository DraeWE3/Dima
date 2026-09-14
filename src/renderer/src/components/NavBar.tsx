import { NavLink } from 'react-router-dom';
import { Rocket, LayoutDashboard, FileText, Settings } from 'lucide-react';
import logo from '../assets/dima-logo.webp';

export function NavBar() {
  return (
    <nav className="w-64 h-full flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl p-6 relative z-50 shadow-2xl">
      <div className="flex items-center gap-4 mb-12">
        <img src={logo} alt="Dima Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
        <span className="font-nasa text-2xl tracking-widest text-white drop-shadow-md">DIMA</span>
      </div>
      
      <div className="flex flex-col gap-2 flex-1 font-motif text-lg tracking-wide">
        <NavItem to="/" icon={<Rocket size={20} />} label="Mission" />
        <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem to="/logs" icon={<FileText size={20} />} label="Logs" />
      </div>

      <div className="mt-auto">
        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
      </div>
    </nav>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          isActive
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