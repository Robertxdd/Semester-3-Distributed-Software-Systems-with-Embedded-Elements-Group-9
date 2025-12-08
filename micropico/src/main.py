"""
MicroPython script for Raspberry Pi Pico that listens to USB serial commands
and controls a Pico Bricks LED module on GPIO 15.

Command protocol (sent from PC over USB serial):
  - "UP", "DOWN" or "MOVING": turn LED ON and print "DESKO IS MOVING"
  - "STOP": turn LED OFF and print "DESKO STOPPED"

The loop is non-blocking: serial input is polled so the board can react
immediately without being held up by blocking reads. Save this file as
main.py on the Pico so it runs automatically at power-up.
"""
import sys
import time
import uselect
from machine import Pin

# GPIO where the Pico Bricks LED module is connected.
LED_PIN = 15

# Instantiate LED output and start with it turned off.
led = Pin(LED_PIN, Pin.OUT)
led.off()

# Set up a poll object to check USB serial without blocking.
poller = uselect.poll()
poller.register(sys.stdin, uselect.POLLIN)


def handle_command(command):
    """Process a single uppercase command string and act on the LED."""
    if command in ("UP", "DOWN", "MOVING"):
        led.on()
        print("DESKO IS MOVING")
    elif command == "STOP":
        led.off()
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
    while True:
        command = read_command_non_blocking()
        if command:
            handle_command(command)

        # Tiny sleep to avoid a tight spin while still staying responsive.
        time.sleep_ms(20)


if __name__ == "__main__":
    main()
