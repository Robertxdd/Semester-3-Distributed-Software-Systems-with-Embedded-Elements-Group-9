import sys
import time
import uselect
from machine import Pin

led = Pin(7, Pin.OUT)

poll = uselect.poll()
poll.register(sys.stdin, uselect.POLLIN)

state = "STOP"

print("PicoBricks LED control (USB serial)")
print("LED en GPIO 7 (lado derecho)")
print("Comandos: MOVING / STOP")

def read_command():
    events = poll.poll(0)
    if events:
        line = sys.stdin.readline().strip().upper()
        return line
    return None

while True:
    cmd = read_command()
    if cmd in ("MOVING", "STOP"):
        state = cmd
        print("Estado cambiado a:", state)

    if state == "MOVING":
        led.toggle()
        time.sleep(0.2)
    else:
        led.off()
        time.sleep(0.2)
