import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Cpu, ChevronDown, Plus, Send, Square, RotateCcw, LoaderCircle, X } from 'lucide-react';
import { MicButton } from '../components/UIComponents';
import logo from '../assets/dima-logo.webp';

const AVAILABLE_MODELS = [
  { id: "gemini-1.5-flash", label: "Gemini 3.6 Flash (High)" },
  { id: "gemini-1.5-flash-8b", label: "Gemini 3.5 Flash" },
  { id: "gemini-1.5-pro", label: "Gemini 3.1 Pro" },
  { id: "claude-3-5-sonnet-20240620", label: "Cloud Sonnet 4.6" },
  { id: "moon", label: "Moon" },
];

export function LogDetailPage() {
  const { missionId } = useParams();
  const [missionData, setMissionData] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  useEffect(() => {
    async function loadMission() {
      if (!missionId) return;
      try {
        // @ts-ignore
        const data = await window.api.getMission(missionId);
        setMissionData(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadMission();
    const interval = setInterval(loadMission, 1000);
    return () => clearInterval(interval);
  }, [missionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [missionData?.logs?.length]);

  const handleContinue = async () => {
    if (!prompt.trim() || !missionId) return;
    const msg = prompt;
    const submittedFiles = [...attachedFiles];
    setPrompt("");
    setAttachedFiles([]);
    try {
      // @ts-ignore
      await window.api.continueMission(missionId, msg, selectedModel, submittedFiles);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileSelect = async () => {
    try {
      // @ts-ignore
      const files = await window.api.selectFiles();
      if (files && files.length > 0) {
        setAttachedFiles((prev) => [...prev, ...files]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTranscription = (text: string) => {
    setPrompt((prev) => (prev ? prev + " " + text : text));
  };

  if (!missionData) {
    return <div className="flex h-full items-center justify-center text-white/50 font-motif text-xl">Loading mission logs...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col p-8 relative z-10 overflow-hidden justify-start font-motif text-white">
      <header className="flex items-center gap-4 border-b border-white/10 pb-4 shrink-0 mb-6 w-full max-w-5xl mx-auto">
        <Link to="/logs" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <div>
          <h1 className="text-xl font-nasa tracking-widest text-[#df71ff]">MISSION {missionId?.slice(0, 8)}</h1>
          <p className="text-white/50 text-sm truncate max-w-md">{missionData.workspacePath}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <span className={`w-2 h-2 rounded-full ${missionData.status === "RUNNING" ? "bg-blue-500 animate-pulse" : missionData.status === "COMPLETED" ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-xs tracking-wider font-semibold text-white">{missionData.status}</span>
        </div>
      </header>

      <div className="flex-1 w-full overflow-auto max-w-5xl mx-auto mb-6 relative" ref={scrollRef}>
        <div className="glassContainer min-h-full border border-white/10 rounded-2xl p-6 flex flex-col gap-6 w-full h-max shadow-2xl bg-black/40">
          {missionData?.logs?.map((log: any, i: number) => (
            <div key={i} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] flex gap-3 ${log.role === "user" ? "flex-row-reverse items-center" : "flex-row items-start"}`}>
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 mt-1">
                  {log.role === "user" ? (
                    <span className="text-sm text-white">U</span>
                  ) : (
                    <img src={logo} alt="Agent" className="w-5 h-5 object-contain" />
                  )}
                </div>
                <div className={`p-4 rounded-2xl ${log.role === "user" ? "bg-gradient-to-r from-[#df71ff]/20 to-[#7a5af8]/20 border border-[#7a5af8]/30 rounded-tr-sm text-right" : "bg-black/40 border border-white/10 rounded-tl-sm shadow-xl"}`}>
                  <pre className="whitespace-pre-wrap font-motif text-sm leading-relaxed font-light text-white/90">{log.content}</pre>
                </div>
                {log.role === "user" && (
                  <button
                    onClick={async () => {
                      // @ts-ignore
                      await window.api.undoMissionStep(missionId, log.timestamp, log.commitHash || "");
                      // @ts-ignore
                      const data = await window.api.getMission(missionId);
                      setMissionData(data);
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors self-center"
                    title="Undo file changes and reset memory to this point"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {missionData?.status === "RUNNING" && (
            <div className="flex items-center gap-3 text-white/50 text-sm italic font-motif p-2">
              <LoaderCircle size={16} className="animate-spin text-[#df71ff]" />
              Agent is running tasks...
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto shrink-0 pb-4">
        <div className={`input-row-2 glassContainer w-full p-4 pl-6 flex items-start justify-between border border-white/10 shadow-2xl rounded-xl transition-all duration-500 ${attachedFiles.length > 0 ? "h-40" : "h-32"} bg-black/50 backdrop-blur-xl`}>
          <div className="flex flex-col w-full h-full gap-2 relative">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachedFiles.map((file, idx) => {
                  const fileName = file.split("\\").pop()?.split("/").pop() || file;
                  return (
                    <div key={idx} className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white/80">
                      <span className="truncate max-w-[150px]">{fileName}</span>
                      <button onClick={() => removeFile(idx)} className="hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleContinue();
                }
              }}
              placeholder="Continue the conversation or send a new task..."
              className="bg-transparent border-none text-white outline-none w-full h-full resize-none text-lg font-motif placeholder:font-motif placeholder:text-white/40 tracking-wide pt-2"
            />
          </div>

          <div className="ml-4 shrink-0 h-full flex items-end pb-2 gap-2 relative z-50">
            <button
              onClick={handleFileSelect}
              className="p-3.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 flex items-center justify-center cursor-pointer shadow-lg group relative"
              title="Add Media File"
            >
              <Plus size={24} className="text-white/70 group-hover:text-white transition-colors" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="p-3.5 px-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 flex items-center justify-center cursor-pointer shadow-lg gap-2 text-white/80 hover:text-white"
              >
                <Cpu size={20} />
                <span className="text-sm font-motif hidden sm:block whitespace-nowrap">
                  {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.label || "Model"}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isModelDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-4 w-64 glassContainer border border-white/20 rounded-xl p-2 shadow-2xl z-[100] flex flex-col gap-1 backdrop-blur-xl bg-black/80">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-motif transition-colors ${
                        selectedModel === model.id
                          ? "bg-gradient-to-r from-[#df71ff]/30 to-[#7a5af8]/30 text-white font-medium border border-white/20"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <MicButton onTranscriptionComplete={handleTranscription} />
            
            <button
              onClick={handleContinue}
              disabled={!prompt.trim() || missionData?.status === "RUNNING"}
              className="p-4 bg-gradient-to-r from-[#df71ff] to-[#7a5af8] hover:opacity-90 disabled:opacity-50 transition-opacity rounded-xl flex items-center justify-center cursor-pointer shadow-lg"
            >
              <Send size={24} className="text-white" />
            </button>
            {missionData?.status === "RUNNING" && (
              <button
                onClick={async () => {
                  // @ts-ignore
                  await window.api.interruptMission(missionId);
                }}
                className="p-4 bg-red-500/80 hover:bg-red-500 transition-colors rounded-xl flex items-center justify-center cursor-pointer shadow-lg"
                title="Interrupt and Stop Agent"
              >
                <Square size={24} className="text-white fill-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}