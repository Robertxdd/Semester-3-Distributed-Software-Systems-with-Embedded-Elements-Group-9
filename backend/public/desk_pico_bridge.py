"""
Bridge the desk API to the Pico/PicoBricks LED.

It polls a desk from the Laravel API and, when it detects movement, sends
"LED_ON" over serial to the Pico. When the desk is stopped, it sends "LED_OFF".

Env vars:
  DESK_ID        -> desk id to watch (default: 1)
  DESK_API_URL   -> override the desk endpoint (default: http://127.0.0.1:8000/api/desks/{DESK_ID})
  DESK_API_TOKEN -> optional bearer token
  PICO_PORT      -> serial port (default: COM4)
  PICO_BAUD      -> baudrate (default: 115200)
  HEIGHT_EPSILON -> cm delta to consider movement (default: 0.1)
  POLL_INTERVAL  -> seconds between polls (default: 0.7)
"""
import os
import time

import requests
import serial

DESK_ID = int(os.getenv("DESK_ID", "1"))
API_URL = os.getenv("DESK_API_URL", f"http://127.0.0.1:8000/api/desks/{DESK_ID}")
API_TOKEN = os.getenv("DESK_API_TOKEN")
PORT = os.getenv("PICO_PORT", "COM4")
BAUDRATE = int(os.getenv("PICO_BAUD", "115200"))
HEIGHT_EPSILON = float(os.getenv("HEIGHT_EPSILON", "0.1"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "0.7"))

MOVING_STATES = {"MOVING", "UP", "DOWN", "MOVING_UP", "MOVING_DOWN"}


def read_desk():
    headers = {"Accept": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    resp = requests.get(API_URL, headers=headers, timeout=3)
    resp.raise_for_status()
    data = resp.json()
    height = data.get("height")
    state = str(data.get("state", "") or "").upper()
    return height, state


def is_moving(height, last_height, state):
    if state in MOVING_STATES:
        return True
    if height is None or last_height is None:
        return False
    return abs(height - last_height) >= HEIGHT_EPSILON


def send_command(ser, cmd, last_sent):
    if cmd == last_sent:
        return last_sent
    ser.write(f"{cmd}\n".encode())
    ser.flush()
    print(f"Sent to Pico: {cmd}")
    return cmd


def main():
    ser = serial.Serial(PORT, BAUDRATE, timeout=1)
    print(f"Connected to Pico on {PORT} @ {BAUDRATE} baud.")
    print(f"Watching desk {DESK_ID} at {API_URL}")

    last_height = None
    last_sent = None

    try:
        while True:
            try:
                height, state = read_desk()
            except Exception as exc:  # noqa: BLE001
                print(f"Desk read failed: {exc}")
                time.sleep(POLL_INTERVAL)
                continue

            moving = is_moving(height, last_height, state)
            desired_cmd = "LED_ON" if moving else "LED_OFF"
            last_sent = send_command(ser, desired_cmd, last_sent)

            if height is not None:
                last_height = height

            time.sleep(POLL_INTERVAL)
    finally:
        ser.close()
        print("Serial connection closed.")


if __name__ == "__main__":
    main()
