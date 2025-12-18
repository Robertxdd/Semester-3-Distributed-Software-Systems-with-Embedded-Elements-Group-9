"""
MicroPython script for Raspberry Pi Pico that listens to USB serial commands
and controls a Pico Bricks LED module on GPIO 7.

Command protocol (sent from PC over USB serial):
  - "UP", "DOWN", "MOVING" or "LED_ON": turn LED ON and print "DESKO IS MOVING"
  - "STOP" or "LED_OFF": turn LED OFF and print "DESKO STOPPED"

The loop is non-blocking: serial input is polled so the board can react
immediately without being held up by blocking reads. Save this file as
main.py on the Pico so it runs automatically at power-up.
"""
import sys
import time
import uselect
from machine import Pin

# GPIO where the Pico Bricks LED module is connected.
LED_PIN = 7

# How long the LED stays on after a command (ms).
# Lower this (e.g. 100–300) if you want the LED to flash only on button clicks.
AUTO_OFF_MS = 200

# Instantiate LED output and start with it turned off.
led = Pin(LED_PIN, Pin.OUT)
led.off()

# Last time we turned the LED on (ticks_ms), for auto-off.
last_on_ms = None

# Set up a poll object to check USB serial without blocking.
poller = uselect.poll()
poller.register(sys.stdin, uselect.POLLIN)


def handle_command(command):
    """Process a single uppercase command string and act on the LED."""
    global last_on_ms

    if command in ("UP", "DOWN", "MOVING", "LED_ON"):
        led.on()
        last_on_ms = time.ticks_ms()
        print("DESKO IS MOVING")
    elif command in ("STOP", "LED_OFF"):
        led.off()
        last_on_ms = None
        print("DESKO STOPPED")


def read_command_non_blocking():
    """
    Return the next command if available, otherwise None.
    Polling keeps the loop responsive instead of blocking on readline().
    """
    if not poller.poll(0):
        return None

    # readline() returns a string; strip whitespace and uppercase it.
    line = sys.stdin.readline()
    if not line:
        return None
    return line.strip().upper()


def main():
    """Main loop: watch USB serial forever and react to commands."""
    global last_on_ms

    while True:
        command = read_command_non_blocking()
        if command:
            handle_command(command)

        if last_on_ms is not None and time.ticks_diff(time.ticks_ms(), last_on_ms) >= AUTO_OFF_MS:
            led.off()
            last_on_ms = None

        # Tiny sleep to avoid a tight spin while still staying responsive.
        time.sleep_ms(20)


if __name__ == "__main__":
    main()
