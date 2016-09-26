import socket

HOST = '127.0.0.1'
PORT = 6969
USER = 'test'
PASS = 'pass'

def command(f, cmd):
    f.write(cmd + "\n")
    f.flush()

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((HOST,PORT))

f = s.makefile()
f.readline() # read 'OK'
command(f, "LOGIN " + USER + " " + PASS)
f.readline() # read 'OK'

# Read turns left
command(f, "TURNS_LEFT")
f.readline() # read 'OK'
command(f, "WAIT")
f.readline() # read 'OK'
print f.readline().strip()
