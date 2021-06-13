import time
import serial
import RPi.GPIO as GPIO
import struct
from time import sleep

def crc16(data):
    crc = 0xFFFF
    l = len(data)
    i = 0
    while i < l:
        j = 0
        crc = crc ^ data[i]
        while j < 8:
            if (crc & 0x1):
                mask = 0xA001
            else:
                mask = 0x00
            crc = ((crc >> 1) & 0x7FFF) ^ mask
            j += 1
        i += 1
    if crc < 0:
        crc -= 256
    result = chr(crc % 256).encode() + chr(crc // 256).encode('latin-1')
    return result

GPIO.setmode(GPIO.BOARD)

send = serial.Serial(
    port='/dev/serial0',
    baudrate = 9600,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=5
)

print ('Connected:', send.isOpen())

addr = 0x0048ed7d
f = 0x04
l = 0x0A
id = 0x788A

# chunk = 0x0048ed7d040A788A
# chunk = b'04 77 93 89 04 0A 78 8A 04 D6'
chunk = b'\x04\x77\x93\x89\x04\x0A\x78\x8A\x04\xD6'

packet = bytearray()
packet.append(0x04)
packet.append(0x77)
packet.append(0x93)
packet.append(0x89)
packet.append(0x04)
packet.append(0x0A)
packet.append(0x78)
packet.append(0x04)
packet.append(0xD6)

# # chunk = struct.pa ck('>L', int(26222790))
# # chunk += b'\x2f'
# checksum = crc16(chunk)
# print(checksum)

GPIO.setup(11, GPIO.OUT, initial=GPIO.HIGH)
GPIO.setup(13, GPIO.OUT, initial=GPIO.HIGH)
send.write(chunk)
send.flush()
GPIO.setup(11, GPIO.OUT, initial=GPIO.LOW)
GPIO.setup(13, GPIO.OUT, initial=GPIO.LOW)
# time.sleep(2)

out = send.read(100)
print(out)
# while True:
#    if( send.in_waiting>0 ) :
#       receive = send.read(send.in_waiting)
#       print ('Receive byte: ',receive)
# #       send.write(b'Send: ')
# #       send.write(receive)
# #       send.write(b' byte\n\r')
# # send.close()

GPIO.cleanup()
