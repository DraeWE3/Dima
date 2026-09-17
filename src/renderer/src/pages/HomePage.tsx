import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowLeft, LoaderCircle, FolderOpen, Plug, Square, Send } from 'lucide-react';
import logo from '../assets/dima-logo.webp';
import { BrowseButton } from '../components/BrowseButton';
import { StartButton } from '../components/StartButton';
import { ModelSelect } from '../components/ModelSelect';

const FALLBACK_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'];

// DimaEngine flips status to IN_PROGRESS almost immediately after a mission
// starts as RUNNING, so anything checking for "is this mission still going"
// has to treat both as the same active state.
const ACTIVE_STATUSES = ['RUNNING', 'IN_PROGRESS'];
function isMissionActive(status?: string): boolean {
  return !!status && ACTIVE_STATUSES.includes(status);
}

const HEADLINE_PROMPTS = [
  'What are we working on?',
  'Point me at a project.',
  "Let's ship something.",
  'Ready to verify.',
];

interface HomePageProps {
  workspacePath: string;
  setWorkspacePath: (path: string) => void;
}

export function HomePage({ workspacePath, setWorkspacePath }: HomePageProps) {
  const { missionId: urlMissionId } = useParams();
  const navigate = useNavigate();
  const [activeMissionId, setActiveMissionId] = useState<string | null>(urlMissionId || null);
  const [missionData, setMissionData] = useState<any>(null);
  const [allMissions, setAllMissions] = useState<any[]>([]);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // New-mission launch form (workspacePath is lifted to App - see there for why)
  const [objective, setObjective] = useState('');
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [model, setModel] = useState(FALLBACK_MODELS[0]);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Rotating headline
  const [headlineIndex, setHeadlineIndex] = useState(0);

  // Subtle connection status
  const [mcpConnectedCount, setMcpConnectedCount] = useState(0);
  const [antigravityConnected, setAntigravityConnected] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.5 } });
    tl.from(".hero-logo", { y: -50, opacity: 0, duration: 1 })
      .from(".hero-title", { y: 30, opacity: 0 }, "-=0.7")
      .from(".dashboard-grid", { y: 30, opacity: 0, stagger: 0.1 }, "-=1");
  }, { scope: containerRef });

  // Keep local state in sync with the URL (sidebar history links to /mission/:id)
  useEffect(() => {
    setActiveMissionId(urlMissionId || null);
    if (!urlMissionId) {
      setMissionData(null);
      setScreenshotBase64(null);
    }
  }, [urlMissionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!titleRef.current) {
        setHeadlineIndex((i) => (i + 1) % HEADLINE_PROMPTS.length);
        return;
      }

      // Gentle, slow cinematic fade-out
      gsap.to(titleRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          // Switch headline text state while fully transparent
          setHeadlineIndex((prev) => (prev + 1) % HEADLINE_PROMPTS.length);

          // Brief calm pause, then leisurely fade-in
          setTimeout(() => {
            if (titleRef.current) {
              gsap.fromTo(
                titleRef.current,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }
              );
            }
          }, 150);
        },
      });
    }, 8500);

    return () => {
      clearInterval(interval);
      if (titleRef.current) {
        gsap.killTweensOf(titleRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadModelConfig() {
      try {
        // @ts-ignore
        const config = await window.api.getAppConfig();
        if (config?.models?.length) {
          setModels(config.models);
          setModel(config.defaultModel || config.models[0]);
        }
      } catch (e) {}
    }
    loadModelConfig();
  }, []);

  useEffect(() => {
    async function loadConnectionStatus() {
      try {
        // @ts-ignore
        const servers = await window.api.getMcpServers();
        setMcpConnectedCount((servers || []).filter((s: any) => s.status === 'connected').length);
        // @ts-ignore
        const antigravity = await window.api.getAntigravityStatus();
        setAntigravityConnected(!!antigravity?.connected);
      } catch (e) {}
    }
    loadConnectionStatus();
    const interval = setInterval(loadConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // MCP Dashboard auto-detection & polling
  useEffect(() => {
    const discoverInterval = setInterval(async () => {
      try {
        // @ts-ignore
        const missions = await window.api.getMissions();
        if (missions) {
          setAllMissions(missions);
          // If we're sitting at the plain launcher and a NEW mission just started
          // running (e.g. triggered externally via MCP), jump to it.
          const latest = missions[0];
          if (latest && isMissionActive(latest.status) && !urlMissionId) {
            setMissionData(latest);
            navigate(`/mission/${latest.id}`);
          }
        }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(discoverInterval);
  }, [urlMissionId, navigate]);

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

  const handleBrowseWorkspace = async () => {
    try {
      // @ts-ignore
      const selectedPath = await window.api.selectFiles();
      if (selectedPath) setWorkspacePath(selectedPath);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchMission = async () => {
    if (!workspacePath || !objective.trim()) {
      setLaunchError('Pick a workspace and describe the objective first.');
      return;
    }
    setLaunchError(null);

    const id = Date.now().toString();
    const projectId = workspacePath.split(/[\\/]/).filter(Boolean).pop() || 'workspace';
    const mission = {
      id,
      projectId,
      userPrompt: objective,
      prompt: objective,
      workspacePath,
      model,
      status: 'RUNNING',
      date: new Date().toISOString(),
      logs: [],
    };

    try {
      // @ts-ignore
      window.api.startMission(mission);
      setObjective('');
      setMissionData(mission);
      navigate(`/mission/${id}`);
    } catch (e) {
      console.error(e);
      setLaunchError('Failed to launch mission - check the logs.');
    }
  };

  const handleInterrupt = async () => {
    if (!activeMissionId) return;
    try {
      // @ts-ignore
      await window.api.interruptMission(activeMissionId);
    } catch (e) {
      console.error(e);
    }
  };

  const [continuePrompt, setContinuePrompt] = useState('');
  const [continueSending, setContinueSending] = useState(false);

  const handleContinue = async () => {
    if (!activeMissionId || !continuePrompt.trim() || continueSending) return;
    setContinueSending(true);
    try {
      // @ts-ignore
      await window.api.continueMission({ id: activeMissionId, prompt: continuePrompt.trim(), model });
      setContinuePrompt('');
    } catch (e) {
      console.error(e);
    } finally {
      setContinueSending(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col p-8 relative z-10 overflow-hidden">

      {!activeMissionId ? (
        // CENTERED LAUNCH VIEW
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 md:gap-8 xl:gap-10 dashboard-grid max-w-5xl mx-auto px-4">
          <div className="flex flex-col items-center gap-3.5 md:gap-5 text-center">
            <img src={logo} alt="DIMA Logo" className="hero-logo w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 xl:w-24 xl:h-24 object-contain drop-shadow-2xl" />
            <h1 ref={titleRef} className="hero-title text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-5xl font-nasa tracking-wider text-white/90 drop-shadow-md text-center max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl leading-tight">
              {HEADLINE_PROMPTS[headlineIndex]}
            </h1>
          </div>

          <div className="w-full flex flex-col gap-4">
            <div className="glassContainer p-8 md:p-10 rounded-3xl border border-white/15 bg-black/40 backdrop-blur-2xl shadow-2xl flex flex-col gap-6 w-full">
              <div className="flex items-center gap-4">
                <BrowseButton onClick={handleBrowseWorkspace} />
                <div
                  onClick={handleBrowseWorkspace}
                  className="flex-1 flex items-center gap-3 bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3.5 text-sm font-mono cursor-pointer transition-all duration-200"
                >
                  <FolderOpen size={18} className="text-[#df71ff] shrink-0" />
                  <span className={workspacePath ? 'text-white/90 truncate font-mono text-sm' : 'text-white/40'}>
                    {workspacePath || 'Select workspace directory'}
                  </span>
                </div>
              </div>

              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Describe the objective or feature to verify..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none resize-none font-motif text-base leading-relaxed placeholder:text-white/35 focus:border-[#df71ff]/60 focus:ring-1 focus:ring-[#df71ff]/30 transition-all"
              />

              <div className="flex items-center justify-between gap-4 pt-1">
                <ModelSelect
                  value={model}
                  options={models}
                  onChange={setModel}
                />

                <StartButton onClick={handleLaunchMission} />
              </div>

              {launchError && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {launchError}
                </div>
              )}
            </div>

            {/* Subtle connection status */}
            {(mcpConnectedCount > 0 || antigravityConnected) && (
              <div className="flex items-center justify-center gap-6 text-white/40 text-xs font-motif tracking-wide mt-1">
                {antigravityConnected && (
                  <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Antigravity connected
                  </span>
                )}
                {mcpConnectedCount > 0 && (
                  <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <Plug size={13} className="text-[#df71ff]" />
                    {mcpConnectedCount} MCP connected
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ACTIVE MISSION VIEW
        <div className="flex-1 w-full overflow-hidden max-w-7xl mx-auto flex flex-col relative">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-motif text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft size={16} /> New Mission
            </button>
            <div className="flex items-center gap-3">
              <div className="text-white/40 font-mono text-sm">
                {missionData?.projectId} • {missionData?.status}
              </div>
              {isMissionActive(missionData?.status) && (
                <button
                  onClick={handleInterrupt}
                  className="p-2 bg-red-500/80 hover:bg-red-500 transition-colors rounded-full flex items-center justify-center cursor-pointer"
                  title="Interrupt and stop the agent"
                >
                  <Square size={14} className="text-white fill-white" />
                </button>
              )}
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
              
              {isMissionActive(missionData?.status) && (
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

          {/* Continue the conversation - only once the mission isn't actively mid-loop,
              since sending while a loop is in flight would race two loops over the
              same session state. */}
          <div className="mt-4 shrink-0 flex items-end gap-3">
            <textarea
              value={continuePrompt}
              onChange={(e) => setContinuePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleContinue();
                }
              }}
              disabled={isMissionActive(missionData?.status)}
              placeholder={
                isMissionActive(missionData?.status)
                  ? 'Mission is running - you can send a follow-up once it pauses or finishes...'
                  : 'Send a follow-up instruction for this mission...'
              }
              rows={2}
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none resize-none font-motif text-sm placeholder:text-white/35 focus:border-[#df71ff]/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleContinue}
              disabled={!continuePrompt.trim() || continueSending || isMissionActive(missionData?.status)}
              className="shrink-0 p-3.5 bg-gradient-to-r from-[#df71ff] to-[#7a5af8] hover:opacity-90 disabled:opacity-40 transition-opacity rounded-xl flex items-center justify-center"
              title="Send"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}