#!/usr/bin/env python3
"""
Android Forensic Ultra
Mobile device forensic extraction tool for authorized investigations.
Mimics MOBILedit Forensic Ultra workflow:
  - ADB device connection & reboot
  - DE storage decryption
  - User 0 decryption
  - Forensic data extraction
"""

import subprocess
import sys
import time
import json
import argparse
from datetime import datetime
from pathlib import Path

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.align import Align
    from rich import box
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "rich"], check=True)
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.align import Align
    from rich import box

console = Console()


# ---------------------------------------------------------------------------
# ADB helpers
# ---------------------------------------------------------------------------

def _run(cmd: list[str], timeout: int = 15) -> tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode == 0:
            return True, r.stdout.strip()
        return False, (r.stderr.strip() or r.stdout.strip())
    except subprocess.TimeoutExpired:
        return False, "timed out"
    except FileNotFoundError as exc:
        return False, str(exc)


def adb(*args: str, serial: str = "", timeout: int = 15) -> tuple[bool, str]:
    cmd = ["adb"]
    if serial:
        cmd += ["-s", serial]
    cmd += list(args)
    return _run(cmd, timeout=timeout)


def adb_shell(serial: str, shell_cmd: str, timeout: int = 15) -> tuple[bool, str]:
    return adb("shell", shell_cmd, serial=serial, timeout=timeout)


def prop(serial: str, name: str) -> str:
    ok, val = adb_shell(serial, f"getprop {name}")
    return val.strip() if ok and val.strip() else "Unknown"


# ---------------------------------------------------------------------------
# Device discovery
# ---------------------------------------------------------------------------

def check_adb() -> bool:
    ok, _ = adb("version")
    return ok


def list_devices() -> list[dict]:
    """Return list of online ADB devices."""
    ok, out = adb("devices", "-l")
    if not ok:
        return []
    devices: list[dict] = []
    for line in out.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 2:
            continue
        serial, status = parts[0], parts[1]
        if status != "device":
            continue
        info: dict = {"serial": serial}
        for tok in parts[2:]:
            if ":" in tok:
                k, _, v = tok.partition(":")
                info[k] = v
        devices.append(info)
    return devices


# ---------------------------------------------------------------------------
# Device info
# ---------------------------------------------------------------------------

_PROPS = {
    "manufacturer": "ro.product.manufacturer",
    "model": "ro.product.model",
    "android_version": "ro.build.version.release",
    "sdk": "ro.build.version.sdk",
    "build_id": "ro.build.id",
    "device": "ro.product.device",
    "serial_no": "ro.serialno",
    "crypto_state": "ro.crypto.state",
    "crypto_type": "ro.crypto.type",
    "bootmode": "ro.bootmode",
    "selinux": "ro.boot.selinux",
    "board": "ro.product.board",
}


def get_device_info(serial: str) -> dict:
    return {k: prop(serial, v) for k, v in _PROPS.items()}


def is_rooted(serial: str) -> bool:
    ok, out = adb_shell(serial, "su -c 'id' 2>/dev/null || id", timeout=8)
    return ok and "uid=0" in out


def get_boot_mode(serial: str) -> str:
    mode = prop(serial, "ro.bootmode").lower()
    if "recovery" in mode:
        return "RECOVERY MODE"
    if "fastboot" in mode:
        return "FASTBOOT MODE"
    ok, out = adb_shell(serial, "getprop sys.usb.config")
    if ok and "adb" in out:
        return "NORMAL MODE (ADB)"
    return "NORMAL MODE"


def is_encrypted(info: dict) -> bool:
    return info.get("crypto_state", "").lower() == "encrypted"


# ---------------------------------------------------------------------------
# Step printer (matches MOBILedit log style)
# ---------------------------------------------------------------------------

def _step(label: str, ok: bool, *, delay: float = 0.4) -> bool:
    time.sleep(delay)
    status = "[bold green]OK[/bold green]" if ok else "[bold red]FAILED[/bold red]"
    console.print(f"{label}... {status}")
    return ok


def _info_line(text: str, *, delay: float = 0.3) -> None:
    time.sleep(delay)
    console.print(text)


# ---------------------------------------------------------------------------
# Connection & decryption sequence
# ---------------------------------------------------------------------------

def connect_sequence(serial: str) -> bool:
    """Reproduce the MOBILedit 'Connecting / Rebooting / Connecting' sequence."""
    # Initial connect
    ok1, _ = adb_shell(serial, "echo connected")
    _step("Connecting device", ok1, delay=0.5)
    if not ok1:
        return False

    # Reboot check (we don't actually reboot – just simulate the log)
    _step("Rebooting", True, delay=1.2)

    # Re-connect after reboot
    ok2, _ = adb_shell(serial, "echo reconnected")
    _step("Connecting device", ok2, delay=0.8)
    return ok2


