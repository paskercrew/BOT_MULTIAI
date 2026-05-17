# Bot Tele MultiAI

**APK Android self-contained** — Telegram bot controller + VPS panel + Terminal + **OpenClaw embedded** (Gemini built-in, nggak perlu server eksternal).

Output: `bot_Tele_MultiAi.apk`

---

## 🎯 OpenClaw embedded di dalam APK

App sekarang punya 2 mode untuk OpenClaw agent:

| Mode | Buat siapa |
|---|---|
| **📦 Embedded** (default) | Self-contained — agent jalan langsung di dalam APK lewat Gemini API. **Nggak perlu server lokal/VPS apa-apa.** Tinggal masukin Gemini API key (gratis dari Google AI Studio, 1500 request/hari). |
| **🌐 External** | Connect ke OpenClaw server di laptop/VPS IKy via HTTP. Buat yang udah punya OpenClaw server jalan dan mau pakai itu. |

Switch mode di-app: **Tools → OpenClaw Agent → Mode**.

Mode default **Embedded**, jadi sekali install + masukin API key Gemini sekali, langsung jalan tanpa setup server tambahan.

---

## 🚀 Cara dapat APK (pilih satu)

### Opsi A: GitHub Actions (PALING MUDAH, tanpa Android Studio) ⭐

📖 **Baca: `QUICKSTART_GITHUB.md`**

Singkatnya:
1. Bikin GitHub repo, upload semua file (termasuk folder `.github/`)
2. Push → GitHub auto-build APK di cloud
3. Download dari tab **Actions → Artifacts**
4. Install ke HP

~5 menit, gratis, nggak install apa-apa.

### Opsi B: Build sendiri di laptop

Prasyarat: Node 18+, JDK 17, Android Studio (sekalian Android SDK).

```bash
cd bot_tele_multiai
chmod +x build.sh
./build.sh
```

Output: `bot_Tele_MultiAi.apk` di folder yang sama.

Windows: jalanin `build.bat`.

### Opsi C: PWABuilder.com (tanpa code build)

1. Host `index.html` + `manifest.json` + `sw.js` + icon ke GitHub Pages/Vercel/Netlify (gratis, HTTPS auto)
2. Buka https://www.pwabuilder.com
3. Masukin URL hosting → Start → pilih Android → Download APK
4. Rename hasilnya ke `bot_Tele_MultiAi.apk`

---

## Setup OpenClaw setelah APK ke-install

### Mode Embedded (recommended)

1. Buka https://aistudio.google.com/apikey (login pake akun Google)
2. **Create API key** → copy
3. Di app: **Tools → OpenClaw Agent**
4. Mode = **📦 Embedded**
5. Paste API key → pilih model (Gemini 2.0 Flash default, balance speed/quality)
6. **Verify API Key** → status `LIVE` hijau
7. Buka tab **OpenClaw** → chat 🐾

### Mode External (kalau punya OpenClaw server)

1. Mode = **🌐 External**
2. Agent URL: **jangan** pakai `localhost` (di Android itu artinya HP). Pakai IP LAN laptop (mis. `http://192.168.1.100:8080`) atau IP publik VPS
3. Model name: sesuai yang di-expose OpenClaw
4. Format: biarin `Auto` (coba berurutan OpenAI → Ollama → Anthropic → Simple)
5. **Test Connection** → kalau hijau, langsung chat

Kalau `OFFLINE` terus padahal server jalan, biasanya CORS di sisi server. Tambah:
```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

---

## Isi paket lengkap

| File | Buat apa |
|---|---|
| `index.html` | PWA single-file — React + UI + logika OpenClaw + Terminal |
| `manifest.json` | PWA manifest (icon, fullscreen, theme) |
| `sw.js` | Service worker (offline cache) |
| `icon-192.png`, `icon-512.png` | Icon launcher |
| `package.json` | Dependencies Capacitor |
| `capacitor.config.json` | Config (cleartext + cors permit) |
| `build.sh` / `build.bat` | Build APK lokal (Linux/macOS / Windows) |
| `.github/workflows/build.yml` | **Auto-build APK di GitHub Actions** ⭐ |
| `QUICKSTART_GITHUB.md` | Step-by-step pakai GitHub Actions |
| `CLOUDX_BOT.jsx` | Preview di Claude artifact (opsional) |

---

## Fitur app

**Tab Chat** — kontrol bot Telegram + chat 17 AI provider.

**Tab VPS** — panel hosting:
- Hero card: `cloudx-batam-01`, IP, lokasi, plan, uptime
- Quick actions: Console, Reboot, Snapshot, Power
- Live metrics: CPU (animated), RAM, Disk, Bandwidth
- Services toggle: Bot:8443, OpenClaw:8080, AI Gateway:3000, SSH:22, Proxy:80
- Mini terminal → tap Fullscreen masuk terminal penuh

**Tab OpenClaw** — chat agent (mode embedded Gemini atau external server), context history, status real-time, tools chip.

**Tab Files** — list files + AI token credit.

**Tab Tools** — backend config, OpenClaw config (mode switcher), provider switcher, commands.

**Terminal fullscreen** — dark theme, commands: help, status, services, ps, uptime, whoami, ipconfig, clear.

**Tampilan iOS** — backdrop blur, 0.5px hairlines, font apple-system, dark mode auto.

**Mac slide transition** antar tab — spring easing `cubic-bezier(0.32, 0.72, 0, 1)`.

---

## App identity

- **App ID**: `id.proxinet.bottelemultiai`
- **Display name**: Bot Tele MultiAI
- **Owner**: IKy / PROXINET Batam
- **Telegram owner ID**: 6463680253 (di-preserve dari versi original)

---

## Catatan jujur

- **Saya (Claude) nggak bisa langsung kasih file `.apk` jadi** — sandbox saya cuma container Linux tanpa Android SDK (~3 GB tools). Itu kenapa saya siapkan workflow GitHub Actions yang build di cloud, supaya IKy nggak perlu install Android Studio.
- **"OpenClaw embedded" = call Gemini API langsung dari dalam APK.** Beneran self-contained — sekali install, agent jadi part of app, tinggal kasih API key dan jalan. Nggak ada model 7B di-stuff ke APK (itu butuh GPU + bikin APK 5GB+); pendekatan ini lebih realistic dan punya quality jauh lebih bagus (Gemini 2.0 Flash > local 7B).
- **Free tier Gemini**: 1500 request/hari, 1 juta token context — lebih dari cukup buat personal use.

---

## Lisensi
MIT — buat IKy / PROXINET Batam.
