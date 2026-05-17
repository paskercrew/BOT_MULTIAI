# 🚀 Cara Tercepat Dapat APK — GitHub Actions

**Tanpa install Android Studio.** Bangun APK di cloud GitHub, gratis, dalam ~5 menit.

---

## Langkah 1: Buat GitHub repo

1. Buka https://github.com/new
2. Repository name: `bot-tele-multiai` (atau apa aja)
3. Set **Private** (rekomendasi, karena ada API key nanti)
4. **Create repository**

## Langkah 2: Upload semua file

Cara A — via web (paling gampang):
1. Di halaman repo, klik **uploading an existing file**
2. Drag-drop semua file dari folder `bot_tele_multiai/`:
   - `index.html`, `manifest.json`, `sw.js`
   - `icon-192.png`, `icon-512.png`
   - `package.json`, `capacitor.config.json`
   - `build.sh`, `build.bat`
   - `.github/` folder (ini penting! kalau drag-drop folder, atau buat lewat **Add file → Create new file** dengan nama `.github/workflows/build.yml` dan paste isinya)
3. **Commit changes**

Cara B — via git CLI:
```bash
cd bot_tele_multiai
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/bot-tele-multiai.git
git push -u origin main
```

## Langkah 3: Tunggu build selesai

1. Buka tab **Actions** di repo
2. Workflow **Build APK** otomatis jalan (karena push ke `main`)
3. Tunggu sampai centang hijau ✓ (~3-5 menit)
4. Klik run yang sukses → scroll ke bawah → **Artifacts**
5. Download **`bot_Tele_MultiAi-N`** (zip yang isinya APK)
6. Extract → dapet **`bot_Tele_MultiAi.apk`** 🎉

## Langkah 4: Install ke HP

1. Transfer APK ke HP Android (kirim via Telegram, WhatsApp, USB, dll)
2. Buka file APK di HP
3. Allow "Install unknown apps" buat browser/file manager-nya
4. Tap **Install**

## Langkah 5: Setup OpenClaw embedded

1. Buka app **Bot Tele MultiAI** di HP
2. **Tools** (tab paling kanan) → scroll ke **OpenClaw Agent**
3. Pilih mode **📦 Embedded** (default)
4. Dapatkan Gemini API key gratis: https://aistudio.google.com/apikey
5. Paste API key → **Verify API Key**
6. Status `LIVE` → buka tab **OpenClaw** → mulai chat 🐾

---

## Manual trigger (build kapan aja)

1. Buka tab **Actions** di repo
2. Pilih workflow **Build APK** di sidebar kiri
3. Klik **Run workflow** kanan atas
4. Pilih `debug` atau `release` → **Run workflow**

## Release build dengan keystore sendiri (opsional)

Default build pake auto-keystore (cocok buat testing). Kalau mau release dengan keystore sendiri:

1. Bikin keystore: `keytool -genkey -v -keystore my.keystore -alias cloudx -keyalg RSA -keysize 2048 -validity 10000`
2. Encode base64: `base64 my.keystore | tr -d '\n'`
3. Di GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
4. Tambah secrets:
   - `KEYSTORE_B64` — paste base64 keystore
   - `KEYSTORE_PASSWORD` — password keystore
   - `KEY_PASSWORD` — password alias

---

## Troubleshooting

**Actions tab nggak muncul** → Cek **Settings → Actions → General → Allow all actions and reusable workflows**

**Workflow gagal di "Add Android platform"** → Pastiin `.github/workflows/build.yml` ke-upload dengan benar di path itu

**APK gagal install di HP** → Allow install dari sumber tidak dikenal di Settings → Security → Install Unknown Apps