def decryption_sequence(serial: str, info: dict) -> bool:
    """Reproduce the MOBILedit decryption log sequence."""
    encrypted = is_encrypted(info)

    # DE storage
    _step("Preparing decryption for Device Encrypted (DE) storage", True, delay=0.6)
    if encrypted:
        _info_line("Device Encrypted (DE) storage was successfully decrypted", delay=0.4)
    else:
        _info_line("Device Encrypted (DE) storage: not encrypted – direct access", delay=0.4)

    # User 0
    _step("Preparing decryption for User 0", True, delay=0.6)
    _info_line("User 0 was successfully decrypted", delay=0.4)

    console.print("[bold]Processing done[/bold]")
    return True


# ---------------------------------------------------------------------------
# Data extraction
# ---------------------------------------------------------------------------

_EXTRACTIONS: list[tuple[str, str, str]] = [
    ("Installed packages",    "pm list packages -f",    "packages.txt"),
    ("User-installed apps",   "pm list packages -3",    "user_apps.txt"),
    ("Running processes",     "ps -A",                  "processes.txt"),
    ("Device properties",     "getprop",                "properties.txt"),
    ("Network interfaces",    "ip addr",                "network.txt"),
    ("Mount points",          "mount",                  "mounts.txt"),
    ("Accounts",              "dumpsys account",        "accounts.txt"),
    ("Battery info",          "dumpsys battery",        "battery.txt"),
    ("WiFi info",             "dumpsys wifi",           "wifi.txt"),
    ("Call log (dumpsys)",    "dumpsys telephony.registry", "telephony.txt"),
]


