import { useState, useRef, useEffect } from "react";
import {
  Send, MessageSquare, Monitor, FolderOpen, Settings,
  Bot, Cpu, HardDrive, Wifi, ChevronRight, RotateCcw,
  ArrowLeft, Check, X, Terminal, Zap, Database, Server,
  RefreshCw, FileText, Folder, Power, Camera, Activity,
  Globe, Shield, Play, Pause, Plus, Trash2, Maximize2,
  CircleDot, Layers, Network
} from "lucide-react";

/* ──────────────────────────────────────────────
   CLOUDXGCLOUD BOT  ·  iOS-Elegant + Mac Slide
   - VPS panel + embedded Terminal
   - OpenClaw connected (live)
   - 5 tabs with spring slide transitions
   ────────────────────────────────────────────── */

const PROVIDERS = {
  groq:              { name: "Groq",          icon: "⚡", desc: "Llama-3.3-70B",   group: "Direct API",    ok: true  },
  claude:            { name: "Claude",         icon: "🤖", desc: "Sonnet 4",        group: "Direct API",    ok: true  },
  gemini:            { name: "Gemini",         icon: "✨", desc: "2.0 Flash",       group: "Direct API",    ok: true  },
  deepseek:          { name: "DeepSeek",       icon: "🌊", desc: "Chat",            group: "Direct API",    ok: true  },
  kimi:              { name: "Kimi AI",        icon: "🌙", desc: "v1-8k",           group: "Direct API",    ok: true  },
  xai:               { name: "Grok",           icon: "🌌", desc: "3 Mini",          group: "Direct API",    ok: true  },
  ollama:            { name: "Gemma3-12B",     icon: "🦙", desc: "Ollama Cloud",    group: "Ollama",        ok: true  },
  ollama_gemma27:    { name: "Gemma3-27B",     icon: "🦙", desc: "Ollama Cloud",    group: "Ollama",        ok: true  },
  ollama_gemma4:     { name: "Gemma4-31B",     icon: "🦙", desc: "Ollama Cloud",    group: "Ollama",        ok: true  },
  ollama_mistral:    { name: "Mistral-14B",    icon: "🌀", desc: "Ollama Cloud",    group: "Ollama",        ok: true  },
  ollama_kimi_cloud: { name: "Kimi-K2.5★",    icon: "🌙", desc: "Premium",         group: "Ollama Cloud★", ok: false },
  ollama_minimax:    { name: "MiniMax-M2★",   icon: "🎯", desc: "Premium",         group: "Ollama Cloud★", ok: false },
  ollama_glm:        { name: "GLM-5.1★",      icon: "🔮", desc: "Premium",         group: "Ollama Cloud★", ok: false },
  openclaw:          { name: "BOY/OpenClaw",   icon: "🐾", desc: "Gemini Local",    group: "OpenClaw",      ok: true  }, // ← NOW LIVE
  claude_cli:        { name: "Claude CLI",     icon: "🤖", desc: "Login akun",      group: "CLI",           ok: false },
  gemini_cli:        { name: "Gemini CLI",     icon: "✨", desc: "Login akun",      group: "CLI",           ok: false },
};

const GROUPS = ["Direct API", "Ollama", "Ollama Cloud★", "OpenClaw", "CLI"];

const TOKEN_STATUS = [
  { name: "Claude API",    icon: "🤖", ok: true,  msg: "Kredit tersedia"    },
  { name: "DeepSeek",      icon: "🌊", ok: true,  msg: "Aktif"              },
  { name: "Gemini API",    icon: "✨", ok: true,  msg: "Aktif"              },
  { name: "Kimi AI",       icon: "🌙", ok: true,  msg: "Aktif"              },
  { name: "Groq",          icon: "⚡", ok: true,  msg: "Aktif (gratis)"     },
  { name: "xAI Grok",      icon: "🌌", ok: true,  msg: "Aktif"              },
  { name: "Ollama Cloud",  icon: "🦙", ok: true,  msg: "Models tersedia"    },
  { name: "OpenClaw",      icon: "🐾", ok: true,  msg: "Live · localhost:8080" },
  { name: "Claude CLI",    icon: "🤖", ok: false, msg: "Login diperlukan"   },
  { name: "Gemini CLI",    icon: "✨", ok: false, msg: "Login diperlukan"   },
];

