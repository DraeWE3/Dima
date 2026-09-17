import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

interface ModelSelectProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

export function ModelSelect({ value, options, onChange }: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 bg-black/50 hover:bg-black/70 border border-white/15 hover:border-[#df71ff]/40 rounded-xl px-4 py-2.5 text-white/90 text-sm font-motif shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#df71ff]/50"
      >
        <span className="w-2 h-2 rounded-full bg-[#df71ff] shadow-[0_0_8px_rgba(223,113,255,0.9)] shrink-0 animate-pulse" />
        <span className="font-mono text-xs tracking-wide text-white/95">{value}</span>
        <ChevronDown
          size={15}
          className={`text-white/50 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#df71ff]' : ''}`}
        />
      </button>

      {/* Glassmorphic Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 min-w-[210px] bg-neutral-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl shadow-black/80 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-nasa tracking-widest text-white/40 uppercase border-b border-white/5">
            <Sparkles size={10} className="text-[#df71ff]" />
            <span>Select Model</span>
          </div>

          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pr-0.5">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#df71ff]/25 to-[#7a5af8]/25 border border-[#df71ff]/40 text-white font-medium shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check size={14} className="text-[#df71ff] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