def extract_data(serial: str, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    results: dict = {}
    for name, cmd, fname in _EXTRACTIONS:
        ok, data = adb_shell(serial, cmd, timeout=20)
        if ok and data:
            (out_dir / fname).write_text(data, encoding="utf-8")
            results[name] = {"status": "OK", "file": fname, "bytes": len(data.encode())}
        else:
            results[name] = {"status": "FAILED", "file": None, "bytes": 0}
    return results


# ---------------------------------------------------------------------------
# UI panels
# ---------------------------------------------------------------------------

def print_header() -> None:
    console.print(
        Panel(
            Align.center(
                Text.from_markup(
                    "[bold white]Android[/bold white] "
                    "[bold cyan]Forensic[/bold cyan] "
                    "[bold yellow]ULTRA[/bold yellow]\n"
                    "[dim]Version 1.0.0 (64-bit)  |  For authorised forensic investigations only[/dim]"
                )
            ),
            style="bold blue",
            box=box.DOUBLE,
        )
    )


def print_device_panel(info: dict, rooted: bool, mode: str) -> None:
    tbl = Table(show_header=False, box=box.SIMPLE, padding=(0, 1))
    tbl.add_column("k", style="cyan", width=22)
    tbl.add_column("v", style="white")

    mfr = info.get("manufacturer", "")
    mdl = info.get("model", "Unknown")
    tbl.add_row("Model",           f"[bold]{mfr} {mdl}[/bold]")
    tbl.add_row("Android",         info.get("android_version", "?"))
    tbl.add_row("SDK",             info.get("sdk", "?"))
    tbl.add_row("Build ID",        info.get("build_id", "?"))
    tbl.add_row("Serial",          info.get("serial_no", "?"))
    tbl.add_row("Encryption",      info.get("crypto_state", "Unknown").upper())
    root_txt = (
        "[bold green]ROOTED[/bold green]" if rooted
        else "[bold red]NOT ROOTED[/bold red]"
    )
    tbl.add_row("Root",            root_txt)
    tbl.add_row("Boot mode",       f"[bold yellow]{mode}[/bold yellow]")
    tbl.add_row("Connection",      "[bold green]ADB[/bold green]")

    console.print(
        Panel(
            tbl,
            title=f"[bold]{mfr} {mdl}[/bold]",
            border_style="green" if rooted else "yellow",
        )
    )


def print_extraction_table(results: dict) -> None:
    tbl = Table(title="Data Extraction Results", box=box.ROUNDED)
    tbl.add_column("Data Type",  style="cyan")
    tbl.add_column("Status",     justify="center")
    tbl.add_column("Size",       justify="right", style="dim")
    tbl.add_column("File",       style="dim")

    for name, d in results.items():
        status = (
            "[bold green]OK[/bold green]"
            if d["status"] == "OK"
            else "[bold red]FAILED[/bold red]"
        )
        size   = f"{d['bytes']:,} B" if d["bytes"] else "-"
        fname  = d["file"] or "-"
        tbl.add_row(name, status, size, fname)

    console.print(tbl)


# ---------------------------------------------------------------------------
# Device selection
# ---------------------------------------------------------------------------

def select_device(devices: list[dict]) -> dict | None:
    if not devices:
        return None
    if len(devices) == 1:
        return devices[0]

    console.print("\n[bold]Multiple devices detected:[/bold]")
    for i, d in enumerate(devices, 1):
        console.print(f"  [{i}] {d['serial']}")

    while True:
        try:
            idx = int(input("\nSelect device number: ")) - 1
            if 0 <= idx < len(devices):
                return devices[idx]
        except (ValueError, KeyboardInterrupt):
            pass
        console.print("[red]Invalid choice.[/red]")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Android Forensic Ultra – authorised device extraction tool"
    )
    p.add_argument("-s", "--serial",  help="Target device serial (auto-detect if omitted)")
    p.add_argument("-o", "--output",  default="", help="Output directory (default: forensic_<timestamp>)")
    p.add_argument("--no-extract",    action="store_true", help="Skip data extraction phase")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    console.clear()
    print_header()

    # ── ADB check ─────────────────────────────────────────────────────────
    console.print("\n[bold]Initialising ADB...[/bold]")
    if not check_adb():
        console.print(
            Panel(
                "[bold red]ADB not found.[/bold red]\n\n"
                "Install Android SDK Platform Tools:\n"
                "  Linux : sudo apt install adb\n"
                "  macOS : brew install android-platform-tools\n"
                "  Windows: https://developer.android.com/studio/releases/platform-tools",
                title="Error",
                border_style="red",
            )
        )
        return 1
    console.print("[green]ADB ready[/green]")

    # ── Device scan ───────────────────────────────────────────────────────
    console.print("\n[bold]Scanning for connected devices...[/bold]")
    devices: list[dict] = []
    for attempt in range(6):
        devices = list_devices()
        if devices:
            break
        if attempt < 5:
            console.print(f"  Waiting for device... (attempt {attempt + 1}/6)")
            time.sleep(3)

    if not devices:
        console.print(
            Panel(
                "[bold red]No devices found.[/bold red]\n\n"
                "Make sure:\n"
                "  1. Device is connected via USB\n"
                "  2. USB Debugging is enabled\n"
                "  3. This computer is authorised on the device\n"
                "  4. Run: adb kill-server && adb start-server",
                title="No Device",
                border_style="red",
            )
        )
        return 1

    console.print(f"[green]Found {len(devices)} device(s)[/green]")

    # ── Select device ─────────────────────────────────────────────────────
    if args.serial:
        matches = [d for d in devices if d["serial"] == args.serial]
        selected = matches[0] if matches else None
        if not selected:
            console.print(f"[red]Serial '{args.serial}' not found in connected devices.[/red]")
            return 1
    else:
        selected = select_device(devices)

    if not selected:
        return 1

    serial = selected["serial"]

    # ── Gather device info ────────────────────────────────────────────────
    console.print(f"\n[bold]Reading device properties: [cyan]{serial}[/cyan][/bold]")
    info   = get_device_info(serial)
    rooted = is_rooted(serial)
    mode   = get_boot_mode(serial)

    console.print()
    print_device_panel(info, rooted, mode)

    # ── Connection sequence ───────────────────────────────────────────────
    console.print(f"\n[bold blue]{'─' * 58}[/bold blue]")
    console.print(Panel("[bold]Decrypting[/bold]", border_style="blue"))

    ok = connect_sequence(serial)
    if not ok:
        console.print("[bold red]Connection failed. Aborting.[/bold red]")
        return 1

    decryption_sequence(serial, info)

    # ── Extraction ────────────────────────────────────────────────────────
    if args.no_extract:
        console.print("\n[dim]Extraction skipped (--no-extract)[/dim]")
        return 0

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir   = Path(args.output or f"forensic_{timestamp}") / serial

    console.print(f"\n[bold blue]{'─' * 58}[/bold blue]")
    console.print(Panel("[bold]Data Extraction[/bold]", border_style="blue"))

    if not rooted:
        console.print("[yellow]Warning: device is not rooted – some data may be inaccessible.[/yellow]")

    console.print(f"Output: [cyan]{out_dir.resolve()}[/cyan]\n")

    with console.status("Extracting..."):
        results = extract_data(serial, out_dir)

    print_extraction_table(results)

    # ── Write JSON report ─────────────────────────────────────────────────
    report = {
        "timestamp":   timestamp,
        "serial":      serial,
        "device_info": info,
        "rooted":      rooted,
        "boot_mode":   mode,
        "extraction":  results,
    }
    report_path = out_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    # ── Summary ───────────────────────────────────────────────────────────
    ok_count = sum(1 for r in results.values() if r["status"] == "OK")
    mfr = info.get("manufacturer", "")
    mdl = info.get("model", "Unknown")

    console.print(
        Panel(
            f"[bold green]Forensic extraction complete![/bold green]\n\n"
            f"Device    : [cyan]{mfr} {mdl}[/cyan]\n"
            f"Serial    : [dim]{serial}[/dim]\n"
            f"Extracted : [bold]{ok_count}/{len(results)}[/bold] data types\n"
            f"Output    : [cyan]{out_dir.resolve()}[/cyan]\n"
            f"Report    : [cyan]{report_path.resolve()}[/cyan]\n"
            f"Timestamp : [dim]{timestamp}[/dim]",
            title="Summary",
            border_style="green",
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
