import { useState, useEffect } from 'react';
import { Plug, Plus, Trash2, CheckCircle2, XCircle, RotateCcw, KeyRound, Cpu, Copy, Check, Zap } from 'lucide-react';

interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  status: 'connected' | 'error' | 'disconnected';
  toolCount: number;
  error?: string;
}

// Splits an args string into tokens, respecting "double-quoted segments" so
// paths with spaces (very common on Windows) don't get split apart.
function tokenizeArgs(input: string): string[] {
  const matches = input.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map(t => t.replace(/^["']|["']$/g, ''));
}

export function SettingsPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [argsText, setArgsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // API key + model config
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [newModel, setNewModel] = useState('');
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Agent connect guide
  const [connectInfo, setConnectInfo] = useState<{ configSnippet: string; localConfigSnippet: string } | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);
  const [copied, setCopied] = useState<'npx' | 'local' | null>(null);
  const [showLocalConfig, setShowLocalConfig] = useState(false);

  const loadServers = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getMcpServers();
      if (data) setServers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAppConfig = async () => {
    try {
      // @ts-ignore
      const config = await window.api.getAppConfig();
      if (config) {
        setHasApiKey(config.hasApiKey);
        setMaskedApiKey(config.maskedApiKey);
        setModels(config.models || []);
        setDefaultModel(config.defaultModel || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAgentStatus = async () => {
    try {
      // @ts-ignore
      const status = await window.api.getAntigravityStatus();
      setAgentConnected(!!status?.connected);
    } catch (e) {}
  };

  useEffect(() => {
    loadServers();
    loadAppConfig();
    loadAgentStatus();
    // @ts-ignore
    window.api.getAgentConnectInfo().then(setConnectInfo).catch(() => {});
    const interval = setInterval(() => {
      loadServers();
      loadAgentStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setApiKeySaving(true);
    setConfigError(null);
    try {
      // @ts-ignore
      const config = await window.api.setApiKey(apiKeyInput.trim());
      setHasApiKey(config.hasApiKey);
      setMaskedApiKey(config.maskedApiKey);
      setApiKeyInput('');
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2500);
    } catch (e: any) {
      setConfigError(e.message || 'Failed to save API key.');
    } finally {
      setApiKeySaving(false);
    }
  };

  const saveModelConfig = async (nextModels: string[], nextDefault: string) => {
    try {
      // @ts-ignore
      const config = await window.api.setModelConfig({ defaultModel: nextDefault, models: nextModels });
      setModels(config.models);
      setDefaultModel(config.defaultModel);
    } catch (e: any) {
      setConfigError(e.message || 'Failed to save model config.');
    }
  };

  const handleAddModel = () => {
    const trimmed = newModel.trim();
    if (!trimmed || models.includes(trimmed)) return;
    const next = [...models, trimmed];
    setNewModel('');
    saveModelConfig(next, defaultModel || trimmed);
  };

  const handleRemoveModel = (m: string) => {
    if (models.length <= 1) return;
    const next = models.filter((x) => x !== m);
    saveModelConfig(next, defaultModel === m ? next[0] : defaultModel);
  };

  const handleSetDefaultModel = (m: string) => {
    saveModelConfig(models, m);
  };

  const handleCopyConfig = async (which: 'npx' | 'local') => {
    if (!connectInfo) return;
    try {
      await navigator.clipboard.writeText(which === 'npx' ? connectInfo.configSnippet : connectInfo.localConfigSnippet);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !command.trim()) {
      setFormError('Name and command are required.');
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      const args = tokenizeArgs(argsText);
      // @ts-ignore
      const res = await window.api.addMcpServer({ name, command, args });
      if (res?.ok) {
        setName('');
        setCommand('');
        setArgsText('');
        await loadServers();
      } else {
        setFormError(res?.error || 'Failed to connect to server.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Failed to add server.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      // @ts-ignore
      await window.api.removeMcpServer(id);
      await loadServers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      // @ts-ignore
      await window.api.reconnectMcpServer(id);
      await loadServers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full p-8 md:p-12 relative z-10 flex flex-col font-motif text-white overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-nasa tracking-wider text-white">SETTINGS</h1>
        <p className="text-white/50 mt-2 text-lg">Connect external MCP servers so DIMA's agent can use their tools.</p>
      </header>

      <div className="max-w-3xl w-full flex flex-col gap-8">
        {/* API key */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-nasa tracking-widest text-white/80 flex items-center gap-2">
            <KeyRound size={20} className="text-[#df71ff]" /> OPENAI API KEY
          </h2>
          <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-4 overflow-hidden">
            {hasApiKey && (
              <div className="flex items-center gap-2.5 text-sm text-white/60 min-w-0 overflow-hidden">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="shrink-0 font-medium">Current key:</span>
                <code className="font-mono text-xs text-white/90 bg-black/40 px-3 py-1 rounded-lg border border-white/10 truncate max-w-full">
                  {maskedApiKey}
                </code>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={hasApiKey ? 'Enter a new key to replace it (sk-...)' : 'sk-...'}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono text-sm placeholder:text-white/40 focus:border-[#7a5af8]/50 transition-colors"
              />
              <button
                onClick={handleSaveApiKey}
                disabled={apiKeySaving || !apiKeyInput.trim()}
                className="shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#df71ff] to-[#7a5af8] hover:opacity-90 disabled:opacity-40 transition-opacity rounded-xl text-white font-medium"
              >
                {apiKeySaved ? <Check size={18} /> : null}
                {apiKeySaving ? 'Saving...' : apiKeySaved ? 'Saved' : 'Save Key'}
              </button>
            </div>
            <p className="text-white/40 text-xs">
              Stored locally in your user data folder, never sent anywhere except directly to OpenAI's API when DIMA runs a mission.
            </p>
          </div>
        </div>

        {/* Model config */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-nasa tracking-widest text-white/80 flex items-center gap-2">
            <Cpu size={20} className="text-[#df71ff]" /> MODELS
          </h2>
          <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <div
                  key={m}
                  className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm font-mono ${
                    m === defaultModel
                      ? 'bg-gradient-to-r from-[#df71ff]/30 to-[#7a5af8]/30 border-white/20 text-white'
                      : 'bg-black/30 border-white/10 text-white/60'
                  }`}
                >
                  {m === defaultModel && <Zap size={12} className="text-[#df71ff]" />}
                  <button onClick={() => handleSetDefaultModel(m)} className="hover:text-white transition-colors" title="Set as default">
                    {m}
                  </button>
                  <button
                    onClick={() => handleRemoveModel(m)}
                    className="hover:text-red-400 text-white/30 transition-colors"
                    title="Remove model"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                placeholder="Add a model id (e.g. gpt-6-astra)"
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none font-mono text-sm placeholder:text-white/40 focus:border-[#7a5af8]/50 transition-colors"
              />
              <button
                onClick={handleAddModel}
                disabled={!newModel.trim()}
                className="shrink-0 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition-colors"
                title="Add model"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-white/40 text-xs">
              Click a model to set it as the mission launcher's default. New OpenAI models can be added here the moment they're released - no update required.
            </p>
            {configError && <p className="text-red-400 text-sm">{configError}</p>}
          </div>
        </div>

        {/* Connect an agent */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-nasa tracking-widest text-white/80 flex items-center gap-2">
            <Zap size={20} className="text-[#df71ff]" /> CONNECT AN AGENT
          </h2>
          <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {agentConnected ? (
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              ) : (
                <XCircle size={16} className="text-white/30 shrink-0" />
              )}
              <span className={`text-sm font-medium ${agentConnected ? 'text-green-400' : 'text-white/50'}`}>
                {agentConnected ? 'An agent is connected to DIMA' : 'No agent connected yet'}
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              To let Antigravity, Claude Code, Cursor or any other MCP-compatible agent call DIMA's own QA
              and security tools, add this to that tool's MCP config file, then restart it. This status
              updates automatically once it connects.
            </p>
            {connectInfo && (
              <div className="relative">
                <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white/80 overflow-x-auto">
                  {connectInfo.configSnippet}
                </pre>
                <button
                  onClick={() => handleCopyConfig('npx')}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-colors"
                >
                  {copied === 'npx' ? <Check size={13} /> : <Copy size={13} />}
                  {copied === 'npx' ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <p className="text-white/30 text-xs">
              Works on any machine once <span className="font-mono">dima-mcp</span> is published to npm. Not there yet? Use the local path below instead.
            </p>

            <button
              onClick={() => setShowLocalConfig((v) => !v)}
              className="self-start text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
            >
              {showLocalConfig ? 'Hide' : 'Show'} local-path config (for this install only)
            </button>
            {showLocalConfig && connectInfo && (
              <div className="relative">
                <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white/80 overflow-x-auto">
                  {connectInfo.localConfigSnippet}
                </pre>
                <button
                  onClick={() => handleCopyConfig('local')}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-colors"
                >
                  {copied === 'local' ? <Check size={13} /> : <Copy size={13} />}
                  {copied === 'local' ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connected servers */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-nasa tracking-widest text-white/80 flex items-center gap-2">
            <Plug size={20} className="text-[#df71ff]" /> MCP SERVERS
          </h2>

          {servers.length === 0 ? (
            <div className="glassContainer p-6 rounded-2xl border border-white/10 text-white/50 text-center">
              No MCP servers connected yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {servers.map((s) => (
                <div key={s.id} className="glassContainer p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {s.status === 'connected' ? (
                      <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-red-500 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{s.name}</span>
                      <span className="text-white/40 font-mono text-xs mt-1">
                        {s.command} {s.args.join(' ')}
                      </span>
                      {s.status === 'connected' ? (
                        <span className="text-white/40 text-xs mt-1">{s.toolCount} tools available</span>
                      ) : (
                        <span className="text-red-400 text-xs mt-1">{s.error || 'Not connected'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.status === 'error' && (
                      <button
                        onClick={() => handleReconnect(s.id)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="Reconnect"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                      title="Remove server"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add server form */}
        <div className="glassContainer p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
          <h3 className="text-lg font-nasa tracking-wide text-white/80">ADD MCP SERVER</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. filesystem)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-motif placeholder:text-white/40 focus:border-[#7a5af8]/50 transition-colors"
          />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Command (e.g. npx)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-motif placeholder:text-white/40 focus:border-[#7a5af8]/50 transition-colors"
          />
          <input
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            placeholder="Args, space-separated (e.g. -y @modelcontextprotocol/server-filesystem /path)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-motif placeholder:text-white/40 focus:border-[#7a5af8]/50 transition-colors"
          />
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            onClick={handleAdd}
            disabled={busy}
            className="self-start flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#df71ff] to-[#7a5af8] hover:opacity-90 disabled:opacity-50 transition-opacity rounded-xl text-white font-medium"
          >
            <Plus size={18} /> {busy ? 'Connecting...' : 'Connect Server'}
          </button>
        </div>
      </div>
    </div>
  );
}
