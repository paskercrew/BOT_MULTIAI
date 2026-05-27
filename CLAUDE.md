# CLAUDE.md — Bot Tele MultiAI

Panduan komprehensif untuk AI assistant (Claude, Gemini, dll) yang bekerja di repository ini.

---

## 🎯 Ringkasan Proyek

**Bot Tele MultiAI** adalah Android APK self-contained yang berfungsi sebagai:
- Telegram bot controller
- VPS panel (monitoring CPU, RAM, Disk, Bandwidth)
- Terminal emulator
- Multi-AI chat interface (17 provider)
- OpenClaw AI agent (embedded Gemini atau external server)

**Output build**: `bot_Tele_MultiAi.apk`  
**App ID**: `id.proxinet.bottelemultiai`  
**Owner**: IKy / PROXINET Batam  
**Telegram Owner ID**: `6463680253` — **JANGAN diubah**

---

## 📁 Struktur Repository

```
bot_multiai/
├── index.html              # ⭐ CORE — Single-file PWA (React + UI + logic, ~72KB)
├── CLOUDX_BOT.jsx          # Preview/prototype untuk Claude Artifacts (opsional)
├── manifest.json           # PWA manifest (icon, display mode, theme)
├── sw.js                   # Service worker (offline cache)
├── icon-192.png            # App icon 192×192
├── icon-512.png            # App icon 512×512
├── package.json            # Capacitor + npm dependencies
├── capacitor.config.json   # Capacitor config (app ID, cleartext, plugins)
├── build.sh                # Build APK lokal (Linux/macOS)
├── build.bat               # Build APK lokal (Windows)
├── babel.min.js            # Babel Standalone (bundled lokal, ~3MB)
├── react.min.js            # React 18 UMD (bundled lokal, ~10KB)
├── react-dom.min.js        # ReactDOM 18 UMD (bundled lokal, ~131KB)
├── README.md               # Dokumentasi utama (Bahasa Indonesia)
├── QUICKSTART_GITHUB.md    # Panduan build via GitHub Actions
└── .github/
    └── workflows/
        └── build.yml       # ⭐ GitHub Actions — auto-build APK di cloud
```

### File Kritis

| File | Keterangan |
|------|-----------|
| `index.html` | **Jangan pisah menjadi banyak file.** Seluruh app ada di sini — React + Babel diload lokal, semua logic inline. |
| `CLOUDX_BOT.jsx` | Versi preview untuk dibuka di Claude Artifacts. Boleh dimodifikasi independen dari `index.html`. |
| `.github/workflows/build.yml` | Jangan hapus — ini yang menjalankan build APK otomatis di GitHub cloud. |
| `capacitor.config.json` | App ID `id.proxinet.bottelemultiai` harus konsisten. |
| `react.min.js`, `react-dom.min.js`, `babel.min.js` | File besar yang di-bundle lokal agar APK bisa offline. Jangan hapus. |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|----------|
| Frontend | React 18 (UMD build), Babel Standalone (JSX di browser) |
| Mobile Wrapper | Capacitor 6 (`@capacitor/android`, `@capacitor/core`) |
| Build Tool (Android) | Gradle (via Capacitor) |
| CI/CD | GitHub Actions (`ubuntu-latest`, Node 20, JDK 17, Android SDK 34) |
| Styling | Inline styles (CSS variables via Claude/shadcn theme tokens) |
| Icons | Lucide React (di CLOUDX_BOT.jsx) |
| PWA | Service Worker + Web App Manifest |

**Tidak ada** Webpack, Vite, atau bundler — `index.html` adalah single-file app yang langsung dijalankan browser. Babel Standalone menangani transpilasi JSX secara runtime.

---

## 🤖 AI Providers (17 Provider)

### Direct API (`ok: true` — siap pakai)
| ID | Nama | Model |
|----|------|-------|
| `groq` | Groq | Llama-3.3-70B |
| `claude` | Claude | Sonnet 4 |
| `gemini` | Gemini | 2.0 Flash |
| `deepseek` | DeepSeek | Chat |
| `kimi` | Kimi AI | v1-8k |
| `xai` | Grok | 3 Mini |

