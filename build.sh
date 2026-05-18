#!/usr/bin/env bash
# ============================================================================
#  Bot Tele MultiAI — One-command APK builder
#  Hasil akhir: bot_Tele_MultiAi.apk (di folder yang sama dengan script ini)
# ============================================================================
#
#  Prasyarat di laptop/PC IKy:
#    - Node.js 18+   (cek: node -v)
#    - JDK 17        (cek: java -version)
#    - Android SDK   (Android Studio sekalian, atau cmdline-tools)
#    - ANDROID_HOME atau ANDROID_SDK_ROOT env var ke-set
#
#  Cara pakai:
#    chmod +x build.sh
#    ./build.sh                # build debug APK
#    ./build.sh release        # build release (signed) APK — butuh keystore
#
# ============================================================================

set -e

MODE="${1:-debug}"
APK_NAME="bot_Tele_MultiAi.apk"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Bot Tele MultiAI — APK Builder                           ║"
echo "║   Mode: $MODE                                              ║"
echo "║   Output: $APK_NAME                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ───── 1. Sanity checks ────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo "❌ Node.js tidak ditemukan. Install dulu: https://nodejs.org"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "❌ Java/JDK tidak ditemukan. Install JDK 17."; exit 1; }
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "⚠️  ANDROID_HOME tidak di-set. Coba:"
  echo "    export ANDROID_HOME=\$HOME/Android/Sdk      # Linux"
  echo "    export ANDROID_HOME=\$HOME/Library/Android/sdk  # macOS"
  echo "    set ANDROID_HOME=%LOCALAPPDATA%\\Android\\Sdk    # Windows"
  echo ""
  read -p "Tetap lanjut? (y/N) " a; [ "$a" = "y" ] || exit 1
fi

cd "$APP_DIR"

# ───── 2. Prep www folder ──────────────────────────────────────────────────
echo "📦 [1/6] Menyiapkan folder www..."
rm -rf www
mkdir -p www
cp index.html manifest.json sw.js icon-192.png icon-512.png react.min.js react-dom.min.js babel.min.js www/
echo "   ✓ www/ siap"

# ───── 3. Install deps ─────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 [2/6] Install dependencies (npm install)..."
  npm install
else
  echo "📦 [2/6] node_modules sudah ada, skip."
fi

# ───── 4. Add android platform (kalau belum ada) ──────────────────────────
if [ ! -d "android" ]; then
  echo "🤖 [3/6] Menambah platform Android..."
  npx cap add android
else
  echo "🤖 [3/6] Platform Android sudah ada, skip."
fi

# ───── 5. Sync ────────────────────────────────────────────────────────────
echo "🔄 [4/6] Sync web → Android..."
npx cap sync android

# ───── 5b. Patch AndroidManifest.xml supaya bisa akses http://localhost & IP LAN ────
MANIFEST="android/app/src/main/AndroidManifest.xml"
NETSEC="android/app/src/main/res/xml/network_security_config.xml"

if [ -f "$MANIFEST" ]; then
  mkdir -p "android/app/src/main/res/xml"
  cat > "$NETSEC" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">192.168.0.0/16</domain>
        <domain includeSubdomains="true">10.0.0.0/8</domain>
    </domain-config>
</network-security-config>
XML
  # Inject networkSecurityConfig ke <application> kalau belum ada
  if ! grep -q "networkSecurityConfig" "$MANIFEST"; then
    sed -i.bak 's|<application |<application android:networkSecurityConfig="@xml/network_security_config" |' "$MANIFEST"
    rm -f "$MANIFEST.bak"
  fi
  echo "   ✓ AndroidManifest patched (cleartext + localhost allowed)"
fi

# ───── 6. Build APK ───────────────────────────────────────────────────────
echo "🔨 [5/6] Build APK (Gradle)..."
cd android

if [ "$MODE" = "release" ]; then
  # Release build — butuh keystore
  if [ ! -f "$APP_DIR/cloudx-release.keystore" ]; then
    echo ""
    echo "🔑 Keystore belum ada. Bikin sekarang? (y/N)"
    read -p "> " mk
    if [ "$mk" = "y" ]; then
      keytool -genkey -v -keystore "$APP_DIR/cloudx-release.keystore" \
              -keyalg RSA -keysize 2048 -validity 10000 -alias cloudx
    else
      echo "❌ Batal. Letakkan keystore di $APP_DIR/cloudx-release.keystore"
      exit 1
    fi
  fi
  # Inject signing config
  cat >> app/build.gradle <<EOF

android {
    signingConfigs {
        release {
            storeFile file("../../cloudx-release.keystore")
            storePassword System.getenv("CLOUDX_KEYSTORE_PASS") ?: "android"
            keyAlias "cloudx"
            keyPassword System.getenv("CLOUDX_KEY_PASS") ?: "android"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
EOF
  ./gradlew assembleRelease
  APK_SRC="app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
fi

# ───── 7. Rename & copy out ───────────────────────────────────────────────
cd "$APP_DIR"
if [ -f "android/$APK_SRC" ]; then
  cp "android/$APK_SRC" "$APK_NAME"
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║                                                            ║"
  echo "║   ✅ BUILD SUCCESS                                         ║"
  echo "║                                                            ║"
  echo "║   File: $APK_NAME                                          ║"
  echo "║   Size: $(du -h $APK_NAME | cut -f1)"
  echo "║                                                            ║"
  echo "║   Install ke Android:                                      ║"
  echo "║     adb install $APK_NAME                                  ║"
  echo "║                                                            ║"
  echo "║   Atau transfer ke HP, izinkan install dari sumber tidak  ║"
  echo "║   dikenal, lalu tap APK-nya.                              ║"
  echo "║                                                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
else
  echo "❌ APK tidak ditemukan di android/$APK_SRC"
  echo "   Coba buka project di Android Studio: npx cap open android"
  exit 1
fi
