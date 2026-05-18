#!/usr/bin/env python3
"""
RDP WebSocket Bridge — CLOUDXGCLOUD Bot
Jembatan antara app Android (WebSocket) dan server Windows (RDP via FreeRDP).

Requires:
  pip install websockets Pillow

FreeRDP (xfreerdp) harus terinstall di sistem:
  sudo apt install freerdp2-x11 xvfb  # Debian/Ubuntu

Usage:
  python3 rdp_bridge.py [--port 8888] [--host 0.0.0.0]
"""

import asyncio
import argparse
import json
import logging
import os
import subprocess
import signal
import tempfile
import io
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("rdp-bridge")

try:
    import websockets
except ImportError:
    print("[ERROR] Install dependencies: pip install websockets Pillow")
    exit(1)

try:
    from PIL import ImageGrab, Image
    PIL_OK = True
except ImportError:
    PIL_OK = False


# ── Per-connection RDP session ──────────────────────────────────────────────

class RDPSession:
    def __init__(self, ws):
        self.ws = ws
        self.rdp_proc = None
        self.screen_task = None
        self.display = None
        self.connected = False
        self.resolution = (1280, 720)
        self.host = None
        self.port = 3389
        self.user = None

    async def connect(self, host, port, user, password, domain=""):
        self.host = host
        self.port = port
        self.user = user
        self.resolution = (1280, 720)

        await self._send_status(f"Memulai sesi RDP ke {host}:{port}...")

        # Use xfreerdp in headless mode if available
        xfreerdp = self._find_freerdp()
        if not xfreerdp:
            await self._send_error("xfreerdp tidak ditemukan. Install: sudo apt install freerdp2-x11 xvfb")
            return

        # Create virtual display
        self.display = f":{99 + id(self) % 900}"
        w, h = self.resolution

        # Start Xvfb
        xvfb_cmd = ["Xvfb", self.display, "-screen", "0", f"{w}x{h}x24", "-nolisten", "tcp"]
        try:
            subprocess.Popen(xvfb_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            await asyncio.sleep(0.8)
        except FileNotFoundError:
            await self._send_error("Xvfb tidak ditemukan. Install: sudo apt install xvfb")
            return

        # Build xfreerdp command
        cmd = [
            xfreerdp,
            f"/v:{host}:{port}",
            f"/u:{user}",
            f"/p:{password}",
            f"/w:{w}", f"/h:{h}",
            "/cert:ignore",
            "+clipboard",
            "/rfx",
            "/gdi:hw",
            "-grab-keyboard",
        ]
        if domain:
            cmd += [f"/d:{domain}"]

        env = os.environ.copy()
        env["DISPLAY"] = self.display

        log.info("Menjalankan: %s", " ".join(cmd[:4]) + " ...")
        try:
            self.rdp_proc = subprocess.Popen(
                cmd, env=env,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
        except Exception as e:
            await self._send_error(f"Gagal menjalankan xfreerdp: {e}")
            return

        await asyncio.sleep(2.5)

        if self.rdp_proc.poll() is not None:
            await self._send_error("xfreerdp keluar terlalu cepat. Cek host, port, user, dan password.")
            return

        self.connected = True
        await self._send({"t": "status", "m": f"Terhubung ke {host}", "connected": True})
        await self._send({"t": "res", "w": w, "h": h})

        # Start screen capture loop
        self.screen_task = asyncio.create_task(self._capture_loop())

    async def _capture_loop(self):
        import subprocess
        w, h = self.resolution
        fps_delay = 1 / 12  # ~12 fps

        while self.connected:
            try:
                start = time.monotonic()
                # Capture virtual display using scrot or import
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                    fname = f.name

                result = subprocess.run(
                    ["scrot", fname, "--display", self.display, "--quality", "70"],
                    capture_output=True, timeout=3
                )

                if result.returncode != 0:
                    # Fallback: use import (ImageMagick)
                    result = subprocess.run(
                        ["import", "-window", "root", "-display", self.display, "-quality", "70", fname],
                        capture_output=True, timeout=3
                    )

                if result.returncode == 0 and os.path.exists(fname) and os.path.getsize(fname) > 0:
                    with open(fname, "rb") as f:
                        frame_bytes = f.read()
                    os.unlink(fname)
                    # Send binary frame
                    try:
                        await self.ws.send(frame_bytes)
                    except Exception:
                        break
                else:
                    if os.path.exists(fname):
                        os.unlink(fname)

                elapsed = time.monotonic() - start
                await asyncio.sleep(max(0, fps_delay - elapsed))

            except asyncio.CancelledError:
                break
            except Exception as e:
                log.warning("Capture error: %s", e)
                await asyncio.sleep(0.5)

    def send_mouse(self, x, y, button=0, down=True):
        if not self.connected:
            return
        # Send mouse event via xdotool
        w, h = self.resolution
        x = max(0, min(x, w - 1))
        y = max(0, min(y, h - 1))
        env = {**os.environ, "DISPLAY": self.display}
        try:
            subprocess.Popen(
                ["xdotool", "mousemove", str(x), str(y)],
                env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            if button > 0:
                event = "mousedown" if down else "mouseup"
                subprocess.Popen(
                    ["xdotool", event, "--clearmodifiers", str(button)],
                    env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
        except FileNotFoundError:
            pass  # xdotool not installed

    def send_key(self, keycode, down=True):
        if not self.connected:
            return
        env = {**os.environ, "DISPLAY": self.display}
        try:
            event = "keydown" if down else "keyup"
            subprocess.Popen(
                ["xdotool", event, "--clearmodifiers", f"0x{keycode:04x}"],
                env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
        except FileNotFoundError:
            pass

    def send_scroll(self, x, y, delta):
        if not self.connected:
            return
        env = {**os.environ, "DISPLAY": self.display}
        btn = 4 if delta > 0 else 5  # 4=scroll up, 5=scroll down
        for _ in range(abs(delta)):
            try:
                subprocess.Popen(
                    ["xdotool", "click", "--clearmodifiers", str(btn)],
                    env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
            except FileNotFoundError:
                break

    def disconnect(self):
        self.connected = False
        if self.screen_task:
            self.screen_task.cancel()
        if self.rdp_proc:
            try:
                self.rdp_proc.terminate()
            except Exception:
                pass

    async def _send(self, obj):
        try:
            await self.ws.send(json.dumps(obj))
        except Exception:
            pass

    async def _send_status(self, msg):
        await self._send({"t": "status", "m": msg})

    async def _send_error(self, msg):
        await self._send({"t": "err", "m": msg})

    @staticmethod
    def _find_freerdp():
        for name in ["xfreerdp", "xfreerdp3", "freerdp3"]:
            result = subprocess.run(["which", name], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        return None


# ── WebSocket handler ───────────────────────────────────────────────────────

async def handle_client(ws, path=None):
    log.info("Client terhubung dari %s", ws.remote_address)
    session = RDPSession(ws)

    try:
        await ws.send(json.dumps({"t": "status", "m": "RDP Bridge siap. Kirim auth untuk mulai."}))

        async for raw_msg in ws:
            try:
                msg = json.loads(raw_msg)
            except json.JSONDecodeError:
                continue

            t = msg.get("t", "")

            if t == "auth":
                host = msg.get("host", "")
                port = int(msg.get("port", 3389))
                user = msg.get("user", "")
                passwd = msg.get("pass", "")
                domain = msg.get("domain", "")
                asyncio.create_task(session.connect(host, port, user, passwd, domain))

            elif t == "mm":  # mouse move
                session.send_mouse(msg.get("x", 0), msg.get("y", 0))

            elif t == "mb":  # mouse button
                session.send_mouse(
                    msg.get("x", 0), msg.get("y", 0),
                    button=msg.get("b", 1), down=msg.get("d", 1) == 1
                )

            elif t == "mw":  # mouse wheel
                session.send_scroll(msg.get("x", 0), msg.get("y", 0), msg.get("dy", 0))

            elif t == "key":
                session.send_key(msg.get("c", 0), down=msg.get("d", 1) == 1)

            elif t == "disconnect":
                session.disconnect()
                await ws.send(json.dumps({"t": "close", "m": "Disconnected"}))
                break

    except websockets.exceptions.ConnectionClosed:
        log.info("Client terputus")
    finally:
        session.disconnect()


# ── Main ────────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="RDP WebSocket Bridge for CLOUDXGCLOUD Bot")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8888, help="WebSocket port (default: 8888)")
    parser.add_argument("--ssl-cert", help="Path to SSL certificate (for wss://)")
    parser.add_argument("--ssl-key", help="Path to SSL private key (for wss://)")
    args = parser.parse_args()

    ssl_ctx = None
    if args.ssl_cert and args.ssl_key:
        import ssl
        ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_ctx.load_cert_chain(args.ssl_cert, args.ssl_key)
        scheme = "wss"
    else:
        scheme = "ws"

    log.info("=" * 55)
    log.info("  CLOUDXGCLOUD RDP WebSocket Bridge")
    log.info("  Listening: %s://%s:%d", scheme, args.host, args.port)
    log.info("  Masukkan URL ini di app Android → tab RDP")
    log.info("=" * 55)
    log.info("Dependensi yang dibutuhkan di server:")
    log.info("  apt install freerdp2-x11 xvfb xdotool scrot")
    log.info("=" * 55)

    async with websockets.serve(handle_client, args.host, args.port, ssl=ssl_ctx, max_size=None):
        log.info("Bridge aktif. Tekan Ctrl+C untuk berhenti.")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Bridge berhenti.")