### Ollama (`ok: true`)
| ID | Nama | Model |
|----|------|-------|
| `ollama` | Gemma3-12B | Ollama Cloud |
| `ollama_gemma27` | Gemma3-27B | Ollama Cloud |
| `ollama_gemma4` | Gemma4-31B | Ollama Cloud |
| `ollama_mistral` | Mistral-14B | Ollama Cloud |

### Ollama Cloud★ Premium (`ok: false` — perlu config)
| ID | Nama |
|----|------|
| `ollama_kimi_cloud` | Kimi-K2.5★ |
| `ollama_minimax` | MiniMax-M2★ |
| `ollama_glm` | GLM-5.1★ |

### Lainnya
| ID | Nama | Status |
|----|------|--------|
| `openclaw` | BOY/OpenClaw | ✅ Live via Gemini Local |
| `claude_cli` | Claude CLI | ❌ Perlu login |
| `gemini_cli` | Gemini CLI | ❌ Perlu login |

**Default provider**: `groq` (Llama-3.3-70B)

---

## 📱 Tab & Fitur App

### Tab Order: `["chat", "vps", "openclaw", "files", "settings"]`

| Tab | ID | Deskripsi |
|-----|----|-----------|
| Chat | `chat` | Kirim pesan ke AI provider yang aktif |
| VPS | `vps` | Panel server: hero card, metrics, services, mini terminal |
| OpenClaw | `openclaw` | Chat dengan OpenClaw agent (Embedded/External) |
| Files | `files` | File browser + daftar token kredit |
| Tools | `settings` | Ganti AI provider, bot control, Telegram commands |

### Screens (di dalam main view)
- `"main"` — tampilan utama dengan tabs
- `"providers"` — fullscreen daftar semua AI provider
- `"terminal-full"` — fullscreen terminal emulator

---

## 🐾 OpenClaw Agent

### Mode Embedded (Default — Recommended)
- Panggil Gemini API **langsung dari APK**
- Butuh Gemini API key (gratis: https://aistudio.google.com/apikey)
- Free tier: 1500 request/hari, 1 juta token context
- Default model: **Gemini 2.0 Flash**

### Mode External
- Connect ke OpenClaw server di laptop/VPS via HTTP
- URL harus IP LAN/publik, **bukan `localhost`** (di Android = HP sendiri)
- Kalau CORS error, tambah middleware di server:
  ```python
  # FastAPI
  app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
  ```

### Tools yang di-expose OpenClaw
`file_io` · `shell` · `web_fetch` · `draw_io` · `vision`

---

## 🏗️ Build APK

### Metode A: GitHub Actions (Direkomendasikan)
1. Push ke branch `main` → workflow otomatis jalan
2. Atau manual: **Actions → Build APK → Run workflow**
3. Download artifact `bot_Tele_MultiAi-N` dari tab Actions

**Workflow file**: `.github/workflows/build.yml`
- Runner: `ubuntu-latest`, timeout 25 menit
- Node.js 20, JDK 17 (Temurin), Android SDK API 34
- Artifact tersimpan 30 hari

### Metode B: Build Lokal (Linux/macOS)
```bash
# Prerequisites: Node.js 18+, JDK 17, Android SDK, ANDROID_HOME
chmod +x build.sh
./build.sh          # debug APK
./build.sh release  # release APK (butuh keystore)
```

### Metode C: Build Lokal (Windows)
```bat
build.bat
```

### Proses Build (Otomatis oleh script)
1. Copy `index.html`, `manifest.json`, `sw.js`, icons, JS libs ke `www/`
2. `npm install` — install Capacitor
3. `npx cap add android` — tambah platform Android
4. `npx cap sync android` — sync web ke Android
5. Patch `AndroidManifest.xml` — tambah `network_security_config` (allow cleartext HTTP)
6. `./gradlew assembleDebug` — build APK
7. Copy ke `bot_Tele_MultiAi.apk`

### Release Build dengan Keystore Custom
Set secrets di GitHub repo:
- `KEYSTORE_B64` — base64-encoded keystore
- `KEYSTORE_PASSWORD` — password keystore
- `KEY_PASSWORD` — password alias

---

## 🎨 Konvensi UI/UX

### Design Language
- **iOS-style**: backdrop blur, 0.5px hairlines, dark mode auto
- **Font**: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-sans)`
- **Font mono**: `var(--font-mono)` untuk terminal dan kode
- **Dark background**: `#000000` / `#0a0a0c` untuk terminal
- **Tema**: CSS variables dari Claude/shadcn theme tokens (`var(--color-background-*)`, `var(--color-text-*)`, dll)

