import serial


PORT = "COM3"   
BAUDRATE = 115200

ser = serial.Serial(PORT, BAUDRATE, timeout=1)
print(f"Conectado a {PORT}.")
print("Write 'm' for MOVING, 's' for STOP, 'q' for exit.")

try:
    while True:
        cmd = input("> ").strip().lower()
        if cmd == "m":
            ser.write(b"MOVING\n")
            print("Sending: MOVING")
        elif cmd == "s":
            ser.write(b"STOP\n")
            print("Sending: STOP")
        elif cmd == "q":
            print("Exit...")
            break
        else:
            print("true comands: m = MOVING, s = STOP, q = exit")
finally:
    ser.close()
