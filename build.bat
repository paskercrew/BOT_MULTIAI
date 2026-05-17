@echo off
REM ============================================================================
REM  Bot Tele MultiAI - One-command APK builder (Windows)
REM  Hasil: bot_Tele_MultiAi.apk
REM ============================================================================
setlocal enabledelayedexpansion

set APK_NAME=bot_Tele_MultiAi.apk
set APP_DIR=%~dp0
cd /d "%APP_DIR%"

echo.
echo ============================================================
echo   Bot Tele MultiAI - APK Builder (Windows)
echo   Output: %APK_NAME%
echo ============================================================
echo.

REM 1. Cek tools
where node >nul 2>nul || (echo [X] Node.js tidak ditemukan & exit /b 1)
where java >nul 2>nul || (echo [X] Java/JDK tidak ditemukan & exit /b 1)

if not defined ANDROID_HOME if not defined ANDROID_SDK_ROOT (
  echo [!] ANDROID_HOME belum di-set
  echo     set ANDROID_HOME=%%LOCALAPPDATA%%\Android\Sdk
  set /p ANS="Lanjut? (y/N) "
  if /i not "!ANS!"=="y" exit /b 1
)

REM 2. Prep www
echo [1/5] Menyiapkan folder www...
if exist www rmdir /s /q www
mkdir www
copy /y index.html www\ >nul
copy /y manifest.json www\ >nul
copy /y sw.js www\ >nul
copy /y icon-192.png www\ >nul
copy /y icon-512.png www\ >nul

REM 3. Install deps
if not exist node_modules (
  echo [2/5] Install dependencies...
  call npm install
) else (
  echo [2/5] node_modules sudah ada
)

REM 4. Add Android platform
if not exist android (
  echo [3/5] Tambah platform Android...
  call npx cap add android
) else (
  echo [3/5] Platform Android sudah ada
)

REM 5. Sync
echo [4/5] Sync web ke Android...
call npx cap sync android

REM 6. Build
echo [5/5] Build APK...
cd android
call gradlew.bat assembleDebug
cd ..

if exist android\app\build\outputs\apk\debug\app-debug.apk (
  copy /y android\app\build\outputs\apk\debug\app-debug.apk %APK_NAME% >nul
  echo.
  echo ============================================================
  echo   BUILD SUCCESS
  echo   File: %APK_NAME%
  echo   Install: adb install %APK_NAME%
  echo ============================================================
) else (
  echo [X] APK gagal dibuild. Coba: npx cap open android
  exit /b 1
)
