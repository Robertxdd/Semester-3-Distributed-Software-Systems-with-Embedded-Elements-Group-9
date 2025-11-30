import time
import serial
import requests

PORT = "COM4"
BAUDRATE = 115200


API_URL = "http://127.0.0.1:8000/api/desk/1/state"

MOVING_VALUES = {"MOVING", "UP", "DOWN"}  
STOP_VALUES = {"IDLE", "STOPPED"}         

def get_desk_state():
    """
    Llama a la API de tu proyecto y devuelve un string con el estado,
    por ejemplo: 'MOVING', 'IDLE', 'UP', 'DOWN', etc.
    """
    try:
        r = requests.get(API_URL, timeout=1)
        data = r.json()

        
        state = str(data.get("state", "")).upper()
        return state
    except Exception as e:
        print("Error consultando API:", e)
        return "UNKNOWN"

def main():
    
    ser = serial.Serial(PORT, BAUDRATE, timeout=1)
    print(f"Conectado al Pico en {PORT}.")
    print("Leyendo estado del desk desde la API y enviando MOVING/STOP...")

    last_sent = None  

    try:
        while True:
            state = get_desk_state()
            print("Estado desk:", state)

            if state in MOVING_VALUES and last_sent != "MOVING":
                ser.write(b"MOVING\n")
                last_sent = "MOVING"
                print("Enviado al Pico: MOVING")

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
