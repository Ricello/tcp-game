# TCP/IP Game Server

## Usage
- `npm install` to install dependencies
- `npm start` to start the server

## Example
``` shell
netcat 127.0.0.1 6969
MY_ID
ERR 00 # Not connected
LOGIN aa 00
OK
MY_ID
OK
0
LOGIN bb 11
ERR 02 # Already connected
```

## Supported commands
- Login: `LOGIN name password`
- Test id: `MY_ID`

## Error list
- **ERR 00** - Not connected
- **ERR 01** - Command not supported

### Login
- **ERR 02** - Wrong login or password
- **ERR 03** - Already logged in