"""
Simple MicroPython program for Pico/PicoBricks.
Listens for "LED_ON" / "LED_OFF" over stdin (USB serial) and toggles the LED.
"""
from machine import Pin  # type: ignore
import sys


def get_led_pin():
    # Pico W supports "LED"; classic Pico uses GPIO 25. Try both.
    try:
        return Pin("LED", Pin.OUT)
    except Exception:
        return Pin(25, Pin.OUT)


led = get_led_pin()


def handle_command(cmd: str) -> None:
    cmd = cmd.strip().upper()
    if cmd == "LED_ON":
        led.value(1)
    elif cmd == "LED_OFF":
        led.value(0)


while True:
    line = sys.stdin.readline()
    if not line:
        continue
    handle_command(line)