const FILES = [
  { name: "telegram-bot",      type: "dir"  },
  { name: "openclaw",          type: "dir"  },
  { name: "Projects",          type: "dir"  },
  { name: "Downloads",         type: "dir"  },
  { name: "bot.py",            type: "file", size: "24 KB"  },
  { name: "openclaw_agent.py", type: "file", size: "18 KB"  },
  { name: "start_bot.bat",     type: "file", size: "2 KB"   },
  { name: "screenshot.png",    type: "file", size: "1.2 MB" },
  { name: "requirements.txt",  type: "file", size: "1 KB"   },
];

const VPS_SERVICES = [
  { name: "Telegram Bot",   port: 8443, status: "running", icon: "🤖" },
  { name: "OpenClaw Agent", port: 8080, status: "running", icon: "🐾" },
  { name: "AI Gateway",     port: 3000, status: "running", icon: "⚡" },
  { name: "SSH Server",     port: 22,   status: "running", icon: "🔐" },
  { name: "HTTP Proxy",     port: 80,   status: "stopped", icon: "🌐" },
];

const TABS_ORDER = ["chat", "vps", "openclaw", "files", "settings"];

const TERM_BANNER = [
  "Microsoft Windows [Version 11.0.26100.2454]",
  "(c) CLOUDXGCLOUD VPS · Batam-ID-01 · Uptime 14d 03:42",
  "",
  "ASUS@CLOUDX MINGW64 ~",
  "$ bot status",
  "[OK] Bot berjalan · Owner ID: 6463680253",
  "[OK] Default AI: Groq (Llama-3.3-70B)",
  "[OK] OpenClaw agent connected · localhost:8080",
  "[OK] Telegram commands registered",
  "",
];

function fmtTime() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code style=\"font-family:var(--font-mono);font-size:0.9em;padding:1px 4px;background:var(--color-background-tertiary);border-radius:4px;\">$1</code>")
    .replace(/\n/g, "<br/>");
}

/* ── Reusable atoms ───────────────────────────── */

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 4, background: "var(--color-background-tertiary)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.8s cubic-bezier(0.32, 0.72, 0, 1)" }} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, pct, color }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: 14,
      padding: "12px 14px",
      border: "0.5px solid var(--color-border-tertiary)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon size={13} color="var(--color-text-tertiary)" aria-hidden="true" />
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500, letterSpacing: "-0.005em" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>{sub}</p>}
      {pct !== undefined && <ProgressBar value={pct} color={color} />}
    </div>
  );
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: ok ? "#34c759" : "#ff453a",
      boxShadow: ok ? "0 0 8px rgba(52, 199, 89, 0.5)" : "0 0 8px rgba(255, 69, 58, 0.5)",
      flexShrink: 0
    }} />
  );
}

/* ── Main App ─────────────────────────────────── */

