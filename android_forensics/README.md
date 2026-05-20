# Android Forensic Ultra

A command-line Android device forensic extraction tool that replicates the MOBILedit Forensic Ultra workflow.

## Features

- Automatic ADB device detection
- Step-by-step connection & decryption log (DE storage + User 0)
- Device info panel (model, Android version, root status, boot mode, encryption)
- Forensic data extraction: packages, processes, network, accounts, Wi-Fi, telephony, battery
- JSON report generation

## Requirements

- Python 3.10+
- Android SDK Platform Tools (`adb` in PATH)
- USB Debugging enabled on target device

## Install

```bash
pip install -r requirements.txt
```

## Usage

```bash
# Auto-detect connected device
python android_forensics.py

# Target a specific device by serial
python android_forensics.py -s DEVICE_SERIAL

# Custom output directory
python android_forensics.py -o /cases/case_001

# Skip extraction (info + decryption log only)
python android_forensics.py --no-extract
```

## Output

All extracted files are saved under `forensic_<timestamp>/<serial>/`:

| File | Contents |
|------|----------|
| `packages.txt` | All installed packages with paths |
| `user_apps.txt` | User-installed apps only |
| `processes.txt` | Running processes (`ps -A`) |
| `properties.txt` | All `getprop` values |
| `network.txt` | Network interface addresses |
| `mounts.txt` | Mounted filesystems |
| `accounts.txt` | Registered accounts (dumpsys) |
| `battery.txt` | Battery state |
| `wifi.txt` | Wi-Fi state & networks |
| `telephony.txt` | Telephony registry dump |
| `report.json` | Full structured JSON report |

> **For authorised forensic investigations only.**