### Animasi Tab (Mac Slide Transition)
```
cubic-bezier(0.32, 0.72, 0, 1)   // Spring easing
duration: 0.42s
```

Keyframes:
- `slideInRight` — masuk dari kanan (tab index meningkat)
- `slideInLeft` — masuk dari kiri (tab index menurun)
- `fadeIn` — transisi pertama kali

### Komponen Atoms
- `ProgressBar` — bar metrik CPU/RAM/Disk
- `MetricCard` — card dengan icon, value, progress bar
- `StatusDot` — dot hijau (ok) atau merah (error), dengan glow effect

### Status Colors
| Status | Color |
|--------|-------|
| Online/Running | `#34c759` (iOS green) |
| Error/Stopped | `#ff453a` (iOS red) |
| Info/Active | `var(--color-text-info)` |
| Warning | `var(--color-text-warning)` |

---

## 📋 Telegram Bot Commands

| Command | Fungsi |
|---------|--------|
| `/start` | Menu utama |
| `/ai` | Ganti AI provider |
| `/status` | CPU, RAM & Disk |
| `/screenshot` | Screenshot laptop |
| `/cmd <perintah>` | Jalankan terminal command |
| `/files [path]` | List isi folder |
| `/openclaw <task>` | Kirim task ke OpenClaw agent |
| `/tokens` | Cek kredit semua AI |
| `/clear` | Hapus riwayat chat |

---

## 💻 Terminal Emulator (Built-in)

Terminal ada di dua tempat: mini di tab VPS dan fullscreen (`terminal-full`).

### Commands yang Didukung
| Command | Output |
|---------|--------|
| `help` | Daftar semua commands |
| `status` | CPU%, RAM%, Disk%, bot status |
| `services` | List services + port + status |
| `ps` | Process list (PID, nama, CPU, RAM) |
| `uptime` | Server uptime |
| `whoami` | Username & server info |
| `ipconfig` / `ifconfig` | Network interface |
| `clear` / `cls` | Clear terminal |
| `exit` | Logout message |

### Terminal UI
- Background: `#0a0a0c`
- Command prompt: warna `#7aa2f7` (biru)
- `[OK]` lines: warna `#9ece6a` (hijau)
- Warning: warna `#e0af68` (kuning)
- Normal text: `#c0caf5`
- macOS-style window dots: merah/kuning/hijau di header fullscreen

---

## 🌐 Service Worker

File `sw.js` menangani offline caching:
- Cache name: `bottelemultiai-v2`
- Assets yang di-cache: `index.html`, `manifest.json`, icons, React libs (dari unpkg CDN)
- **Tidak di-cache**: API calls, `/api/`, `/v1/chat/completions`, Anthropic, localhost, IP LAN

---

## ⚙️ Capacitor Config

```json
{
  "appId": "id.proxinet.bottelemultiai",
  "appName": "Bot Tele MultiAI",
  "webDir": "www",
  "android": {
    "allowMixedContent": true,
    "webContentsDebuggingEnabled": true
  },
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowNavigation": ["*"]
  }
}
```

**SplashScreen**: 1200ms, background hitam  
**StatusBar**: Dark style, background hitam

---

## 📱 VPS Panel — Data & Services

### VPS Identity (Mock/Hardcoded)
- **Hostname**: `cloudx-batam-01`
- **OS**: Windows 11 Pro
- **IP**: `103.142.xx.xx`
- **Location**: 🇮🇩 Batam-ID
- **Plan**: Pro · 16GB RAM

### Services
| Service | Port | Default Status |
|---------|------|---------------|
| Telegram Bot | 8443 | running |
| OpenClaw Agent | 8080 | running |
| AI Gateway | 3000 | running |
| SSH Server | 22 | running |
| HTTP Proxy | 80 | stopped |