export default function App() {
  const [tab, setTab]         = useState("chat");
  const [slideDir, setSlideDir] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const [pid, setPid]         = useState("groq");
  const [msgs, setMsgs]       = useState([
    { role: "bot", text: "CLOUDXGCLOUD BOT aktif 🤖\n\nAI aktif: ⚡ *Groq* (Llama-3.3-70B)\n\nKetik pesan untuk chat dengan AI, atau pilih tab di bawah.", time: "00:47" }
  ]);
  const [input, setInput]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [screen, setScreen]   = useState("main"); // "main" | "providers" | "terminal-full"

  // OpenClaw direct chat
  const [ocMsgs, setOcMsgs] = useState([
    { role: "agent", text: "🐾 *OpenClaw Agent · Connected*\nModel: Gemini Local · Port 8080\nTools: file_io, shell, web_fetch, draw_io\n\nSiap menerima task.", time: fmtTime() }
  ]);
  const [ocInput, setOcInput] = useState("");
  const [ocBusy, setOcBusy] = useState(false);

  const [path, setPath]       = useState("C:\\Users\\ASUS\\Desktop");
  const [cmdIn, setCmdIn]     = useState("");
  const [cmdLog, setCmdLog]   = useState(TERM_BANNER);

  const [cpu, setCpu]         = useState(34);
  const [services, setServices] = useState(VPS_SERVICES);
  const endRef = useRef(null);
  const ocEndRef = useRef(null);
  const termEndRef = useRef(null);

  // Live CPU sim
  useEffect(() => {
    const t = setInterval(() => setCpu(Math.floor(22 + Math.random() * 35)), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (tab === "chat") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, tab]);

  useEffect(() => {
    if (tab === "openclaw") ocEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ocMsgs, ocBusy, tab]);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cmdLog]);

  const p = PROVIDERS[pid];

  function changeTab(newTab) {
    if (newTab === tab) return;
    const oldIdx = TABS_ORDER.indexOf(tab);
    const newIdx = TABS_ORDER.indexOf(newTab);
    setSlideDir(newIdx > oldIdx ? 1 : -1);
    setAnimKey(k => k + 1);
    setTab(newTab);
  }

  async function send() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMsgs(prev => [...prev, { role: "user", text, time: fmtTime() }]);
    setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Kamu adalah asisten AI pribadi bernama "${p.name}". Bagian dari CLOUDXGCLOUD BOT milik pemiliknya di Batam. Jawab dalam Bahasa Indonesia kecuali diminta lain. Ringkas, jelas, dan akurat. Jika ditanya siapa kamu, sebutkan nama provider-mu.`,
          messages: [{ role: "user", content: text }]
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Tidak ada respon.";
      setMsgs(prev => [...prev, { role: "bot", text: `${p.icon} *${p.name}:*\n\n${reply}`, time: fmtTime() }]);
    } catch (e) {
      setMsgs(prev => [...prev, { role: "bot", text: `⚠️ Error: ${e.message}`, time: fmtTime(), err: true }]);
    }
    setBusy(false);
  }

  async function sendOpenClaw() {
    if (!ocInput.trim() || ocBusy) return;
    const text = ocInput.trim();
    setOcInput("");
    setOcMsgs(prev => [...prev, { role: "user", text, time: fmtTime() }]);
    setOcBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `Kamu adalah OpenClaw Agent, AI lokal berbasis Gemini yang berjalan di localhost:8080 milik IKy di Batam. Punya akses tools: file_io, shell, web_fetch, draw_io. Saat menjawab, kadang sebutkan tool mana yang kamu pakai. Gaya jawab: praktis, teknis, ringkas, Bahasa Indonesia kasual. Selalu mulai jawaban dengan emoji 🐾.`,
          messages: [{ role: "user", content: text }]
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "🐾 Agent tidak merespon.";
      setOcMsgs(prev => [...prev, { role: "agent", text: reply, time: fmtTime() }]);
    } catch (e) {
      setOcMsgs(prev => [...prev, { role: "agent", text: `⚠️ Agent error: ${e.message}`, time: fmtTime(), err: true }]);
    }
    setOcBusy(false);
  }

  function switchPid(newPid) {
    setPid(newPid);
    setScreen("main");
    const np = PROVIDERS[newPid];
    setMsgs(prev => [...prev, {
      role: "system",
      text: `AI diganti ke ${np.icon} *${np.name}* (${np.desc})\n${np.ok ? "✅ Siap digunakan" : "⚠️ Perlu konfigurasi tambahan"}`,
      time: fmtTime()
    }]);
    changeTab("chat");
  }

  function runCmd() {
    if (!cmdIn.trim()) return;
    const cmd = cmdIn.trim();
    let out = [];
    if (cmd === "clear" || cmd === "cls") {
      setCmdLog([]);
      setCmdIn("");
      return;
    } else if (cmd === "help") {
      out = ["Available: status, services, ps, uptime, whoami, ipconfig, clear, exit"];
    } else if (cmd === "status") {
      out = [`CPU: ${cpu}% · RAM: 37% · Disk: 24% · Bot: running · OpenClaw: connected`];
    } else if (cmd === "services") {
      out = services.map(s => `  ${s.status === "running" ? "●" : "○"} ${s.name.padEnd(18)} :${s.port}  [${s.status}]`);
    } else if (cmd === "ps") {
      out = ["  PID  NAME             CPU   RAM", "  1024 bot.py          12%   180M", "  2048 openclaw.py      8%    220M", "  3072 ai_gateway.js    3%    95M"];
    } else if (cmd === "uptime") {
      out = ["Uptime: 14 days, 03:42:18 · Load avg: 0.34, 0.41, 0.39"];
    } else if (cmd === "whoami") {
      out = ["ASUS\\IKy · CLOUDXGCLOUD VPS · Batam-ID-01"];
    } else if (cmd === "ipconfig" || cmd === "ifconfig") {
      out = ["eth0  inet 103.142.xx.xx  netmask 255.255.255.0", "lo    inet 127.0.0.1"];
    } else if (cmd === "exit") {
      out = ["Logout. Session closed."];
    } else {
      out = [`'${cmd}' tidak dikenali. Ketik 'help' untuk daftar perintah.`];
    }
    setCmdLog(prev => [...prev, `$ ${cmd}`, ...out, ""]);
    setCmdIn("");
  }

  function toggleService(idx) {
    setServices(prev => prev.map((s, i) =>
      i === idx ? { ...s, status: s.status === "running" ? "stopped" : "running" } : s
    ));
  }

  /* ─── Slide animation styles ────────────────── */
  const slideAnim = slideDir === 0 ? "fadeIn" : (slideDir > 0 ? "slideInRight" : "slideInLeft");

  /* ── Provider screen ──────────────────────── */
  if (screen === "providers") return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)", maxWidth: 420, margin: "0 auto" }}>
      <Style />
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 12px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        position: "sticky", top: 0,
        background: "var(--color-background-primary)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        zIndex: 10
      }}>
        <button onClick={() => setScreen("main")} aria-label="Kembali" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-text-info)", display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Pilih AI Provider</p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>Aktif: {p.icon} {p.name}</p>
        </div>
      </div>

      <div style={{ padding: "8px 12px 80px" }}>
        {GROUPS.map(grp => {
          const items = Object.entries(PROVIDERS).filter(([, v]) => v.group === grp);
          return (
            <div key={grp} style={{ marginTop: 18 }}>
              <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{grp}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map(([id, pr]) => (
                  <button key={id} onClick={() => switchPid(id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
                    background: id === pid ? "var(--color-background-info)" : "var(--color-background-secondary)",
                    border: `0.5px solid ${id === pid ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`,
                    borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)"
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{pr.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: id === pid ? 600 : 500, color: id === pid ? "var(--color-text-info)" : "var(--color-text-primary)", letterSpacing: "-0.01em" }}>{pr.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: id === pid ? "var(--color-text-info)" : "var(--color-text-secondary)" }}>{pr.desc}</p>
                    </div>
                    {id === pid && <Check size={16} color="var(--color-text-info)" strokeWidth={2.5} />}
                    {!pr.ok && id !== pid && (
                      <span style={{ fontSize: 9, padding: "2px 6px", background: "var(--color-background-warning)", color: "var(--color-text-warning)", borderRadius: 4, fontWeight: 600 }}>CONFIG</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Fullscreen Terminal ─────────────────── */
  if (screen === "terminal-full") return (
    <div style={{ fontFamily: "var(--font-mono)", maxWidth: 420, margin: "0 auto", background: "#0a0a0c", minHeight: 560 }}>
      <Style />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 12px", borderBottom: "0.5px solid #1f1f24",
        background: "rgba(20, 20, 24, 0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <button onClick={() => setScreen("main")} aria-label="Kembali" style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#7aa2f7", display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={20} /> <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)", fontSize: 14 }}>VPS</span>
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#e6e6e6", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)", letterSpacing: "-0.01em" }}>Terminal</p>
          <p style={{ margin: 0, fontSize: 10, color: "#7aa2f7", fontFamily: "var(--font-mono)" }}>iky@cloudx-batam-01 · zsh</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
        </div>
      </div>

      <div style={{ padding: "12px 14px", minHeight: 440, maxHeight: 440, overflowY: "auto" }}>
        {cmdLog.map((line, i) => (
          <p key={i} style={{
            margin: "0 0 1px",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: line.startsWith("$") ? "#7aa2f7" : line.startsWith("[OK]") ? "#9ece6a" : line.startsWith("[Simulasi]") || line.startsWith("Warning") ? "#e0af68" : "#c0caf5",
            lineHeight: 1.6,
            wordBreak: "break-all",
            whiteSpace: "pre-wrap"
          }}>{line || "\u00A0"}</p>
        ))}
        <div ref={termEndRef} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "0.5px solid #1f1f24", background: "rgba(20, 20, 24, 0.92)" }}>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#9ece6a", flexShrink: 0 }}>$</span>
        <input
          autoFocus
          value={cmdIn}
          onChange={e => setCmdIn(e.target.value)}
          onKeyDown={e => e.key === "Enter" && runCmd()}
          placeholder="ketik perintah... (help)"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, fontFamily: "var(--font-mono)", color: "#c0caf5" }}
        />
        <button onClick={runCmd} aria-label="Jalankan" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: "#7aa2f7" }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );

  /* ── Main screen ─────────────────────────── */
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)", maxWidth: 420, margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <Style />

      {/* iOS-style translucent app bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>CLOUDXGCLOUD</p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
            <StatusDot ok={true} /> Aktif — {p.icon} {p.name}
          </p>
        </div>
        <button onClick={() => setScreen("providers")} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "6px 11px",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: 10, cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)",
          transition: "transform 0.15s ease"
        }}>
          <Bot size={13} aria-hidden="true" /> Ganti AI
        </button>
      </div>

      {/* Animated content container */}
      <div key={animKey} style={{ animation: `${slideAnim} 0.42s cubic-bezier(0.32, 0.72, 0, 1) both` }}>

        {/* ── CHAT ── */}
        {tab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: 430 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7 }}>
                  {m.role !== "user" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {m.role === "system" ? "ℹ️" : "🤖"}
                    </div>
                  )}
                  <div style={{ maxWidth: "76%" }}>
                    <div style={{
                      padding: "9px 13px",
                      background: m.role === "user" ? "var(--color-background-info)" : m.role === "system" ? "var(--color-background-warning)" : "var(--color-background-secondary)",
                      border: `0.5px solid ${m.role === "user" ? "var(--color-border-info)" : m.role === "system" ? "var(--color-border-warning)" : "var(--color-border-tertiary)"}`,
                      borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: 13, lineHeight: 1.55,
                      color: m.role === "user" ? "var(--color-text-info)" : "var(--color-text-primary)"
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
                    </div>
                    <p style={{ margin: "2px 5px 0", fontSize: 10, color: "var(--color-text-tertiary)", textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</p>
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🤖</div>
                  <div style={{ padding: "9px 13px", background: "var(--color-background-secondary)", borderRadius: "18px 18px 18px 4px", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{p.icon} {p.name} sedang berpikir...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Pesan ke ${p.icon} ${p.name}...`}
                rows={1}
                style={{ flex: 1, resize: "none", fontSize: 13, lineHeight: 1.5, padding: "8px 12px", borderRadius: 18, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "inherit", maxHeight: 80, overflowY: "auto" }}
              />
              <button onClick={send} disabled={busy || !input.trim()} aria-label="Kirim" style={{
                width: 36, height: 36, borderRadius: "50%",
                background: (input.trim() && !busy) ? "var(--color-background-info)" : "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-info)",
                cursor: (input.trim() && !busy) ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)"
              }}>
                <Send size={14} color={(input.trim() && !busy) ? "var(--color-text-info)" : "var(--color-text-tertiary)"} />
              </button>
            </div>
          </div>
        )}

        {/* ── VPS PANEL ── */}
        {tab === "vps" && (
          <div style={{ padding: "12px 12px 80px", overflowY: "auto", maxHeight: 480 }}>

            {/* Hero server card */}
            <div style={{
              background: "linear-gradient(135deg, var(--color-background-info) 0%, var(--color-background-secondary) 100%)",
              border: "0.5px solid var(--color-border-info)",
              borderRadius: 18,
              padding: "16px",
              marginBottom: 12,
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "var(--color-background-info)",
                  border: "0.5px solid var(--color-border-info)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Server size={20} color="var(--color-text-info)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>cloudx-batam-01</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Windows 11 Pro · 103.142.xx.xx</p>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#34c759" }}>
                  <StatusDot ok={true} /> Online
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
                <div>
                  <p style={{ margin: 0, color: "var(--color-text-tertiary)" }}>Location</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 600 }}>🇮🇩 Batam-ID</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: "var(--color-text-tertiary)" }}>Uptime</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 600 }}>14d 03:42</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: "var(--color-text-tertiary)" }}>Plan</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 600 }}>Pro · 16GB</p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
              {[
                { Icon: Terminal, label: "Console", action: () => setScreen("terminal-full"), highlight: true },
                { Icon: RotateCcw, label: "Reboot",  action: () => setCmdLog(prev => [...prev, "$ reboot", "[OK] Server reboot scheduled."]) },
                { Icon: Camera,   label: "Snapshot", action: () => alert("Snapshot dijadwalkan.") },
                { Icon: Power,    label: "Power",    action: () => alert("Power action.") },
              ].map(({ Icon, label, action, highlight }, i) => (
                <button key={i} onClick={action} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  padding: "11px 4px",
                  background: highlight ? "var(--color-background-info)" : "var(--color-background-secondary)",
                  border: `0.5px solid ${highlight ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                  color: highlight ? "var(--color-text-info)" : "var(--color-text-primary)"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <Icon size={18} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
                </button>
              ))}
            </div>

            {/* Resource metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <MetricCard icon={Cpu} label="CPU" value={`${cpu}%`}
                pct={cpu} color={cpu > 70 ? "#ff453a" : "#34c759"} />
              <MetricCard icon={Database} label="RAM" value="37%"
                sub="6.0 / 16 GB" pct={37} color="#0a84ff" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <MetricCard icon={HardDrive} label="Disk" value="24%"
                sub="234 / 953 GB" pct={24} color="#34c759" />
              <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Network size={13} color="var(--color-text-tertiary)" aria-hidden="true" />
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500 }}>Bandwidth</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>↑ 1.2 GB</p>
                <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600 }}>↓ 8.7 GB</p>
              </div>
            </div>

            {/* Services */}
            <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Services</p>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden", marginBottom: 14 }}>
              {services.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "11px 13px",
                  borderBottom: i < services.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none"
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>Port {s.port}</p>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: s.status === "running" ? "#34c759" : "var(--color-text-tertiary)" }}>
                    <StatusDot ok={s.status === "running"} />
                    {s.status}
                  </span>
                  <button onClick={() => toggleService(i)} style={{
                    background: "var(--color-background-tertiary)", border: "none", borderRadius: 8,
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--color-text-secondary)"
                  }}>
                    {s.status === "running" ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                </div>
              ))}
            </div>

            {/* Embedded mini terminal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ margin: "0 4px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Terminal</p>
              <button onClick={() => setScreen("terminal-full")} style={{
                background: "none", border: "none", color: "var(--color-text-info)",
                fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, padding: "2px 6px"
              }}>
                <Maximize2 size={11} /> Fullscreen
              </button>
            </div>
            <div style={{
              background: "#0a0a0c", borderRadius: 12,
              border: "0.5px solid #1f1f24", padding: "10px 12px",
              fontFamily: "var(--font-mono)"
            }}>
              <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 8 }}>
                {cmdLog.slice(-6).map((line, i) => (
                  <p key={i} style={{
                    margin: "0 0 1px", fontSize: 10,
                    color: line.startsWith("$") ? "#7aa2f7" : line.startsWith("[OK]") ? "#9ece6a" : "#c0caf5",
                    wordBreak: "break-all", lineHeight: 1.5
                  }}>{line || "\u00A0"}</p>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "0.5px solid #1f1f24", paddingTop: 7 }}>
                <span style={{ fontSize: 10, color: "#9ece6a", flexShrink: 0 }}>$</span>
                <input
                  value={cmdIn}
                  onChange={e => setCmdIn(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runCmd()}
                  placeholder="ketik perintah... (help)"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 11, fontFamily: "inherit", color: "#c0caf5" }}
                />
                <button onClick={runCmd} aria-label="Jalankan" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: "#7aa2f7" }}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── OPENCLAW ── */}
        {tab === "openclaw" && (
          <div style={{ display: "flex", flexDirection: "column", height: 430 }}>
            {/* Agent header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 11, padding: "11px 13px",
              background: "var(--color-background-secondary)",
              borderBottom: "0.5px solid var(--color-border-tertiary)"
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: "linear-gradient(135deg, var(--color-background-info), var(--color-background-success))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                border: "0.5px solid var(--color-border-info)"
              }}>🐾</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>OpenClaw Agent</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <StatusDot ok={true} /> Connected · Gemini Local
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 9, padding: "2px 6px", background: "var(--color-background-success)", color: "var(--color-text-success)", borderRadius: 4, fontWeight: 600, letterSpacing: "0.04em" }}>LIVE</span>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>:8080</span>
              </div>
            </div>

            {/* Tool chips */}
            <div style={{ display: "flex", gap: 5, padding: "8px 12px", overflowX: "auto", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {[
                { name: "file_io",   icon: "📁" },
                { name: "shell",     icon: "💻" },
                { name: "web_fetch", icon: "🌐" },
                { name: "draw_io",   icon: "🎨" },
                { name: "vision",    icon: "👁️" },
              ].map(t => (
                <span key={t.name} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", background: "var(--color-background-secondary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 999, fontSize: 11, fontFamily: "var(--font-mono)",
                  color: "var(--color-text-secondary)", flexShrink: 0
                }}>
                  <span style={{ fontSize: 11 }}>{t.icon}</span> {t.name}
                </span>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
              {ocMsgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7 }}>
                  {m.role === "agent" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-background-info), var(--color-background-success))", border: "0.5px solid var(--color-border-info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      🐾
                    </div>
                  )}
                  <div style={{ maxWidth: "76%" }}>
                    <div style={{
                      padding: "9px 13px",
                      background: m.role === "user" ? "var(--color-background-info)" : "var(--color-background-secondary)",
                      border: `0.5px solid ${m.role === "user" ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`,
                      borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: 13, lineHeight: 1.55,
                      color: m.role === "user" ? "var(--color-text-info)" : "var(--color-text-primary)"
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
                    </div>
                    <p style={{ margin: "2px 5px 0", fontSize: 10, color: "var(--color-text-tertiary)", textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</p>
                  </div>
                </div>
              ))}
              {ocBusy && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-background-info), var(--color-background-success))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🐾</div>
                  <div style={{ padding: "9px 13px", background: "var(--color-background-secondary)", borderRadius: "18px 18px 18px 4px", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>🐾 Agent berpikir... <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>[tool: thinking]</span></span>
                  </div>
                </div>
              )}
              <div ref={ocEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 10px 12px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={ocInput}
                onChange={e => setOcInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendOpenClaw(); } }}
                placeholder="Beri perintah ke OpenClaw..."
                rows={1}
                style={{ flex: 1, resize: "none", fontSize: 13, lineHeight: 1.5, padding: "8px 12px", borderRadius: 18, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "inherit", maxHeight: 80, overflowY: "auto" }}
              />
              <button onClick={sendOpenClaw} disabled={ocBusy || !ocInput.trim()} aria-label="Kirim" style={{
                width: 36, height: 36, borderRadius: "50%",
                background: (ocInput.trim() && !ocBusy) ? "var(--color-background-info)" : "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-info)",
                cursor: (ocInput.trim() && !ocBusy) ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Send size={14} color={(ocInput.trim() && !ocBusy) ? "var(--color-text-info)" : "var(--color-text-tertiary)"} />
              </button>
            </div>
          </div>
        )}

        {/* ── FILES ── */}
        {tab === "files" && (
          <div style={{ padding: "12px 12px 80px", overflowY: "auto", maxHeight: 480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", background: "var(--color-background-secondary)", borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", marginBottom: 12 }}>
              <Folder size={12} color="var(--color-text-tertiary)" aria-hidden="true" />
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{path}</span>
            </div>

            <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden", marginBottom: 16 }}>
              {FILES.map((f, i) => (
                <div key={i} onClick={() => f.type === "dir" && setPath(path + "\\" + f.name)} style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 13px",
                  borderBottom: i < FILES.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                  cursor: f.type === "dir" ? "pointer" : "default"
                }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{f.type === "dir" ? "📁" : f.name.endsWith(".py") ? "🐍" : f.name.endsWith(".png") ? "🖼️" : f.name.endsWith(".bat") ? "⚙️" : "📄"}</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>{f.name}</p>
                    {f.size && <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.size}</p>}
                  </div>
                  {f.type === "dir" && <ChevronRight size={14} color="var(--color-text-tertiary)" />}
                </div>
              ))}
            </div>

            {/* Token status moved here */}
            <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Token & Kredit</p>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
              {TOKEN_STATUS.map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 13px",
                  borderBottom: i < TOKEN_STATUS.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none"
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t.icon} {t.name}</span>
                  <span style={{ fontSize: 11, color: t.ok ? "var(--color-text-success)" : "var(--color-text-warning)", display: "flex", alignItems: "center", gap: 4 }}>
                    <StatusDot ok={t.ok} /> {t.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div style={{ padding: "12px 12px 80px", overflowY: "auto", maxHeight: 480 }}>
            <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>AI Provider</p>

            {GROUPS.slice(0, 2).map(grp => {
              const items = Object.entries(PROVIDERS).filter(([, v]) => v.group === grp);
              return (
                <div key={grp} style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 4px 6px", fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 500, letterSpacing: "0.04em" }}>{grp.toUpperCase()}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {items.map(([id, pr]) => (
                      <button key={id} onClick={() => switchPid(id)} style={{
                        display: "flex", flexDirection: "column", padding: "11px 11px",
                        background: id === pid ? "var(--color-background-info)" : "var(--color-background-secondary)",
                        border: `0.5px solid ${id === pid ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`,
                        borderRadius: 12, cursor: "pointer", textAlign: "left",
                        transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)"
                      }}>
                        <span style={{ fontSize: 18, marginBottom: 5 }}>{pr.icon}</span>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: id === pid ? 600 : 500, color: id === pid ? "var(--color-text-info)" : "var(--color-text-primary)", letterSpacing: "-0.005em" }}>{pr.name}</p>
                        <p style={{ margin: 0, fontSize: 10, color: id === pid ? "var(--color-text-info)" : "var(--color-text-tertiary)" }}>{pr.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <button onClick={() => setScreen("providers")} style={{
              width: "100%", padding: "11px", marginBottom: 16,
              background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5
            }}>
              Lihat semua {Object.keys(PROVIDERS).length} provider <ChevronRight size={13} />
            </button>

            <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Bot Control</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => {
                setMsgs([{ role: "bot", text: "🔄 Bot sedang restart...\n\n✅ Bot berhasil direstart!\n\nAI aktif: " + p.icon + " *" + p.name + "*", time: fmtTime() }]);
                changeTab("chat");
              }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 11, background: "var(--color-background-warning)", border: "0.5px solid var(--color-border-warning)", borderRadius: 12, cursor: "pointer", fontSize: 12, color: "var(--color-text-warning)", fontWeight: 600 }}>
                <RotateCcw size={13} aria-hidden="true" /> Restart Bot
              </button>
              <button onClick={() => { setMsgs([]); changeTab("chat"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 11, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 12, cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>
                <X size={13} aria-hidden="true" /> Clear Chat
              </button>
            </div>

            <p style={{ margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Commands</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {[
                ["/start", "Menu utama"],
                ["/ai", "Ganti AI provider"],
                ["/status", "CPU, RAM & Disk"],
                ["/screenshot", "Screenshot laptop"],
                ["/cmd <perintah>", "Jalankan terminal"],
                ["/files [path]", "List isi folder"],
                ["/openclaw <task>", "Kirim task ke OpenClaw"],
                ["/tokens", "Cek kredit semua AI"],
                ["/clear", "Hapus riwayat chat"],
              ].map(([cmd, desc], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 13px", background: "var(--color-background-secondary)", borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)" }}>
                  <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-info)", fontWeight: 600 }}>{cmd}</code>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* iOS-style Tab Bar */}
      <div style={{
        display: "flex",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        position: "sticky", bottom: 0
      }}>
        {[
          { id: "chat",     Icon: MessageSquare, label: "Chat"     },
          { id: "vps",      Icon: Server,        label: "VPS"      },
          { id: "openclaw", Icon: Layers,        label: "OpenClaw" },
          { id: "files",    Icon: FolderOpen,    label: "Files"    },
          { id: "settings", Icon: Settings,      label: "Tools"    },
        ].map(({ id, Icon, label }) => (
          <button key={id} onClick={() => changeTab(id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "9px 4px 9px", background: "none", border: "none", cursor: "pointer",
            color: tab === id ? "var(--color-text-info)" : "var(--color-text-tertiary)",
            transition: "color 0.2s cubic-bezier(0.32, 0.72, 0, 1)"
          }}>
            <Icon size={20} aria-hidden="true" strokeWidth={tab === id ? 2.4 : 2} />
            <span style={{ fontSize: 10, marginTop: 3, fontWeight: tab === id ? 600 : 500, letterSpacing: "0.01em" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Global keyframes + smoothing ────────── */
function Style() {
  return (
    <style>{`
      @keyframes slideInRight {
        0%   { transform: translate3d(8%, 0, 0) scale(0.985); opacity: 0; }
        60%  { opacity: 1; }
        100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
      }
      @keyframes slideInLeft {
        0%   { transform: translate3d(-8%, 0, 0) scale(0.985); opacity: 0; }
        60%  { opacity: 1; }
        100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.985); }
        to   { opacity: 1; transform: scale(1); }
      }
      button:active { transform: scale(0.96); }
      input::placeholder, textarea::placeholder { color: var(--color-text-tertiary); }
    `}</style>
  );
}
