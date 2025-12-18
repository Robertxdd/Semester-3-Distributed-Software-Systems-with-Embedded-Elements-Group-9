import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import serial  # pip install pyserial

PICO_PORT = os.getenv("PICO_PORT", "COM3")
PICO_BAUD = int(os.getenv("PICO_BAUD", "115200"))
HOST = os.getenv("BRIDGE_HOST", "127.0.0.1")
PORT = int(os.getenv("BRIDGE_PORT", "5055"))
AUTO_OFF_SECONDS = float(os.getenv("AUTO_OFF_SECONDS", "1.5"))

_lock = threading.Lock()
_timer = None
_ser = None


def _ensure_serial():
    global _ser
    if _ser is None or not getattr(_ser, "is_open", False):
        _ser = serial.Serial(PICO_PORT, PICO_BAUD, timeout=1)


def _write_line(line: str):
    with _lock:
        _ensure_serial()
        _ser.write((line.strip() + "\n").encode("utf-8"))
        _ser.flush()


def led_off():
    global _timer
    _write_line("LED_OFF")
    with _lock:
        _timer = None


def led_on(direction=None):
    global _timer
    cmd = "LED_ON"
    if direction:
        d = str(direction).lower()
        if d in ("up", "u"):
            cmd = "UP"
        elif d in ("down", "d"):
            cmd = "DOWN"

    _write_line(cmd)

    with _lock:
        if _timer:
            _timer.cancel()
        _timer = threading.Timer(AUTO_OFF_SECONDS, led_off)
        _timer.daemon = True
        _timer.start()


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/health"):
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        self.send_response(404)
        self._cors()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(body.decode("utf-8"))
        except Exception:
            data = {}

        try:
            if self.path.startswith("/led/on"):
                led_on(direction=data.get("direction"))
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "led": "on"}).encode("utf-8"))
                return

            if self.path.startswith("/led/off"):
                led_off()
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "led": "off"}).encode("utf-8"))
                return

            self.send_response(404)
            self._cors()
            self.end_headers()
        except Exception as e:
            self.send_response(500)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))


def main():
    print(f"HTTP bridge listening on http://{HOST}:{PORT}")
    print(f"Using serial: {PICO_PORT} @ {PICO_BAUD}")
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()

