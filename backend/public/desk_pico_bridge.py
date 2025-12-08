"""
Bridge between the web project and the Raspberry Pi Pico over USB serial.

- Polls the desk state API and sends commands to the Pico:
    state == "UP"   -> send "UP"
    state == "DOWN" -> send "DOWN"
    state == idle   -> send "STOP"
- Runs continuously so the Pico LED mirrors desk motion automatically.
"""
import time
import serial
import requests

PORT = "COM4"
BAUDRATE = 115200
API_URL = "http://127.0.0.1:8000/api/desk/1/state"

UP_VALUES = {"UP"}
DOWN_VALUES = {"DOWN"}
STOP_VALUES = {"IDLE", "STOPPED"}


def get_desk_state():
    """Return the current desk state string from the API, uppercased."""
    try:
        response = requests.get(API_URL, timeout=1)
        data = response.json()
        return str(data.get("state", "")).upper()
    except Exception as exc:  # noqa: BLE001
        print("Error consultando API:", exc)
        return "UNKNOWN"


def main():
    # Open serial to the Pico.
    ser = serial.Serial(PORT, BAUDRATE, timeout=1)
    print(f"Conectado al Pico en {PORT}.")
    print("Escuchando estado del desk y enviando UP/DOWN/STOP.")

    last_sent = None

    try:
        while True:
            state = get_desk_state()
            print("Estado desk:", state)

            if state in UP_VALUES and last_sent != "UP":
                ser.write(b"UP\n")
                last_sent = "UP"
                print("Enviado al Pico: UP")

            elif state in DOWN_VALUES and last_sent != "DOWN":
                ser.write(b"DOWN\n")
                last_sent = "DOWN"
                print("Enviado al Pico: DOWN")

            elif state in STOP_VALUES and last_sent != "STOP":
                ser.write(b"STOP\n")
                last_sent = "STOP"
                print("Enviado al Pico: STOP")

            time.sleep(0.5)
    finally:
        ser.close()
        print("Cerrando conexión serie con el Pico.")


if __name__ == "__main__":
    main()
