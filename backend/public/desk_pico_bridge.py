"""
Bridge between the desk API/database and the Raspberry Pi Pico over USB serial.

Detects movement by watching the DESK HEIGHT:
  - Height increases -> send "UP" to the Pico.
  - Height decreases -> send "DOWN".
  - Height steady (within a tolerance) -> send "STOP".
If the backend provides a state field (MOVING/UP/DOWN/STOPPED) that will be
used as a fallback, but height deltas are the primary trigger so the LED
reacts even when the `state` column is not updated.

Configuration (env vars, all optional):
  PICO_PORT        -> serial port (default: COM4)
  PICO_BAUD        -> baudrate (default: 115200)
  DESK_ID          -> desk id in DB/API (default: 1)
  DESK_API_URL     -> full URL to GET the desk JSON (default: http://127.0.0.1:8000/api/desks/{DESK_ID})
  DESK_API_TOKEN   -> bearer token for the API (if your Laravel routes need auth)
  DESK_DB_PATH     -> path to sqlite DB to fall back on (default: ../database/database.sqlite)
  HEIGHT_EPSILON   -> cm tolerance to consider the desk "still" (default: 0.1)
"""
import os
import sqlite3
import time
from pathlib import Path

import requests
import serial

# --- Configuration ---------------------------------------------------------
DESK_ID = int(os.getenv("DESK_ID", "1"))
PORT = os.getenv("PICO_PORT", "COM4")
BAUDRATE = int(os.getenv("PICO_BAUD", "115200"))
API_URL = os.getenv("DESK_API_URL", f"http://127.0.0.1:8000/api/desks/{DESK_ID}")
API_TOKEN = os.getenv("DESK_API_TOKEN")
HEIGHT_EPSILON = float(os.getenv("HEIGHT_EPSILON", "0.1"))  # cm

# Resolve a DB path relative to this file by default.
DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "database" / "database.sqlite"
DB_PATH = Path(os.getenv("DESK_DB_PATH", DEFAULT_DB_PATH))

UP_VALUES = {"UP", "MOVING_UP", "MOVING"}
DOWN_VALUES = {"DOWN", "MOVING_DOWN"}
STOP_VALUES = {"STOP", "STOPPED", "IDLE"}


def read_from_api():
    """Return (height_cm, state_str) from the Laravel API, or (None, None) on failure."""
    headers = {"Accept": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    try:
        resp = requests.get(API_URL, headers=headers, timeout=2)
        resp.raise_for_status()
        data = resp.json()
        height = data.get("height")
        state = str(data.get("state", "") or "").upper()
        return height, state
    except Exception as exc:  # noqa: BLE001
        print("API read failed:", exc)
        return None, None


def read_from_db():
    """Return (height_cm, state_str) from the sqlite DB, or (None, None) if not available."""
    if not DB_PATH.exists():
        return None, None
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        row = cur.execute("SELECT height, state FROM desks WHERE id = ?", (DESK_ID,)).fetchone()
        conn.close()
        if row:
            height, state = row
            return height, (state or "").upper()
    except Exception as exc:  # noqa: BLE001
        print("DB read failed:", exc)
    return None, None


def get_desk_measurement():
    """Try API first, then DB. Returns (height_cm, state_str)."""
    height, state = read_from_api()
    if height is None and state is None:
        height, state = read_from_db()
    return height, state


def decide_command(current_height, last_height, state):
    """
    Decide which serial command to send based on height delta or state string.
    Returns "UP", "DOWN", "STOP", or None.
    """
    if current_height is not None and last_height is not None:
        delta = current_height - last_height
        if abs(delta) >= HEIGHT_EPSILON:
            return "UP" if delta > 0 else "DOWN"
        return "STOP"

    # Fall back to state string if we couldn't compare heights.
    if state in UP_VALUES:
        return "UP"
    if state in DOWN_VALUES:
        return "DOWN"
    if state in STOP_VALUES:
        return "STOP"
    return None


def main():
    ser = serial.Serial(PORT, BAUDRATE, timeout=1)
    print(f"Conectado al Pico en {PORT}.")
    print(f"Monitoreando altura de escritorio {DESK_ID} -> enviando UP/DOWN/STOP segun movimiento.")

    last_height = None
    last_sent = None

    try:
        while True:
            height, state = get_desk_measurement()
            cmd = decide_command(height, last_height, (state or "").upper())
            if height is not None:
                print(f"Altura actual: {height} cm | Estado: {state or 'N/A'} | Cmd: {cmd}")
            else:
                print(f"Altura desconocida | Estado: {state or 'N/A'} | Cmd: {cmd}")

            if cmd and cmd != last_sent:
                ser.write(f"{cmd}\n".encode())
                ser.flush()
                last_sent = cmd
                print(f"Enviado al Pico: {cmd}")

            if height is not None:
                last_height = height

            time.sleep(0.5)
    finally:
        ser.close()
        print("Cerrando conexión serie con el Pico.")


if __name__ == "__main__":
    main()