### Resource Metrics (Simulated)
- CPU: 22–57% (random setiap 3 detik via `setInterval`)
- RAM: 37% (6.0/16 GB)
- Disk: 24% (234/953 GB)
- Bandwidth: ↑1.2 GB / ↓8.7 GB

---

## 🔧 Development Workflows

### Modifikasi UI (index.html)
1. Edit langsung di `index.html` — tidak perlu build step
2. Test via browser: buka `index.html` atau jalankan `npm run serve`
3. Untuk lihat di mobile: `npx cap sync android` lalu buka di Android Studio / adb

### Tambah AI Provider Baru
1. Tambah entry ke `PROVIDERS` object di `index.html` dan `CLOUDX_BOT.jsx`:
   ```js
   newprovider: { name: "Name", icon: "🆕", desc: "Model name", group: "Direct API", ok: true }
   ```
2. Kalau group baru, tambah ke `GROUPS` array
3. Tambah ke `TOKEN_STATUS` jika butuh credit monitoring

### Modifikasi Terminal Commands
Cari fungsi `runCmd()` di `index.html` → tambah `else if (cmd === "newcmd")` block

### Build APK Setelah Perubahan
- Cukup push ke `main` → GitHub Actions otomatis rebuild
- Jangan perlu jalankan `build.sh` manual kecuali testing lokal

---

## ⚠️ Hal yang TIDAK Boleh Dilakukan

1. **Jangan pisah `index.html`** menjadi banyak file component — ini single-file by design
2. **Jangan hapus `babel.min.js`, `react.min.js`, `react-dom.min.js`** — APK butuh ini untuk offline
3. **Jangan ubah `appId`** di `capacitor.config.json` — kalau berubah, update di semua device harus uninstall dulu
4. **Jangan hardcode API key** ke dalam file apapun — selalu pakai input dari user atau environment variable
5. **Jangan ubah Telegram owner ID** `6463680253` tanpa izin explicit dari owner
6. **Jangan hapus `.github/workflows/build.yml`** — ini pipeline build utama

---

## 📦 npm Scripts

```bash
npm run prep        # Copy web files ke www/
npm run serve       # Serve via http-server di port 5173
npm run cap:add     # npx cap add android
npm run cap:sync    # npx cap sync android
npm run cap:open    # Buka di Android Studio
npm run build:apk   # Jalankan build.sh
```

---

## 🌿 Branches

| Branch | Tujuan |
|--------|--------|
| `main` | Production — push trigger GitHub Actions build |
| `claude/android-rdp-client-jQtrz` | Feature: Android RDP client |
| `claude/create-error-free-tools-2A1Fr` | Feature: error-free tools |
| `claude/fix-apk-issues-NhQu9` | Fix: APK build issues |
| `claude/claude-md-docs-ZcDEc` | Docs: CLAUDE.md (branch ini) |

---

## 🔐 Network Security

Android manifest di-patch saat build untuk mengizinkan:
- Cleartext HTTP (untuk koneksi ke server lokal/IP LAN)
- `localhost`, `127.0.0.1`, `10.0.2.2`
- Range `192.168.x.x` dan `10.x.x.x`
- User-trusted certificates (dev/testing)

---

## 📝 Bahasa & Tone

- **Komentar kode**: Bahasa Indonesia kasual (campuran Indonesia-Inggris technical terms)
- **UI text**: Bahasa Indonesia
- **Commit messages**: Bahasa Inggris (conventional commits)
- **Dokumentasi**: Bahasa Indonesia

---

## 🚀 Quick Reference

```bash
# Setup lokal (pertama kali)
npm install

# Serve PWA lokal
npm run serve
# → buka http://localhost:5173

# Build APK lokal
./build.sh          # Linux/macOS
build.bat           # Windows

# Lihat di Android Studio
npx cap open android

# Deploy via GitHub (paling mudah)
git push origin main  # → GitHub Actions auto-build
```

---

*Dibuat oleh Claude Code · Repository: paskercrew/BOT_MULTIAI · Updated: 2026-05-27*
